import { z } from "zod";
import { outlineSchema } from "./schema";

export class DIYMateContext {
    constructor(){

    }
}

abstract class Examples<T> {
    constructor(private readonly exampleData: T[]) {}

    getExampleData():T[]{
        return [...this.exampleData];
    }
}
export type OutlineExample = z.infer<typeof outlineSchema>;