import { DIYMateContext } from "@context/index";
import { ContextService } from "@core/services/context_service";
import { SessionService } from "@core/services/session_service";
import { ReviewDIYPromptParams, ReviewDIYSelectionPromptParams } from "@core/shared/interfaces";

export interface DialogMessage {
    content:string;
    role?:'system'|'user'|'assistant'|'instruction';
}

export type DialogMessages = DialogMessage[];
export interface DialogParams {
    messages:DialogMessages;
}


interface ServiceProvider {
    contextService: ContextService;
    sessionService: SessionService;
}

export abstract class DialogModel {
    constructor(private readonly serviceProvider:ServiceProvider){
        this.makePromptHandler = this.makePromptHandler.bind(this);
    }

    get contextService() {
        return this.serviceProvider.contextService;
    }

    get sessionService(){
        return this.serviceProvider.sessionService;
    }

    get context(){
        return this.contextService.getContext();
    }
    async query(params:DialogParams):Promise<DialogMessages>{
        throw new Error('Not yet Implemented');
    }

    makePromptHandler<M extends DialogModel,T>(
        makePromptHandlerFn:(
            model:  M,
            context: DIYMateContext
        ) => (params: T) => Promise<DialogMessages>,
    ): (params: T) => Promise<DialogMessages> {
        /* tslint:disable-next-line */
        const promptHandlerFn = makePromptHandlerFn(this as any, this.context);
        return async function promptHandler(params: T) {
            const results = await promptHandlerFn(params);
            return results;
        }
    }

    async reviewDIY(params:ReviewDIYPromptParams):Promise<DialogMessages>{
        throw new Error('Not yet Implemented');
    }
    async reviewDIYSelection(params:ReviewDIYSelectionPromptParams):Promise<DialogMessages>{
        throw new Error('Not yet Implemented');
    }

}

export type DialogModelConstructor = typeof DialogModel;