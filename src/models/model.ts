import { ContextService } from "@core/services/context_service";
import { SessionService } from "@core/services/session_service";
import { DIYMateContext } from "context";
import { ModelMessage, ModelResults } from "@core/shared/types";
import { dedupeResults } from "./utils";
import { ContinuePromptParams, ElaboratePromptParams, FirstSentencePromptParams, FreeformPromptParams, GenerateConclusionPromptParams, GenerateIntroductionPromptParams, GenerateWithinSentencePromptParams, ImageInstructionParams, MetaPromptPromptParams, NextSentencePromptParams, OutlinePromptParams, ReplacePromptParams, RewriteEndOfSentencePromptParams, RewriteSelectionPromptParams, RewriteSentencePromptParams, SuggestRewritePromptParams } from "@core/shared/interfaces";

interface ServiceProvider {
    sessionService: SessionService;
    contextService: ContextService;
}


export abstract class Model {
    protected constructor(private readonly serviceProvider: ServiceProvider) {
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

    makePromptHandler<M extends Model,T>(
        makePromptHandlerFn:(
            model:  M,
            context: DIYMateContext
        ) => (params: T) => Promise<ModelResults>,
    ): (params: T) => Promise<ModelResults> {
        /* tslint:disable-next-line */
        const promptHandlerFn = makePromptHandlerFn(this as any, this.context);
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

    async continue(params:ContinuePromptParams):Promise<ModelResults>{
        throw new Error('Not yet Implemented');
    }
    
    async elaborate(params:ElaboratePromptParams):Promise<ModelResults>{
        throw new Error('Not yet Implemented');
    }

    async firstSentence(params:FirstSentencePromptParams):Promise<ModelResults>{
        throw new Error('Not yet Implemented');
    }

    async freeform(params:FreeformPromptParams):Promise<ModelResults>{
        throw new Error('Not yet Implemented');
    }

    async generateWithinSentence(params:GenerateWithinSentencePromptParams):Promise<ModelResults>{
        throw new Error('Not yet Implemented');
    }
    
    async metaPrompt(params:MetaPromptPromptParams):Promise<ModelResults>{
        throw new Error('Not yet Implemented');
    }
    
    async nextSentence(params:NextSentencePromptParams):Promise<ModelResults>{
        throw new Error('Not yet Implemented');
    }
    
    async replace(params:ReplacePromptParams):Promise<ModelResults>{
        throw new Error('Not yet Implemented');
    }
    
    async rewriteEndOfSentence(params:RewriteEndOfSentencePromptParams):Promise<ModelResults>{
        throw new Error('Not yet Implemented');
    }

    async rewriteSelection(params:RewriteSelectionPromptParams):Promise<ModelResults>{
        throw new Error('Not yet Implemented');
    }
    async rewriteSentence(params:RewriteSentencePromptParams):Promise<ModelResults>{
        throw new Error('Not yet Implemented');
    }
    
    async suggestRewrite(params:SuggestRewritePromptParams):Promise<ModelResults>{
        throw new Error('Not yet Implemented');
    }

    async generateIntroduction(params:GenerateIntroductionPromptParams):Promise<ModelResults>{
        throw new Error('Not yet Implemented');
    }

    async generateConclusion(params:GenerateConclusionPromptParams):Promise<ModelResults>{
        throw new Error('Not yet Implemented');
    }

    async imageInstruction(params:ImageInstructionParams):Promise<ModelResults>{
        throw new Error('Not yet Implemented');
    }
    
}