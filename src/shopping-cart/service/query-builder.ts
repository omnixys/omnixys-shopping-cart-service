import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { SearchCriteria } from '../model/types/searchCriteria.js';
import { ShoppingCart } from '../model/entity/shopping-cart.entity.js';
import { Item } from '../model/entity/item.entity.js';
import {
    DEFAULT_PAGE_NUMBER,
    DEFAULT_PAGE_SIZE,
    Pageable,
} from '../utils/pageable.js';
import { FindByIdParams } from '../model/interface/queryParams.interface.js';
import { UUID } from 'crypto';
import { LoggerService } from '../../logger/logger.service.js';
import { LoggerPlus } from '../../logger/logger-plus.js';

@Injectable()
export class ShoppingCartQueryBuilder {
    readonly #shoppingCartRepository: Repository<ShoppingCart>;
    readonly #loggerService: LoggerService;
    readonly #logger: LoggerPlus;

    readonly #shoppingCartAlias = `${ShoppingCart.name
        .charAt(0)
        .toLowerCase()}${ShoppingCart.name.slice(1)}`;

    readonly #itemAlias = `${Item.name
        .charAt(0)
        .toLowerCase()}${Item.name.slice(1)}`;

    constructor(
        @InjectRepository(ShoppingCart) repo: Repository<ShoppingCart>,
        loggerService: LoggerService,
    ) {
        this.#shoppingCartRepository = repo;
        this.#loggerService = loggerService;
        this.#logger = this.#loggerService.getLogger(ShoppingCartQueryBuilder.name);
    }

    buildId({ id, withItems }: FindByIdParams) {
        const queryBuilder = this.#shoppingCartRepository.createQueryBuilder(
            this.#shoppingCartAlias,
        );

        if (withItems) {
            queryBuilder.leftJoinAndSelect(
                `${this.#shoppingCartAlias}.cartItems`, // Korrektur hier
                this.#itemAlias,
            );
        }

        queryBuilder.where(`${this.#shoppingCartAlias}.id = :id`, {
            id,
        });
        return queryBuilder;
    }


    /**
 * Erstellt einen QueryBuilder für einen Warenkorb anhand von Username oder CustomerId.
 *
 * @param options Objekt mit optionalem customerUsername oder customerId
 * @throws Error, wenn beide Werte fehlen
 * @returns Ein QueryBuilder mit Join und entsprechender Filterbedingung
 */
    buildUsernameOrCustomerId({ customerUsername, customerId }: { customerUsername?: string, customerId?: UUID }) {
        this.#logger.debug('buildUsernameOrCustomer: customerId=%s, customerUsername=%s', customerId, customerUsername)

        const queryBuilder = this.#shoppingCartRepository.createQueryBuilder(
            this.#shoppingCartAlias,
        );

        if (customerUsername) {
            queryBuilder.where(`${this.#shoppingCartAlias}.customer_username = :username`, { username: customerUsername });
        } else if (customerId) {
            queryBuilder.where(`${this.#shoppingCartAlias}.customer_id = :customerId`, { customerId });
        } else {
            throw new Error('Entweder customerUsername oder customerId muss angegeben sein.');
        }

        queryBuilder.leftJoinAndSelect(
            `${this.#shoppingCartAlias}.cartItems`, // Korrektur hier
            this.#itemAlias,
        );

        return queryBuilder;
    }

    // Verbesserte build-Methode
    build(
        withItems: boolean = false,
        { ...props }: SearchCriteria,
        pageable: Pageable,
    ): SelectQueryBuilder<ShoppingCart> {
        this.#logger.debug('build: withItems=%s', withItems);
        this.#logger.debug('build: props=%o', props);
        this.#logger.debug('build: pageable=%o', pageable);

        let queryBuilder = this.#shoppingCartRepository.createQueryBuilder(
            this.#shoppingCartAlias,
        );

        if (withItems) {
            queryBuilder.leftJoinAndSelect(
                `${this.#shoppingCartAlias}.cartItems`,
                this.#itemAlias,
            );
        }

        // Verwenden Sie Array.reduce für eine klarere Implementierung
        // props.reduce((qb, criteria, index) => {
        //     return Object.entries(criteria).reduce((acc, [key, value]) => {
        //         if (value !== undefined && value !== null) {
        //             const param = { [key]: value };
        //             return index === 0 && acc === qb
        //                 ? acc.where(`${this.#shoppingCartAlias}.${key} = :${key}`, param)
        //                 : acc.andWhere(`${this.#shoppingCartAlias}.${key} = :${key}`, param);
        //         }
        //         return acc;
        //     }, qb);
        // }, queryBuilder);

        this.#logger.debug('build: sql=%s', queryBuilder.getSql());
        //return queryBuilder;

        if (pageable?.size === 0) {
            return queryBuilder;
        }
        const size = pageable?.size ?? DEFAULT_PAGE_SIZE;
        const number = pageable?.number ?? DEFAULT_PAGE_NUMBER;
        const skip = number * size;
        this.#logger.debug('take=%s, skip=%s', size, skip);
        return queryBuilder.take(size).skip(skip);
    }

    // toString Methode hinzufügen
    toString(): string {
        return `ShoppingCartQueryBuilder {
            shoppingCartAlias: ${this.#shoppingCartAlias},
            itemAlias: ${this.#itemAlias}
        }`;
    }
}
