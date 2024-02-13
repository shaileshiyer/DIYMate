import {string, z} from 'zod';

export const outlineSchema = z.object({
    description:z.string(),
    outlinePrompt:z.string(),
    target:z.string(),
})