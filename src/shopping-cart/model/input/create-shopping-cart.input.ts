import { IsUUID } from 'class-validator';
import { UUID } from 'node:crypto';

/**
 * Eingabe für das Erstellen eines neuen Warenkorbs.
 */
export class CreateShoppingCartInput {
    /**
     * Die UUID des Kunden, dem dieser Warenkorb zugeordnet werden soll.
     */
    @IsUUID()
    customerId!: UUID;
}
