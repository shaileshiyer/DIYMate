import { DIYMateContext } from "@context/index";
import { OpenAIModel } from "..";
import { MetaPromptPromptParams } from "@core/shared/interfaces";
import { ModelMessage } from "@core/shared/types";
import { ModelParams } from "../api";

export function makePromptHandler(model: OpenAIModel, context: DIYMateContext){

    function generatePrompt(text:string):ModelMessage[]{
        
        const suffix = 'Next Prompt:';
        return [
            { role: 'system', content: 'You are a Prompt Engineer. You suggest ONLY a SINGLE effective and helpful custom prompt instruction for the above text from a DIY Tutorial.' },
            { role: 'user', content: `${model.getPrefix()} ${model.wrap(text)}\n${suffix}` },
        ];
    }


    return async function metaPrompt(params:MetaPromptPromptParams) {
        const userMessages: ModelMessage[] = generatePrompt(params.text);

        const modelParams: Partial<ModelParams> = {
            n:5,
            response_format:{type:"text"},
            max_tokens:256,
            stop_sequence:'',
            temperature:1,
            top_p:1,
            frequency_penalty:0,
            presence_penalty:0,
        }
        return model.query(userMessages,modelParams);
    };


   
}