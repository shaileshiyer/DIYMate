import { DIYMateContext } from "@context/index";
import { OpenAIModel } from "..";
import { ContinuePromptParams } from "@core/shared/interfaces";
import { ModelMessage } from "@core/shared/types";
import { ModelParams } from "../api";

export function makePromptHandler(model: OpenAIModel, context: DIYMateContext){

    function generatePrompt(text:string):ModelMessage[]{
        
        const suffix = 'Continue the Tutorial:';
        return [
            { role: 'system', content: 'You are a DIY Tutorial Assistant helping the user write a DIY tutorial.' },
            { role: 'user', content: `${model.getPrefix()} ${model.wrap(text)}\n ${suffix}` },
        ];
    }


    return async function continuation(params:ContinuePromptParams) {
        const userMessages: ModelMessage[] = generatePrompt(params.text);

        const modelParams: Partial<ModelParams> = {
            n:5,
            response_format:{type:"text"},
            max_tokens:50,
            stop_sequence:'',
            temperature:1,
            top_p:1,
            frequency_penalty:0,
            presence_penalty:0,
        }
        return model.query(userMessages,modelParams);
    };


   
}