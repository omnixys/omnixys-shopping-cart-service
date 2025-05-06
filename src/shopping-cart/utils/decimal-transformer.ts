import { type ValueTransformer } from 'typeorm';
export class DecimalTransformer implements ValueTransformer {
    to(decimal?: number): string | undefined {
        return decimal?.toString();
    }

    from(decimal?: string): number | undefined {
        return decimal === undefined ? undefined : Number(decimal);
    }
}
