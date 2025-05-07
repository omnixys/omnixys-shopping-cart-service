import { type ApolloDriverConfig } from '@nestjs/apollo';
import {
    type MiddlewareConsumer,
    Module,
    type NestModule,
} from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from './admin/admin.module.js';
import { DevModule } from './config/dev/dev.module.js';
import { graphQlModuleOptions2 } from './config/graphql.js';
import { typeOrmModuleOptions } from './config/typeormOptions.js';
import { LoggerModule } from './logger/logger.module.js';
import { RequestLoggerMiddleware } from './logger/request-logger.middleware.js';
import { KafkaModule } from './messaging/kafka.module.js';
import { ShoppingCartModule } from './shopping-cart/shopping-cart.module.js';

@Module({
    imports: [
        AdminModule,
        DevModule,
        GraphQLModule.forRoot<ApolloDriverConfig>(graphQlModuleOptions2),
        LoggerModule,
        TypeOrmModule.forRoot(typeOrmModuleOptions),
        KafkaModule,
        ShoppingCartModule,
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(RequestLoggerMiddleware).forRoutes('admin', 'graphql');
    }
}
