import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ItemDTO } from './item.dto.js';

export const MAX_RATING = 5;

/**
 * Entity-Klasse für Bücher ohne TypeORM und ohne Referenzen.
 */
export class ShoppingCartDTOOhneRef {
    readonly customerId!: string;
}

/**
 * Entity-Klasse für Bücher ohne TypeORM.
 */
export class ShoppingCartDTO extends ShoppingCartDTOOhneRef {
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ItemDTO)
    readonly items: ItemDTO[] | undefined;
}
