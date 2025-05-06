import { Injectable } from '@nestjs/common';
import { KafkaEventContext, KafkaEventHandler } from '../interface/kafka-event.interface.js';
import { ShoppingCartWriteService } from '../../shopping-cart/service/shopping-cart-write.service.js';
import { KafkaEvent } from '../decorators/kafka-event.decorator.js';
import { getLogger } from '../../logger/logger.js';
import { UUID } from 'crypto';
import { KafkaTopics } from '../kafka-topic.properties.js';

@KafkaEvent(KafkaTopics.ShoppingCart.CustomerDeleted)
@Injectable()
export class DeleteShoppingCartHandler implements KafkaEventHandler {
    readonly #shoppingCartWriteService: ShoppingCartWriteService;
    readonly #logger = getLogger(DeleteShoppingCartHandler.name);
    // readonly #kafkaProducer: KafkaProducerService;

    constructor(
        ShoppingCartWriteService: ShoppingCartWriteService,
        // kafkaProducer: KafkaProducerService,
    ) {
        this.#shoppingCartWriteService = ShoppingCartWriteService;
        // this.#kafkaProducer = kafkaProducer;
    }

    async handle(data: any, context: KafkaEventContext): Promise<void> {
        this.#logger.debug('DeleteShoppingCartHandle: data=%o', data);

        const customerId = data as UUID;
        const traceId = context.headers['x-b3-traceid'] ?? context.headers['x-trace-id'];

        this.#logger.debug(`[Trace ${traceId}] Lösche Warenkorb mit ID: ${customerId}`);

        try {
            const success = await this.#shoppingCartWriteService.delete({ customerId });

            if (success) {
                this.#logger.debug(`[Trace ${traceId}] Erfolgreich gelöscht: ${customerId}`);

                // await this.#kafkaProducer.sendEvent(
                //     'shopping-cart.deleted.success',
                //     'shopping-cart.deleted.success',
                //     { id: cartId },
                //     'shopping-cart-service',
                //     'v1',
                //     traceId,
                // );
            } else {
                this.#logger.warn(`[Trace ${traceId}] Kein Warenkorb gefunden mit ID: ${customerId}`);
            }
        } catch (error) {
            this.#logger.error(`[Trace ${traceId}] Fehler beim Löschen von Warenkorb:`, error);
        }
    }
}



