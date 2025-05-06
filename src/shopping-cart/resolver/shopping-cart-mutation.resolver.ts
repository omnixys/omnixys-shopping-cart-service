import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { Roles } from 'nest-keycloak-connect';
import { UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { KeycloakGuard } from '../../security/keycloak/guards/keycloak.guard.js';
import { HttpExceptionFilter } from '../utils/http-exception.filter.js';
import { ShoppingCartWriteService } from '../service/shopping-cart-write.service.js';
import { CreatePayload } from '../model/payloads/create.payload.js';
import { createShoppingCartInputToEntity } from '../model/mapper/shopping-cart.mapper.js';
import { CreateShoppingCartInput } from '../model/input/create-shopping-cart.input.js';
import { CreateItemInput } from '../model/input/create-item.input.js';
import { createItemInputToEntity } from '../model/mapper/item.mapper.js';
import { KeycloakService } from '../../security/keycloak/keycloak.service.js';
import { UUID } from 'crypto';
import { LoggerService } from '../../logger/logger.service.js';
import { LoggerPlus } from '../../logger/logger-plus.js';

@Resolver()
@UseGuards(KeycloakGuard)
@UseFilters(HttpExceptionFilter)
@UseInterceptors(ResponseTimeInterceptor)
export class ShoppingCartMutationResolver {
    readonly #shoppingCartWriteService: ShoppingCartWriteService;
    readonly #keycloakService: KeycloakService;
    readonly #loggerService: LoggerService;
    readonly #logger: LoggerPlus

    constructor(
        ShoppingCartWriteService: ShoppingCartWriteService,
        keycloakservice: KeycloakService,
        loggerService: LoggerService,
    ) {
        this.#shoppingCartWriteService = ShoppingCartWriteService;
        this.#keycloakService = keycloakservice;
        this.#loggerService = loggerService;
        this.#logger = this.#loggerService.getLogger(ShoppingCartMutationResolver.name);
    }

    @Mutation('createShoppingCart')
    @Roles({ roles: ['Admin', 'Basic', 'Supreme', 'Elite', 'User'] })
    async create(@Args('input') createShoppingCartInput: CreateShoppingCartInput) {
        this.#logger.debug('create: ShoppingCartDTO=%o', createShoppingCartInput);
        const ShoppingCart = createShoppingCartInputToEntity(createShoppingCartInput);
        const id = await this.#shoppingCartWriteService.create(ShoppingCart);
        // TODO BadUserInputError
        this.#logger.debug('createShoppingCart: id=%s', id);
        const payload: CreatePayload = { id };
        return payload;
    }

    @Mutation('addItem')
    @Roles({ roles: ['Admin', 'Basic', 'Supreme', 'Elite', 'User'] })
    async addItem(
        @Args('item') itemInput: CreateItemInput,
        @Context() context: any
    ){
        this.#logger.debug('addItem: input=%o', itemInput);
        const { username } = await this.#keycloakService.getToken(context);
        const item = createItemInputToEntity(itemInput);
        const itemId = await this.#shoppingCartWriteService.addItem(item, username);
        this.#logger.debug('addItem: id=%s', itemId);
        return itemId;
    }

    @Mutation('removeItem')
    @Roles({ roles: ['Admin', 'Basic', 'Supreme', 'Elite', 'User'] })
    async removeItem(
        @Args('id') id: UUID,
    ) {
        this.#logger.debug('removeItem: id=%s', id);
        return this.#shoppingCartWriteService.removeItem(id);
    }

    @Mutation('order')
    @Roles({ roles: ['Admin', 'Basic', 'Supreme', 'Elite', 'User'] })
    async order(
        @Args('inventoryIds') inventoryIds: UUID[],
        @Context() context: any
    ){
        this.#logger.debug('order: inventoryIds=%o', inventoryIds);
        const { username } = await this.#keycloakService.getToken(context);
        return this.#shoppingCartWriteService.orderItems(inventoryIds, username);
    }

    @Mutation('deleteShoppingCartByCustomerIdOrCustomerUsername')
    @Roles({ roles: ['Admin'] })
    async delete(
        @Args('customerId') customerId: UUID,
        @Args('customerUsername') customerUsername: string,
    ) {
        this.#logger.debug('delete: id=%s, username=%s', customerId, customerUsername);

        const deletePerformed = await this.#shoppingCartWriteService.delete({ customerId, customerUsername });
        this.#logger.debug('delete: deletePerformed=%s', deletePerformed);
        return deletePerformed;
    }

    @Mutation('deleteShoppingCartById')
    @Roles({ roles: ['Admin'] })
    async deleteById(
        @Args('id') id: UUID,
    ) {
        this.#logger.debug('deleteById: id=%s', id);

        const deletePerformed = await this.#shoppingCartWriteService.deleteById(id);
        this.#logger.debug('delete: deletePerformed=%s', deletePerformed);
        return deletePerformed;
    }

    // @Mutation()
    // @Roles({ roles: ['gentlecorp-admin', 'gentlecorp-user'] })
    // async update(@Args('input') updateShoppingCartInput: updateShoppingCartInput) {
    //     this.#logger.debug('update: ShoppingCart=%o', updateShoppingCartInput);

    //     const ShoppingCart = this.#ShoppingCartUpdateDtoToShoppingCart(updateShoppingCartInput);
    //     const versionStr = `"${updateShoppingCartInput.version.toString()}"`;

    //     const versionResult = await this.#orederWriteService.update({
    //         id: updateShoppingCartInput.id,
    //         ShoppingCart,
    //         version: versionStr,
    //     });
    //     // TODO BadUserInputError
    //     this.#logger.debug('updateShoppingCart: versionResult=%d', versionResult);
    //     const payload: UpdatePayload = { version: versionResult };
    //     return payload;
    // }


    // #ShoppingCartUpdateDtoToShoppingCart(ShoppingCartDTO: updateShoppingCartInput): ShoppingCart {
    //     return {
    //         id: undefined,
    //         version: undefined,
    //         ShoppingCartNumber: undefined,
    //         status: ShoppingCartDTO.status,
    //         totalAmount: undefined,
    //         isComplete: undefined,
    //         items: undefined,
    //         customerId: undefined,
    //         created: undefined,
    //         updated: new Date(),
    //     };
    // }

    // #errorMsgCreateShoppingCart(err: CreateError) {
    //     switch (err.type) {
    //         case 'IsbnExists': {
    //             return `Die ISBN ${err.isbn} existiert bereits`;
    //         }
    //         default: {
    //             return 'Unbekannter Fehler';
    //         }
    //     }
    // }

    // #errorMsgUpdateShoppingCart(err: UpdateError) {
    //     switch (err.type) {
    //         case 'ShoppingCartNotExists': {
    //             return `Es gibt kein ShoppingCart mit der ID ${err.id}`;
    //         }
    //         case 'VersionInvalid': {
    //             return `"${err.version}" ist keine gueltige Versionsnummer`;
    //         }
    //         case 'VersionOutdated': {
    //             return `Die Versionsnummer "${err.version}" ist nicht mehr aktuell`;
    //         }
    //         default: {
    //             return 'Unbekannter Fehler';
    //         }
    //     }
    // }
}
