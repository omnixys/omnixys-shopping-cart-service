import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    VersionColumn,
} from 'typeorm';
import { Item } from './item.entity.js';
import { dbType } from '../../../config/db.js';
import { Exclude } from 'class-transformer';
import { UUID } from 'crypto';
import Decimal from 'decimal.js';

@Entity()
export class ShoppingCart {
    @PrimaryGeneratedColumn(`uuid`)
    id: UUID;

    @VersionColumn()
    version: number | undefined;

    @Column()
    customerId: string | undefined;

    @OneToMany(() => Item, (item) => item.shoppingCart, {
        cascade: [`insert`, `remove`],
    })
    cartItems: Item[] | undefined;

    @CreateDateColumn({
        type: dbType === `sqlite` ? `datetime` : `timestamp`,
    })
    created: Date | undefined;

    @UpdateDateColumn({
        type: dbType === `sqlite` ? `datetime` : `timestamp`,
    })
    updated: Date | undefined;

    @Exclude()
    totalAmount: Decimal | undefined;

    @Exclude()
    isComplete: boolean | undefined;


    // toString Methode hinzufügen
    public toString = (): string => {
        return JSON.stringify({
            id: this.id,
            version: this.version,
            totalAmount: this.totalAmount,
            customerId: this.customerId,
            isComplete: this.isComplete,
            cartItems: this.cartItems,
            created: this.created,
            updated: this.updated,
        });
    };
}
