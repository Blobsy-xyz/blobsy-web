import {instanceToPlain, plainToClass} from "class-transformer";
import {BigIntTransformer} from "../src/core/types.js";

class TestClass {
    @BigIntTransformer()
    num: bigint;

    constructor(num: bigint) {
        this.num = num;
    }
}

describe('BigIntTransformer', () => {
    it('should serialize BigInt to string', () => {
        const testObject = new TestClass(123n);
        const plainObject = instanceToPlain(testObject);
        expect(plainObject.num).toBe('123');
    });

    it('should deserialize string to BigInt', () => {
        const plainObject = {num: '123'};
        const testObject = plainToClass(TestClass, plainObject);
        expect(testObject.num).toBe(123n);
    });
});