import { IsUUID } from 'class-validator';

/**
 * Eingabe für das Erstellen eines neuen Warenkorbs.
 */
export class CreateShoppingCartInput {
    /**
     * Die UUID des Kunden, dem dieser Warenkorb zugeordnet werden soll.
     */
    @IsUUID()
    customerId!: string;
}
