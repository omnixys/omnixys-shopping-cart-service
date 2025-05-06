import { MaxLength, Min } from 'class-validator';

/**
 * Entity-Klasse für Abbildung ohne TypeORM.
 */
export class ItemDTO {
    @Min(0)
    readonly quantity: number;

    @MaxLength(255)
    readonly inventoryId!: string;
}
