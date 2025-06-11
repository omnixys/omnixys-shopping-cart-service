import { Item } from '../entity/item.entity';
import { CreateItemInput } from '../input/create-item.input';

export function createItemInputToEntity(input: CreateItemInput): Item {
    return {
        id: undefined,
        version: undefined,
        quantity: input.quantity,
        inventoryId: input.inventoryId,
        price: input.price,
        name: undefined,
        shoppingCart: undefined,
        created: new Date(),
        updated: new Date(),
    };
}
