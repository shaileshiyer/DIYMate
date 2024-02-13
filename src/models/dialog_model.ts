import { ContextService } from "@core/services/context_service";
import { SessionService } from "@core/services/session_service";
import { ModelResults } from "types";

export interface DialogMessage {
    content:string;
    role?:'system'|'user'|'assistant';
}

export interface DialogParams {
    messages:DialogMessage[];
}

interface ServiceProvider {
    contextService: ContextService;
    sessionService: SessionService;
}

export abstract class DialogModel {
    constructor(private readonly serviceProvider:ServiceProvider){}

    get contextService() {
        return this.serviceProvider.contextService;
    }

    get sessionService(){
        return this.serviceProvider.sessionService;
    }

    get context(){
        return this.contextService.getContext();
    }
    async query(params:DialogParams):Promise<ModelResults>{
        throw new Error('Not yet Implemented');
    }
}

export type DialogModelConstructor = typeof DialogModel;