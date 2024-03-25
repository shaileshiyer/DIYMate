import { DialogMessage, DialogMessages, DialogParams } from '../dialog_model';
import {DialogModel} from '../dialog_model';
import { callDialogModel,AssistantParams } from './api';
import {ContextService, SessionService} from '@services/services';
import { ModelResults } from '@core/shared/types';

import { makePromptHandler as reviewDIY } from './prompts/review_diy';
import { makePromptHandler as reviewDIYSelection } from './prompts/review_diy_selection';
import { ReviewDIYPromptParams, ReviewDIYSelectionPromptParams } from '@core/shared/interfaces';


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
        ): Promise<DialogMessages> {
            const [assitantInstruction] = params.messages.filter((val)=> val.role === 'instruction');
            const [userMessage] = params.messages.filter((val)=>val.role === 'user');

            const instruction = assitantInstruction? assitantInstruction.content:'';
            const assitantParams: AssistantParams = {
                session_id:this.sessionService.sessionInfo.session_id,
                thread_id:this.sessionService.sessionInfo.thread_id,
                instruction,
                message_content: userMessage? userMessage.content : '',
            }

            const res = await callDialogModel(assitantParams);
            const json = await res.json();
            const {status,response} = json;

            let responseMessages:DialogMessage[] =[]
            if (status && instruction!==''){
                // Handle an instruction
                const parsedResponse = JSON.parse(response);
                responseMessages = parsedResponse.data.map((val)=> {return {role:val.role, content:val.content[0].text.value};})
            } else if (status && instruction === ''){
                // Handle a message.
                const parsedResponse = JSON.parse(response);
                responseMessages = parsedResponse.content.map((val)=> {return {role:parsedResponse.role, content: val.text.value};})
            }
    
            return responseMessages;
    }

    override reviewDIY:(params:ReviewDIYPromptParams)=>Promise<DialogMessages> = this.makePromptHandler(reviewDIY);
    
    override reviewDIYSelection:(params:ReviewDIYSelectionPromptParams)=>Promise<DialogMessages> = this.makePromptHandler(reviewDIYSelection);

}