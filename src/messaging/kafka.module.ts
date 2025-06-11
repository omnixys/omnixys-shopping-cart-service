import { forwardRef, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { KafkaConsumerService } from './kafka-consumer.service.js';
import { KafkaEventDispatcherService } from './kafka-event-dispatcher.service.js';
import { KafkaProducerService } from './kafka-producer.service.js';
import { ShoppingCartModule } from '../shopping-cart/shopping-cart.module.js';
import { KafkaHeaderBuilder } from './kafka-header-builder.js';
import { TraceModule } from '../trace/trace.module.js';
import { OrchestratorHandler } from './handlers/orchestrator.handler.js';
import { PersonHandler } from './handlers/person.handler.js';

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
        PersonHandler,
        KafkaHeaderBuilder,
        OrchestratorHandler,
    ],
    exports: [KafkaProducerService, KafkaConsumerService],
})
export class KafkaModule {}
