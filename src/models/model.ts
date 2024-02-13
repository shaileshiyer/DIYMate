import { ContextService } from "@core/services/context_service";
import { SessionService } from "@core/services/session_service";
import { DIYMateContext } from "context";
import { ModelMessage, ModelResults } from "types";
import { dedupeResults } from "./utils";

interface ServiceProvider {
    sessionService: SessionService;
    contextService: ContextService;
}

export type MakePromptHandlerFn<T> = (
    model: Model,
    context: DIYMateContext
) => (params: T) => Promise<ModelResults>

export interface OutlinePromptParams{
    description:string;
    outlinePrompt?:string;
}

export abstract class Model {
    constructor(private readonly serviceProvider: ServiceProvider) {
        this.makePromptHandler = this.makePromptHandler.bind(this);
    }

    get sessionService() {
        return this.serviceProvider.sessionService;
    }

    get contextService() {
        return this.serviceProvider.contextService;
    }

    get context() {
        return this.contextService.getContext();
    }

    wrap(text: string) {
        return text;
    }

    getBlank() {
        return '';
    }

    abstract getPrefix(): string;

    insertBlank(pre: string, post: string) {
        return `${pre}${this.getBlank()}${post}`;
    }

    makePromptHandler<T>(
        makePromptHandlerFn: MakePromptHandlerFn<T>
    ): (params: T) => Promise<ModelResults> {
        const promptHandlerFn = makePromptHandlerFn(this, this.context);
        return async function promptHandler(params: T) {
            const results = await promptHandlerFn(params);
            return dedupeResults(results);
        }
    }

    parseResults(results: ModelResults) {
        return results;
    }

    query(modelMessage: ModelMessage| ModelMessage[]): Promise<ModelResults> {
        throw new Error('Not yet implemented');
    }

    async outline(params:OutlinePromptParams):Promise<ModelResults>{
        throw new Error('Not yet Implemented');
    }

}