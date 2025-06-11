import { Pageable } from '../../utils/pageable';
import { UUID } from 'crypto';
import { ShoppingCart } from '../entity/shopping-cart.entity';
import { SearchCriteria } from '../types/searchCriteria';

export interface FindByIdParams {
    readonly id: UUID;
    /** Sollen die Varianten mitgeladen werden? */
    readonly withItems?: boolean;
}

export interface FindParams {
    readonly searchCriteria: SearchCriteria;
    readonly pageable: Pageable;
}

/** Typdefinitionen zum Aktualisieren eines Productes mit `update`. */
export type UpdateParams = {
    /** ID des zu aktualisierenden Productes. */
    readonly id: UUID | undefined;
    /** Product-Objekt mit den aktualisierten Werten. */
    readonly shoppingCart: ShoppingCart;
    /** Versionsnummer für die aktualisierenden Werte. */
    readonly version: string;
};
