import { DIYMateContext } from "@context/index";
import { OpenAIModel } from "..";
import { NextSentencePromptParams } from "@core/shared/interfaces";
import { ModelMessage } from "@core/shared/types";
import { ModelParams } from "../api";

export function makePromptHandler(model: OpenAIModel, context: DIYMateContext){

    function generatePrompt(
        textBeforeBlank:string,
        textAfterBlank:string,
        sentenceBeforeBlank:string,
        ):ModelMessage[]{
        
        const prefix = model.getPrefix();
        const blank = model.getBlank();

        let content = '';
        if (textBeforeBlank && textAfterBlank){
            const DIYWithBlank = `${model.wrap(textBeforeBlank)} ${blank} ${model.wrap(textAfterBlank)}`;
            const suffix = 'Sentence that comes after'
            content = `${prefix} ${DIYWithBlank}\n ${suffix} ${model.wrap(sentenceBeforeBlank)}:`;
        } else if (textBeforeBlank){
            const suffix = 'Next Sentence:'
            content = `${prefix} ${model.wrap(textBeforeBlank)} ${blank} \n ${suffix} `
        } else {
            const suffix = 'First Sentence:'
            content = `${prefix} ${model.wrap(textAfterBlank)} ${blank} \n ${suffix} `;
        }

        return [
            { role: 'system', content: 'You are a DIY Tutorial sentence generator helping the user generate the next sentence.Just repond with next sentence ONLY.' },
            { role: 'user', content: content },
        ];
    }


    return async function nextSentence(params:NextSentencePromptParams) {
        const userMessages: ModelMessage[] = generatePrompt(params.pre,params.post,params.previousSentence);

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