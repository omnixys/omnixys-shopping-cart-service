// src/messaging/handlers/person.handler.ts
import { Injectable } from '@nestjs/common';
import {
    KafkaEventContext,
    KafkaEventHandler,
} from '../interface/kafka-event.interface.js';
import { ShoppingCartWriteService } from '../../shopping-cart/service/shopping-cart-write.service.js';
import { createShoppingCartInputToEntity } from '../../shopping-cart/model/mapper/shopping-cart.mapper.js';
import {
    KafkaEvent,
    KafkaHandler,
} from '../decorators/kafka-event.decorator.js';
import { getLogger } from '../../logger/logger.js';
import { KafkaTopics } from '../kafka-topic.properties.js';
import { CreateShoppingCartInput } from '../../shopping-cart/model/input/create-shopping-cart.input.js';
import { UUID } from 'crypto';

@KafkaHandler('person')
@Injectable()
export class PersonHandler implements KafkaEventHandler {
    readonly #shoppingCartWriteService: ShoppingCartWriteService;
    readonly #logger = getLogger(PersonHandler.name);

    constructor(ShoppingCartWriteService: ShoppingCartWriteService) {
        this.#shoppingCartWriteService = ShoppingCartWriteService;
    }

    @KafkaEvent(KafkaTopics.person.create, KafkaTopics.person.delete)
    async handle(
        topic: string,
        data: any,
        context: KafkaEventContext,
    ): Promise<void> {
        this.#logger.info(`Person-Kommando empfangen: ${topic}`);

        switch (topic) {
            case KafkaTopics.person.create:
                await this.#create(data);
                break;
            case KafkaTopics.person.delete:
                await this.#delete(data, context);
                break;
        }
    }

    async #create(data: CreateShoppingCartInput): Promise<void> {
        this.#logger.debug('CreateShoppingCartHandler: data=%o', data);

        const entity = createShoppingCartInputToEntity(data);
        await this.#shoppingCartWriteService.create(entity);
    }

    async #delete(data: any, context: KafkaEventContext): Promise<void> {
        this.#logger.debug('DeleteShoppingCartHandle: data=%o', data);

        const customerId = data as UUID;
        const traceId =
            context.headers['x-b3-traceid'] ?? context.headers['x-trace-id'];

        this.#logger.debug(
            `[Trace ${traceId}] Lösche Warenkorb mit ID: ${customerId}`,
        );

        try {
            const success = await this.#shoppingCartWriteService.delete({
                customerId,
            });

            if (success) {
                this.#logger.debug(
                    `[Trace ${traceId}] Erfolgreich gelöscht: ${customerId}`,
                );

                // await this.#kafkaProducer.sendEvent(
                //     'shopping-cart.deleted.success',
                //     'shopping-cart.deleted.success',
                //     { id: cartId },
                //     'shopping-cart-service',
                //     'v1',
                //     traceId,
                // );
            } else {
                this.#logger.warn(
                    `[Trace ${traceId}] Kein Warenkorb gefunden mit ID: ${customerId}`,
                );
            }
        } catch (error) {
            this.#logger.error(
                `[Trace ${traceId}] Fehler beim Löschen von Warenkorb:`,
                error,
            );
        }
    }
}
