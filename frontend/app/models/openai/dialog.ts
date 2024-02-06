import {DialogParams} from '@core/shared/interfaces';
import {DialogModel} from '../dialog_model';
import { callDialogModel } from './api';

import {createModelResults} from '../utils';

import {ContextService, StatusService} from '@services/services';
import { ModelResults } from '@core/shared/types';
import { ChatCompletion, ChatCompletionCreateParams, ChatCompletionUserMessageParam } from 'openai/resources';

interface ServiceProvider {
  contextService: ContextService;
  statusService: StatusService;
}

export class OpenAIDialogModel extends DialogModel {

    constructor (serviceProvider: ServiceProvider){
        super(serviceProvider);
    }

    override async query(
        params: DialogParams,
        modelParams: Partial<ChatCompletionCreateParams> = {},
        ): Promise<ModelResults> {
        
            const roleAssigner = {model:"system",user:"user"}
            const userMessage: ChatCompletionUserMessageParam[] = params.messages.map((message)=> { 
                return {
                role: "user", 
                content: message.content} 
            });

            const res: ChatCompletion = await callDialogModel(userMessage) as ChatCompletion;
            const responseText = res.choices?.length ? res.choices.map((choice) => choice.message.content) : [];
            console.log('🚀 model results: ', responseText);

            const results = createModelResults(responseText);
    
            return results;
    }
}