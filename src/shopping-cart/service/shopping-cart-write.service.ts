import { DeleteResult, In, type Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ShoppingCart } from '../model/entity/shopping-cart.entity.js';
import { ShoppingCartReadService } from './shopping-cart-read.service.js';
import { InjectRepository } from '@nestjs/typeorm';
import { UUID } from 'crypto';
import { UpdateParams } from '../model/interface/queryParams.interface.js';
import { VersionInvalidException, VersionOutdatedException } from '../errors/exceptions.js';
import { Item } from '../model/entity/item.entity.js';
import { KafkaConsumerService } from '../../messaging/kafka-consumer.service.js';
import { getKafkaTopicsBy } from '../../messaging/kafka-topic.properties.js';
import { LoggerService } from '../../logger/logger.service.js';
import { LoggerPlus } from '../../logger/logger-plus.js';
import { KafkaProducerService } from '../../messaging/kafka-producer.service.js';
import { trace, Tracer, context as otelContext } from '@opentelemetry/api';
import { handleSpanError } from '../utils/error.util.js';
import { TraceContextProvider } from '../../trace/trace-context.provider.js';
@Injectable()
export class ShoppingCartWriteService {
    private static readonly VERSION_PATTERN = /^"\d{1,3}"/u;

    readonly #shoppingCartRepository: Repository<ShoppingCart>;
    readonly #itemRepository: Repository<Item>;

    readonly #readService: ShoppingCartReadService;
    readonly #kafkaConsumerService: KafkaConsumerService;
    readonly #kafkaProducerService: KafkaProducerService;
    readonly #loggerService: LoggerService;
    readonly #logger: LoggerPlus
    readonly #traceContextProvider: TraceContextProvider;
    readonly #tracer : Tracer

    constructor(
        @InjectRepository(ShoppingCart) shoppingCartRepository: Repository<ShoppingCart>,
        @InjectRepository(Item) itemRepository: Repository<Item>,
        readService: ShoppingCartReadService,
        kafkaConsumerService: KafkaConsumerService,
        loggerService: LoggerService,
        kafkaProducerService: KafkaProducerService,
        traceContextProvider: TraceContextProvider,
    ) {
        this.#shoppingCartRepository = shoppingCartRepository;
        this.#itemRepository = itemRepository;
        this.#readService = readService;
        this.#kafkaConsumerService = kafkaConsumerService;
        this.#loggerService = loggerService;
        this.#logger = this.#loggerService.getLogger(ShoppingCartWriteService.name);
        this.#kafkaProducerService = kafkaProducerService;
        this.#traceContextProvider = traceContextProvider;
        this.#tracer = trace.getTracer('shopping-cart-write-service');
    }

