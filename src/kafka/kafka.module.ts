import { forwardRef, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { KafkaConsumerService } from './kafka-consumer.service.js';
import { KafkaEventDispatcherService } from './kafka-event-dispatcher.service.js';
import { KafkaProducerService } from './kafka-producer.service.js';
import { CreateShoppingCartHandler } from './handlers/create-shopping-cart.handler.js';
import { DeleteShoppingCartHandler } from './handlers/delete-shopping-cart.handler.js';
import { ShoppingCartModule } from '../shopping-cart/shopping-cart.module.js';
import { KafkaHeaderBuilder } from './kafka-header-builder.js';
import { TraceModule } from '../trace/trace.module.js';
import { ShutdownHandler } from './handlers/shutdown.handler.js';


@Module({
    imports: [
        DiscoveryModule,
        forwardRef(() => ShoppingCartModule),
        forwardRef(() => TraceModule),
    ],
    providers: [
        KafkaProducerService,
        KafkaConsumerService,
        KafkaEventDispatcherService,
        CreateShoppingCartHandler,
        DeleteShoppingCartHandler,
        KafkaHeaderBuilder,
        ShutdownHandler,
    ],
    exports: [KafkaProducerService, KafkaConsumerService],
})
export class KafkaModule { }
