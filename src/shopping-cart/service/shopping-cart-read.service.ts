import { Injectable, NotFoundException } from '@nestjs/common';
import { ShoppingCart } from '../model/entity/shopping-cart.entity.js';
import { ShoppingCartQueryBuilder } from './query-builder.js';
import { SearchCriteria } from '../model/types/searchCriteria.js';
import { Pageable } from '../utils/pageable.js';
import { Slice } from '../utils/slice.js';
import { FindByIdParams } from '../model/interface/queryParams.interface.js';
import Decimal from 'decimal.js';
import { UUID } from 'crypto';
import { LoggerService } from '../../logger/logger.service.js';
import { LoggerPlus } from '../../logger/logger-plus.js';
import { trace, Tracer, context as otelContext } from '@opentelemetry/api';
import { handleSpanError } from '../utils/error.util.js';

@Injectable()
export class ShoppingCartReadService {
    static readonly ID_PATTERN =
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/u;

    readonly #queryBuilder: ShoppingCartQueryBuilder;
    readonly #loggerService: LoggerService;
    readonly #logger: LoggerPlus;
    readonly #tracer: Tracer;

    constructor(
        queryBuilder: ShoppingCartQueryBuilder,
        loggerService: LoggerService,
    ) {
        this.#queryBuilder = queryBuilder;
        this.#loggerService = loggerService;
        this.#logger = this.#loggerService.getLogger(
            ShoppingCartReadService.name,
        );
        this.#tracer = trace.getTracer('shopping-cart-read-service');
    }

    async findById({ id, withItems = true }: FindByIdParams) {
        return await this.#tracer.startActiveSpan(
            'shopping-cart-service.read.find-by-id',
            async (outerSpan) => {
                try {
                    return await otelContext.with(
                        trace.setSpan(otelContext.active(), outerSpan),
                        async () => {
                            this.#logger.debug(
                                'findById: id=%s, withItems=%s',
                                id,
                                withItems,
                            );

                            if (id === undefined || id === null) {
                                throw new NotFoundException(
                                    'Shopping ShoppingCart with ID %s not found',
                                    id,
                                );
                            }

                            const cart = await this.#tracer.startActiveSpan(
                                'shopping-cart-repository.find-by-id',
                                async (span) => {
                                    try {
                                        return await await this.#queryBuilder
                                            .buildId({ id, withItems })
                                            .getOne();
                                    } catch (error) {
                                        handleSpanError(
                                            span,
                                            error,
                                            this.#logger,
                                            'save',
                                        );
                                    } finally {
                                        span.end();
                                    }
                                },
                            );

                            if (cart === null) {
                                throw new NotFoundException(
                                    `No cart found with ID ${id}.`,
                                );
                            }

                            this.#logger.debug('findById: cart=%s', cart);
                            if (withItems) {
                                this.#logger.debug(
                                    'findById: abbildungen=%o',
                                    cart.cartItems,
                                );
                            }

                            const { totalAmount, isComplete } =
                                await this.#calculateCartSummary(cart);
                            cart.isComplete = isComplete;
                            cart.totalAmount = totalAmount;

                            return cart;
                        },
                    );
                } catch (error) {
                    handleSpanError(outerSpan, error, this.#logger, 'findById');
                } finally {
                    outerSpan.end();
                }
            },
        );
    }

    /**
     * Findet einen Warenkorb anhand von Username oder CustomerId.
     * Berechnet zusätzlich den Gesamtbetrag und ob der Warenkorb vollständig ist.
     *
     * @param params Objekt mit `customerUsername` oder `customerId`
     * @throws BadRequestException Wenn beides fehlt
     * @throws NotFoundException Wenn kein passender Warenkorb gefunden wurde
     * @returns Der Warenkorb mit berechnetem Gesamtbetrag und Status
     */
    async findByCustomerId({ customerId }: { customerId: UUID }) {
        return await this.#tracer.startActiveSpan(
            'shopping-cart-service.read.find-by-customer-id',
            async (outerSpan) => {
                try {
                    return await otelContext.with(
                        trace.setSpan(otelContext.active(), outerSpan),
                        async () => {
                            this.#logger.debug(
                                'findByCustomerId: customerId=%s',
                                customerId,
                            );

                            const cart = await this.#tracer.startActiveSpan(
                                'shopping-cart-repository.find-by-id',
                                async (span) => {
                                    try {
                                        return await this.#queryBuilder
                                            .buildUsernameOrCustomerId({
                                                customerId,
                                            })
                                            .getOne();
                                    } catch (error) {
                                        handleSpanError(
                                            span,
                                            error,
                                            this.#logger,
                                            'save',
                                        );
                                    } finally {
                                        span.end();
                                    }
                                },
                            );
                            if (cart === null) {
                                throw new NotFoundException(
                                    `No cart found with CustomerId ${customerId}.`,
                                );
                            }

                            this.#logger.debug(
                                'findByCustomerId: cart=%s',
                                cart,
                            );
                            this.#logger.debug(
                                'findByCustomerId: abbildungen=%o',
                                cart.cartItems,
                            );

                            const { totalAmount, isComplete } =
                                await this.#calculateCartSummary(cart);
                            cart.isComplete = isComplete;
                            cart.totalAmount = totalAmount;

                            return cart;
                        },
                    );
                } catch (error) {
                    handleSpanError(
                        outerSpan,
                        error,
                        this.#logger,
                        'findByCustomerId',
                    );
                } finally {
                    outerSpan.end();
                }
            },
        );
    }

    /**
     * Bücher asynchron suchen.
     * @param searchCriteria JSON-Objekt mit SearchCriteria.
     * @param pageable Maximale Anzahl an Datensätzen und Seitennummer.
     * @returns Ein JSON-Array mit den gefundenen Büchern.
     * @throws NotFoundException falls keine Bücher gefunden wurden.
     */
    async find(
        searchCriteria: SearchCriteria,
        pageable: Pageable,
    ): Promise<Slice<ShoppingCart>> {
        return await this.#tracer.startActiveSpan(
            'shopping-cart-service.read.find',
            async (outerSpan) => {
                try {
                    return await otelContext.with(
                        trace.setSpan(otelContext.active(), outerSpan),
                        async () => {
                            const withItems = false;
                            this.#logger.debug(
                                'find: searchCriteria=%s, withItems=%s',
                                searchCriteria,
                                withItems,
                            );

                            // Keine SearchCriteria?
                            if (searchCriteria === undefined) {
                                return await this.#findAll(pageable);
                            }
                            const keys = Object.keys(searchCriteria);
                            if (keys.length === 0) {
                                return await this.#findAll(pageable);
                            }

                            const queryBuilder = this.#queryBuilder.build(
                                false,
                                searchCriteria,
                                pageable,
                            );

                            const carts: ShoppingCart[] =
                                await this.#queryBuilder
                                    .build(withItems, searchCriteria, pageable)
                                    .getMany();

                            this.#logger.debug('find: carts=%o', carts);
                            const totalElements = await queryBuilder.getCount();
                            return this.#createSlice(carts, totalElements);
                        },
                    );
                } catch (error) {
                    handleSpanError(outerSpan, error, this.#logger, 'find');
                } finally {
                    outerSpan.end();
                }
            },
        );
    }

    /**
     * Berechnet die Gesamtsumme und den Abschlussstatus eines Warenkorbs.
     *
     * @param shoppingCart Der aktuelle Warenkorb
     * @returns Objekt mit totalAmount und isComplete
     */
    async #calculateCartSummary(
        shoppingCart: ShoppingCart,
    ): Promise<{ totalAmount: Decimal; isComplete: boolean }> {
        this.#logger.debug(
            '#calculateCartSummary: shoppingCart=%o',
            shoppingCart,
        );

        const totalAmountDecimal =
            shoppingCart.cartItems?.reduce((sum, item) => {
                const price = new Decimal(item.price); // 🔧 absichern
                return sum.add(price.mul(item.quantity));
            }, new Decimal(0)) ?? new Decimal(0);

        const totalAmount = totalAmountDecimal;
        const isComplete = (shoppingCart.cartItems?.length ?? 0) === 0;

        return { totalAmount, isComplete };
    }

    async #findAll(pageable: Pageable) {
        const queryBuilder = this.#queryBuilder.build(false, {}, pageable);
        const shoppingCarts = await queryBuilder.getMany();
        if (shoppingCarts.length === 0) {
            throw new NotFoundException(
                `Ungueltige Seite "${pageable.number}"`,
            );
        }
        const totalElements = await queryBuilder.getCount();
        return this.#createSlice(shoppingCarts, totalElements);
    }

    #createSlice(shoppingCarts: ShoppingCart[], totalElements: number) {
        const shoppingCartSlice: Slice<ShoppingCart> = {
            content: shoppingCarts,
            totalElements,
        };
        this.#logger.debug(
            'createSlice: shoppingCartSlice=%o',
            shoppingCartSlice,
        );
        return shoppingCartSlice;
    }
}