    async onModuleInit(): Promise<void> {
        await this.#kafkaConsumerService.consume(
            { topics: getKafkaTopicsBy(['person', 'orchestrator']), },
        );

    }

    async create(shoppingCart: ShoppingCart): Promise<UUID> {
        return await this.#tracer.startActiveSpan('shopping-cart-service.write.create-cart', async (outerSpan) => {
            try {
                return await otelContext.with(trace.setSpan(otelContext.active(), outerSpan), async () => {
                    this.#logger.debug('create: shoppingCart=%o', shoppingCart);

                    const shoppingCartDb = await this.#tracer.startActiveSpan('shopping-cart-repository.save', async (span) => {
                        try {
                            return await this.#shoppingCartRepository.save(shoppingCart);
                        } catch (error) {
                            handleSpanError(span, error, this.#logger, 'save');
                        } finally {
                            span.end();
                        }
                    });

                    this.#logger.debug('create: shoppingCartDb=%o', shoppingCartDb);

                    const trace = this.#traceContextProvider.getContext();

                    await this.#tracer.startActiveSpan('kafka.send-messages', async (span) => {
                        try {
                            await this.#kafkaProducerService.sendMailNotification(
                                'create',
                                { customerId: shoppingCart.customerId },
                                'shopping-cart-service',
                                trace,
                            );
                        } catch (error) {
                            handleSpanError(span, error, this.#logger, 'kafka');
                        } finally {
                            span.end();
                        }
                    });

                    return shoppingCartDb.id;
                });
            } catch (error) {
                handleSpanError(outerSpan, error, this.#logger, 'create');
            } finally {
                outerSpan.end();
            }
        });
    }


    async addItem(newItem: Item, customerId: UUID): Promise<UUID> {
       return await this.#tracer.startActiveSpan('shopping-cart.addItem', async (span) => {
           try {
               return await otelContext.with(trace.setSpan(otelContext.active(), span), async () => {

                   this.#logger.debug('addItem: item=%o, username=%s', newItem, customerId);

                   const shoppingCart = await this.#readService.findByCustomerId({ customerId });
                   newItem.shoppingCart = shoppingCart
                   const savedItem = await this.#itemRepository.save(newItem);
                   this.#logger.debug('addItem: savedItem=%o', savedItem);
                   return savedItem.id!;
               });
            } catch (error) {
                handleSpanError(span, error, this.#logger, 'addItem');
            } finally {
                span.end();
            }
        });
    }

    async addItemAndReserve(newItem: Item, customerId: UUID): Promise<UUID> {
        return await this.#tracer.startActiveSpan('shopping-cart.addItem', async (span) => {
            try {
                return await otelContext.with(trace.setSpan(otelContext.active(), span), async () => {

                    this.#logger.debug('addItem: item=%o, username=%s', newItem, customerId);

                    const shoppingCart = await this.#readService.findByCustomerId({ customerId });
                    newItem.shoppingCart = shoppingCart
                    const savedItem = await this.#itemRepository.save(newItem);
                    this.#logger.debug('addItem: savedItem=%o', savedItem);

                    const trace = this.#traceContextProvider.getContext();

                    this.#kafkaProducerService.reserveItem(
                        {
                            item: newItem,
                            customerId
                        },
                        'shopping-cart.read-service',
                        trace,
                    )
                    return savedItem.id!;
                });
            } catch (error) {
                handleSpanError(span, error, this.#logger, 'addItem');
            } finally {
                span.end();
            }
        });
    }

    async removeItem(id: UUID, customerId: UUID): Promise<boolean> {
       return await this.#tracer.startActiveSpan('shopping-cart.removeItem', async (span) => {
           try {
               return await otelContext.with(trace.setSpan(otelContext.active(), span), async () => {
                   this.#logger.debug('removeItem: id=%s', id);

                   const item = await this.#itemRepository.findOne({ where: { id } });
                   this.#logger.debug('removeItem: item=%o', item);

                   if (!item) {
                       this.#logger.warn(`removeItem: Item mit ID ${id} nicht gefunden`);
                       throw new NotFoundException(`Es gibt kein Item mit der ID ${id}.`);
                   }

                   const trace = this.#traceContextProvider.getContext();
                   this.#kafkaProducerService.releaseItem(
                       {
                           item,
                           customerId
                       },
                       'shopping-cart.read-service',
                       trace,
                   )
                   await this.#itemRepository.remove(item);

                   this.#logger.debug('removeItem: erfolgreich entfernt');
                   return true;
               });
            } catch (error) {
                handleSpanError(span, error, this.#logger, 'removeItem');
            } finally {
                span.end();
            }
        });
    }

    /**
 * Entfernt alle Items mit gegebenen inventoryIds für den Warenkorb eines bestimmten Benutzers.
 *
 * @param inventoryIds Liste der Inventory-IDs, die entfernt werden sollen
 * @param customerUsername Benutzername des Kunden
 * @returns true, wenn erfolgreich verarbeitet
 */
    async orderItems(inventoryIds: string[], customerId: UUID): Promise<boolean>{
        return await this.#tracer.startActiveSpan('shopping-cart.orderItems', async (span) => {
            try {
                return await otelContext.with(trace.setSpan(otelContext.active(), span), async () => {
                    this.#logger.debug('orderItems: inventoryIds=%o, customerId=%s', inventoryIds, customerId);

                    const cart = await this.#readService.findByCustomerId({ customerId });

                    const itemsToDelete = await this.#itemRepository.find({
                        where: {
                            shoppingCart: { id: cart.id },
                            inventoryId: In(inventoryIds),
                        },
                    });

                    this.#logger.debug('Zu löschende Items: %o', itemsToDelete);

                    await this.#itemRepository.remove(itemsToDelete);

                    this.#logger.debug('Items erfolgreich gelöscht.');

                    return true;
                });
            } catch (error) {
                handleSpanError(span, error, this.#logger, 'orderItems');
            } finally {
                span.end();
            }
        });
    }

    async update({ id, shoppingCart, version }: UpdateParams) {
        return await this.#tracer.startActiveSpan('shopping-cart.update', async (span) => {
            try {
                return await otelContext.with(trace.setSpan(otelContext.active(), span), async () => {
                    this.#logger.debug(
                        'update: id=%d, shoppingCart=%o, version=%s',
                        id,
                        shoppingCart,
                        version,
                    );
                    if (id === undefined) {
                        this.#logger.debug('update: Keine gueltige ID');
                        throw new NotFoundException(`Es gibt kein ShoppingCart mit der ID ${id}.`);
                    }

                    const validateResult = await this.#validateUpdate(shoppingCart, id, version);
                    this.#logger.debug('update: validateResult=%o', validateResult);
                    if (!(validateResult instanceof ShoppingCart)) {
                        return validateResult;
                    }

                    const shoppingCartNeu = validateResult;
                    const merged = this.#shoppingCartRepository.merge(shoppingCartNeu, shoppingCart);
                    this.#logger.debug('update: merged=%o', merged);
                    const updated = await this.#shoppingCartRepository.save(merged); // implizite Transaktion
                    this.#logger.debug('update: updated=%o', updated);

                    return updated.version!;
                });
            } catch (error) {
                handleSpanError(span, error, this.#logger, 'update');
            } finally {
                span.end();
            }
        });
    }

    /**
 * Löscht einen Warenkorb sowie alle zugehörigen Items asynchron anhand seiner ID.
 *
 * @param id Die eindeutige UUID des Warenkorbs, der gelöscht werden soll.
 * @returns true, wenn der Warenkorb erfolgreich gelöscht wurde, andernfalls false.
 * @throws NotFoundException, wenn der Warenkorb nicht existiert.
 */
    async delete(
        { customerId }: { customerId?: UUID }
    ): Promise<boolean>{
        return await this.#tracer.startActiveSpan('shopping-cart.delete', async (span) => {
            try {
                return await otelContext.with(trace.setSpan(otelContext.active(), span), async () => {
                    this.#logger.debug('delete: id=%s', customerId);

                    const shoppingCart = await this.#readService.findByCustomerId({ customerId });

                    this.#logger.debug('delete: shoppingCart=%o', shoppingCart)

                    let deleteResult: DeleteResult | undefined;

                    await this.#shoppingCartRepository.manager.transaction(async (transactionalMgr) => {
                        const cartItems = shoppingCart.cartItems ?? [];

                        if (cartItems.length > 0) {
                            const itemIds = cartItems.map((item) => item.id);
                            await transactionalMgr.delete(Item, itemIds);
                            this.#logger.debug('delete: cartItems gelöscht: %o', itemIds);
                        }

                        deleteResult = await transactionalMgr.delete(ShoppingCart, shoppingCart.id);
                        this.#logger.debug('delete: deleteResult=%o', deleteResult);
                    });

                    const wasDeleted = !!deleteResult?.affected;

                    const trace = this.#traceContextProvider.getContext();

                    if (wasDeleted) {
                        await this.#kafkaProducerService.sendMailNotification(
                            'delete',
                            { customerId },
                            'shopping-cart-service',
                            trace,
                        );
                    }

                    return wasDeleted;
                });
            } catch (error) {
                handleSpanError(span, error, this.#logger, 'delete');
            } finally {
                span.end();
            }
        });

    }

    async deleteById(id: UUID): Promise<boolean>{
        return await this.#tracer.startActiveSpan('shopping-cart.deleteById', async (span) => {
            try {
                return await otelContext.with(trace.setSpan(otelContext.active(), span), async () => {
                    this.#logger.debug('deleteById: id=%s', id);

                    const shoppingCart = await this.#readService.findById({ id })
                    this.#logger.debug('deleteById: shoppingCart=%o', shoppingCart)

                    let deleteResult: DeleteResult | undefined;

                    await this.#shoppingCartRepository.manager.transaction(async (transactionalMgr) => {
                        const cartItems = shoppingCart.cartItems ?? [];

                        for (const item of cartItems) {
                            await transactionalMgr.delete(Item, item.id);
                        }

                        deleteResult = await transactionalMgr.delete(ShoppingCart, id);
                        this.#logger.debug('deleteById: deleteResult=%o', deleteResult);
                    });

                    return Boolean(deleteResult?.affected && deleteResult.affected > 0);
                });
            } catch (error) {
                handleSpanError(span, error, this.#logger, 'deleteById');
                } finally {
                span.end();
            }
        });
    }


    async #validateUpdate(
        shoppingCart: ShoppingCart,
        id: UUID,
        versionStr: string,
    ): Promise<ShoppingCart> {
        this.#logger.debug(
            '#validateUpdate: shoppingCart=%o, id=%s, versionStr=%s',
            shoppingCart,
            id,
            versionStr,
        );
        if (!ShoppingCartWriteService.VERSION_PATTERN.test(versionStr)) {
            throw new VersionInvalidException(versionStr);
        }

        const version = Number.parseInt(versionStr.slice(1, -1), 10);
        this.#logger.debug(
            '#validateUpdate: shoppingCart=%o, version=%d',
            shoppingCart,
            version,
        );

        const shoppingCartDb = await this.#readService.findById({ id });

        // nullish coalescing
        const versionDb = shoppingCartDb.version!;
        if (version < versionDb) {
            this.#logger.debug('#validateUpdate: versionDb=%d', version);
            throw new VersionOutdatedException(version);
        }
        this.#logger.debug('#validateUpdate: shoppingCartDb=%o', shoppingCartDb);
        return shoppingCartDb;
    }
}
