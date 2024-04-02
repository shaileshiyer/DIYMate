import { DIYMateContext } from "@context/index";
import { OpenAIModel } from "..";
import { ElaboratePromptParams } from "@core/shared/interfaces";
import { ModelMessage } from "@core/shared/types";
import { ModelParams } from "../api";

export function makePromptHandler(model: OpenAIModel, context: DIYMateContext){

    function generatePrompt(
        text:string,
        subject:string,
        ):ModelMessage[]{
        
        const prefix = model.getPrefix();

        const content = `${prefix} ${model.wrap(text)}\n Describe "${subject}" in more Detail:`

        
        return [
            { role: 'system', content: 'You are a DIY Tutorial assistant helping the author to elaborate parts of their DIY tutorial.' },
            { role: 'user', content: content },
        ];
    }


    return async function elaborate(params:ElaboratePromptParams) {
        const userMessages: ModelMessage[] = generatePrompt(params.text,params.toElaborate);

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