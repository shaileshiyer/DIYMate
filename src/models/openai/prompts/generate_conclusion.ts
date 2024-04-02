import { DIYMateContext } from "@context/index";
import { OpenAIModel } from "..";

import { ModelMessage } from "@core/shared/types";
import { ModelParams } from "../api";
import { GenerateConclusionPromptParams, GenerateIntroductionPromptParams } from "@core/shared/interfaces";

export function makePromptHandler(model: OpenAIModel, context: DIYMateContext){

    function generatePrompt(
        preText:string,
        postText:string,
        ):ModelMessage[]{
        
        const prefix = model.getPrefix();
        const blank = model.getBlank();

        const DIYWithBlank = `${preText}\n${blank}\n ${postText}`
        let content = `${prefix} ${model.wrap(DIYWithBlank)}\n Generate an conclusion for this DIY Tutorial:`;

        return [
            { role: 'system', content: 'You are a DIY Tutorial assitant' },
            { role: 'user', content: content },
        ];
    }


    return async function generateIntroduction(params:GenerateConclusionPromptParams) {
        const userMessages: ModelMessage[] = generatePrompt(params.pre,params.post);

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