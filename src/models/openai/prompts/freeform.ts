import { DIYMateContext } from "@context/index";
import { OpenAIModel } from "..";
import { FreeformPromptParams } from "@core/shared/interfaces";
import { ModelMessage } from "@core/shared/types";
import { ModelParams } from "../api";

export function makePromptHandler(model: OpenAIModel, context: DIYMateContext){

    function generatePrompt(
        text:string,
        instruction:string,
        ):ModelMessage[]{
        
        const prefix = model.getPrefix();

        const content = `${prefix} ${text}\n ${instruction}`;

        
        return [
            { role: 'system', content: 'You are a DIY Tutorial assistant.' },
            { role: 'user', content: content },
        ];
    }


    return async function freeform(params:FreeformPromptParams) {
        const userMessages: ModelMessage[] = generatePrompt(params.text,params.instruction);

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