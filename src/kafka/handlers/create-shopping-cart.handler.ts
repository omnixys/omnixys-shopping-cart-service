import { Injectable } from '@nestjs/common';
import { KafkaEventHandler } from '../interface/kafka-event.interface.js';
import { ShoppingCartWriteService } from '../../shopping-cart/service/shopping-cart-write.service.js';
import { createShoppingCartInputToEntity } from '../../shopping-cart/model/mapper/shopping-cart.mapper.js';
import { KafkaEvent } from '../decorators/kafka-event.decorator.js';
import { getLogger } from '../../logger/logger.js';
import { KafkaTopics } from '../kafka-topic.properties.js';
import { CreateShoppingCartInput } from '../../shopping-cart/model/input/create-shopping-cart.input.js';

@KafkaEvent(KafkaTopics.ShoppingCart.CustomerCreated)
@Injectable()
export class CreateShoppingCartHandler implements KafkaEventHandler {
    readonly #shoppingCartWriteService: ShoppingCartWriteService;
    readonly #logger = getLogger(CreateShoppingCartHandler.name);

    constructor(
        ShoppingCartWriteService: ShoppingCartWriteService,
    ) {
        this.#shoppingCartWriteService = ShoppingCartWriteService;
    }

    async handle(data: CreateShoppingCartInput): Promise<void> {
        this.#logger.debug('CreateShoppingCartHandler: data=%o', data);

        const entity = createShoppingCartInputToEntity(data);
        await this.#shoppingCartWriteService.create(entity);
    }
}
