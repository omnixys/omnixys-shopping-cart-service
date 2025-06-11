import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    VersionColumn,
} from 'typeorm';
import { ShoppingCart } from './shopping-cart.entity.js';
import { Exclude } from 'class-transformer';
import { UUID } from 'crypto';
import { DecimalTransformer } from '../../utils/decimal-transformer.js';
import Decimal from 'decimal.js';

@Entity()
export class Item {
    @PrimaryGeneratedColumn(`uuid`)
    id: UUID;

    @VersionColumn()
    version: number | undefined;

    @Column()
    quantity: number;

    @Column()
    inventoryId: UUID | undefined;

    @Column('decimal', {
        precision: 8,
        scale: 2,
        transformer: new DecimalTransformer(),
    })
    price: Decimal;

    @Exclude()
    name: string;

    @CreateDateColumn({
        type: 'timestamp',
    })
    readonly created: Date | undefined;

    @UpdateDateColumn({
        type: `timestamp`,
    })
    readonly updated: Date | undefined;

    @ManyToOne(() => ShoppingCart, (shoppingCart) => shoppingCart.cartItems)
    @JoinColumn({ name: 'shopping_cart_id' })
    shoppingCart: import('./shopping-cart.entity.js').ShoppingCart | undefined;

    // toString Methode anpassen
    public toString = (): string => {
        return JSON.stringify({
            id: this.id,
            version: this.version,
            quantity: this.quantity,
            inventoryId: this.inventoryId,
            price: this.price,
            name: this.name,
            created: this.created,
            updated: this.updated,
            shoppingCartId: this.shoppingCart?.id,
        });
    };
}
