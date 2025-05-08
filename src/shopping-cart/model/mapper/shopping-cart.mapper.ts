import { ShoppingCart } from "../entity/shopping-cart.entity";
import { CreateShoppingCartInput } from "../input/create-shopping-cart.input";


/**
 * Wandelt ein CreateShoppingCartInput-Objekt in eine ShoppingCart-Entität um.
 *
 * @param input Eingabeobjekt für den neuen Warenkorb
 * @returns Eine neue ShoppingCart-Entität
 */
export function createShoppingCartInputToEntity(
    input: CreateShoppingCartInput,
): ShoppingCart {
    return {
        id: undefined,
        version: undefined,
        customerId: input.customerId,
        totalAmount: undefined,
        isComplete: undefined,
        cartItems: undefined,
        created: new Date(),
        updated: new Date(),
    };
}


// export function createShoppingCartInputToShoppingCart(
//     ShoppingCartDTO: CreateShoppingCartInput
// ): ShoppingCart {
//     const ShoppingCartedItems: Item[] = ShoppingCartDTO.items.map((itemDTO: ItemInput) => {
//         const item: Item = {
//             id: undefined,
//             skuCode: itemDTO.skuCode,
//             price: itemDTO.price,
//             quantity: itemDTO.quantity,
//             ShoppingCart: undefined,
//         };
//         return item;
//     });
//     const ShoppingCart: ShoppingCart = {
//         id: undefined,
//         version: undefined,
//         ShoppingCartNumber: undefined,
//         status: 'PROCESSING',
//         totalAmount: undefined,
//         isComplete: undefined,
//         items: ShoppingCartedItems,
//         customerId: ShoppingCartDTO.customerId,
//         created: new Date(),
//         updated: new Date(),
//     };
//     return ShoppingCart;
//     }
