import { Transform } from 'class-transformer';
import {
    IsInt,
    IsPositive,
    IsUUID,
    Validate,
    ValidationArguments,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';
import { UUID } from 'crypto';
import Decimal from 'decimal.js';

export const MAX_RATING = 5;

const number2Decimal = ({ value }: { value: Decimal.Value | undefined }) => {
    if (value === undefined) {
        return undefined;
    }

    Decimal.set({ precision: 6 });
    return Decimal(value);
};

@ValidatorConstraint({ name: 'decimalMin', async: false })
class DecimalMin implements ValidatorConstraintInterface {
    validate(value: Decimal | undefined, args: ValidationArguments) {
        if (value === undefined) {
            return true;
        }
        const [minValue]: Decimal[] = args.constraints; // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        return value.greaterThanOrEqualTo(minValue!);
    }

    defaultMessage(args: ValidationArguments) {
        return `Der Wert muss groesser oder gleich ${(args.constraints[0] as Decimal).toNumber()} sein.`;
    }
}

/**
 * Eingabe für das Hinzufügen eines Artikels zum Warenkorb.
 */
export class CreateItemInput {
    /**
     * Eindeutiger SKU-Code (Stock Keeping Unit) zur Identifikation des Artikels.
     */
    @IsUUID()
    readonly inventoryId!: UUID;

    /**
     * Anzahl des Artikels, die dem Warenkorb hinzugefügt werden soll.
     */
    @IsInt()
    @IsPositive()
    readonly quantity!: number;

    @Transform(number2Decimal)
    @Validate(DecimalMin, [Decimal(0)], {
        message: 'preis muss positiv sein.',
    })
    readonly price!: Decimal;
}
