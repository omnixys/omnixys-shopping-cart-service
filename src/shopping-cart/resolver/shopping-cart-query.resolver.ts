import { UseFilters, UseInterceptors } from '@nestjs/common';
import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { createPageable } from '../utils/pageable.js';
import { HttpExceptionFilter } from '../utils/http-exception.filter.js';
import { ShoppingCartReadService } from '../service/shopping-cart-read.service.js';
import { SearchCriteria } from '../model/types/searchCriteria.js';
import { Roles } from 'nest-keycloak-connect';
import { FindByIdParams } from '../model/interface/queryParams.interface.js';
import { KeycloakService } from '../../security/keycloak/keycloak.service.js';
import { LoggerPlus } from '../../logger/logger-plus.js';
import { LoggerService } from '../../logger/logger.service.js';


export type SuchkriterienInput = {
    readonly suchkriterien: SearchCriteria;
};

@Resolver('ShoppingCart')
@UseFilters(HttpExceptionFilter)
@UseInterceptors(ResponseTimeInterceptor)
export class ShoppingCartQueryResolver {
    readonly shoppingCartReadService: ShoppingCartReadService;
    readonly #keycloakService: KeycloakService;
    readonly #loggerService: LoggerService;
    readonly #logger: LoggerPlus;

    constructor(
        shoppingCartReadService: ShoppingCartReadService,
        keycloakservice: KeycloakService,
        loggerService: LoggerService,
    ) {
        this.shoppingCartReadService = shoppingCartReadService;
        this.#keycloakService = keycloakservice;
        this.#loggerService = loggerService;
        this.#logger = this.#loggerService.getLogger(ShoppingCartQueryResolver.name);
    }

    @Query('shoppingCart')
    @Roles({ roles: ['Admin', 'User'] })
    async getById(
        @Args() { id, withItems }: FindByIdParams,
    ) {
        this.#logger.debug('findById: id=%d, withItems=%s', id, withItems);

        const shoppingCart = await this.shoppingCartReadService.findById({ id, withItems });

        // if (this.#logger.isLevelEnabled('debug')) {
        //     this.#logger.debug(
        //         'findById: shoppingCart=%s',
        //         shoppingCart.toString(),
        //     );
        // }
        return shoppingCart;
    }

    @Query('shoppingCartsByUser')
    @Roles({ roles: ['Admin', 'Basic', 'Supreme', 'Elite', 'User'] })
    async getByUsername(@Context() context: any) {
        this.#logger.debug('getByUsername: context=%o', context)
        const { username } = await this.#keycloakService.getToken(context);
        this.#logger.debug('getByUsername: username=%s', username)

        const shoppingCart = this.shoppingCartReadService.findByUsernameOrCustomerId({ customerUsername: username })
        this.#logger.debug('getByUsername: shoppingCart=%o');
        return shoppingCart;
    }

    @Query('shoppingCarts')
    @Roles({ roles: ['Admin'] })
    async find(
        @Args() input: SuchkriterienInput | undefined,
        @Context() context: any,
        @Args('page') pageableInput: {size: string, number: string}
    ) {
        this.#logger.debug('find: input=%o', input);

        const rawAuth = context.req?.headers?.authorization;
        const token = typeof rawAuth === 'string' && rawAuth.startsWith('Bearer ')
            ? rawAuth.slice(7)
            : null;

        const [, payloadStr] = (token as string).split('.');
        const payloadDecoded = atob(payloadStr);
        const payload = JSON.parse(payloadDecoded);
        const { exp, realm_access } = payload;
        this.#logger.debug('#logPayload: exp=%s', exp);
        const { roles } = realm_access;
        this.#logger.debug('rollen: %o ', roles)

        const { size, number } = pageableInput;
        const pageable = createPageable({size, number});
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
