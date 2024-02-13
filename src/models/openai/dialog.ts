import { DialogMessage, DialogParams } from '../dialog_model';
import {DialogModel} from '../dialog_model';
import { callDialogModel,AssistantParams } from './api';

import {createModelResults} from '../utils';

import {ContextService, SessionService} from '@services/services';
import { ModelResults } from 'types';

interface ServiceProvider {
  contextService: ContextService;
  sessionService: SessionService;
}

export class OpenAIDialogModel extends DialogModel {

    constructor (serviceProvider: ServiceProvider){
        super(serviceProvider);
    }

    override async query(
        params: DialogParams,
        ): Promise<ModelResults> {
            const sessionInfo = this.sessionService.sessionInfo;

            const [assitantInstruction] = params.messages.filter((val)=> val.role === "assistant"|| val.role === "system");
            const [userMessage] = params.messages.filter((val)=>val.role === 'user');
            const assitantParams: AssistantParams = {
                session_id:this.sessionService.sessionInfo.session_id,
                thread_id:this.sessionService.sessionInfo.thread_id,
                instruction: assitantInstruction.content??'',
                message_content: userMessage.content??'',
            }

            const res = await callDialogModel(assitantParams);
            const json = await res.json();
            const responseText:string[] = json.map((val:any )=> {return val.content.text.value;});
            const results = createModelResults(responseText);
    
            return results;
    }
}