import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from './model/entity/entities.js';
import { ShoppingCartReadService } from './service/shopping-cart-read.service.js';
import { ShoppingCartQueryBuilder } from './service/query-builder.js';
import { KafkaModule } from '../kafka/kafka.module.js';
import { ShoppingCartQueryResolver } from './resolver/shopping-cart-query.resolver.js';
import { KeycloakModule } from '../security/keycloak/keycloak.module.js';
import { ShoppingCartMutationResolver } from './resolver/shopping-cart-mutation.resolver.js';
import { ShoppingCartWriteService } from './service/shopping-cart-write.service.js';

@Module({
    imports: [
        forwardRef(() => KafkaModule),
        TypeOrmModule.forFeature(entities),
        KeycloakModule,
    ],
    controllers: [],
    // Provider sind z.B. Service-Klassen fuer DI
    providers: [
        ShoppingCartReadService,
        ShoppingCartWriteService,
        ShoppingCartQueryBuilder,
        ShoppingCartQueryResolver,
        ShoppingCartMutationResolver
    ],
    // Export der Provider fuer DI in anderen Modulen
    exports: [ShoppingCartReadService, ShoppingCartWriteService],
})
export class ShoppingCartModule {}
