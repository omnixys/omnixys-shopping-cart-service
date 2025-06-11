import { UseFilters, UseInterceptors } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { createPageable } from '../utils/pageable.js';
import { HttpExceptionFilter } from '../utils/http-exception.filter.js';
import { ShoppingCartReadService } from '../service/shopping-cart-read.service.js';
import { SearchCriteria } from '../model/types/searchCriteria.js';
import { Roles } from 'nest-keycloak-connect';
import { FindByIdParams } from '../model/interface/queryParams.interface.js';
import { LoggerPlus } from '../../logger/logger-plus.js';
import { LoggerService } from '../../logger/logger.service.js';
import { UUID } from 'crypto';

export type SuchkriterienInput = {
    readonly suchkriterien: SearchCriteria;
};

@Resolver('ShoppingCart')
@UseFilters(HttpExceptionFilter)
@UseInterceptors(ResponseTimeInterceptor)
export class ShoppingCartQueryResolver {
    readonly shoppingCartReadService: ShoppingCartReadService;
    readonly #loggerService: LoggerService;
    readonly #logger: LoggerPlus;

    constructor(
        shoppingCartReadService: ShoppingCartReadService,
        loggerService: LoggerService,
    ) {
        this.shoppingCartReadService = shoppingCartReadService;
        this.#loggerService = loggerService;
        this.#logger = this.#loggerService.getLogger(
            ShoppingCartQueryResolver.name,
        );
    }

    @Query('shoppingCart')
    @Roles({ roles: ['Admin', 'User'] })
    async getById(@Args() { id, withItems }: FindByIdParams) {
        this.#logger.debug('findById: id=%d, withItems=%s', id, withItems);
        const shoppingCart = await this.shoppingCartReadService.findById({
            id,
            withItems,
        });
        return shoppingCart;
    }

    @Query('shoppingCartsByCustomerId')
    @Roles({ roles: ['Admin', 'Basic', 'Supreme', 'Elite', 'User'] })
    async getByCustomer(@Args('customerId') customerId: UUID) {
        this.#logger.debug('getByCustomerId: customerId=%s', customerId);
        const shoppingCart = this.shoppingCartReadService.findByCustomerId({
            customerId,
        });
        this.#logger.debug('getByCustomerId: shoppingCart=%o');
        return shoppingCart;
    }

    @Query('shoppingCarts')
    @Roles({ roles: ['Admin'] })
    async find(
        @Args() input: SuchkriterienInput | undefined,
        @Args('page') pageableInput: { size: string; number: string },
    ) {
        this.#logger.debug('find: input=%o', input);

        const { size, number } = pageableInput;
        const pageable = createPageable({ size, number });
        const shoppingCartSlice = await this.shoppingCartReadService.find(
            input?.suchkriterien,
            pageable,
        );
        this.#logger.debug('find: buecherSlice=%o', shoppingCartSlice);
        return shoppingCartSlice.content;
    }

    // @ResolveField('rabatt')
    // rabatt(@Parent() buch: ShoppingCart, short: boolean | undefined) {
    //     if (this.#logger.isLevelEnabled('debug')) {
    //         this.#logger.debug(
    //             'rabatt: buch=%s, short=%s',
    //             buch.toString(),
    //             short,
    //         );
    //     }
    //     // "Nullish Coalescing" ab ES2020
    //     const rabatt = buch.rabatt ?? Decimal(0);
    //     const shortStr = short === undefined || short ? '%' : 'Prozent';
    //     return `${rabatt.toString()} ${shortStr}`;
    // }
}
