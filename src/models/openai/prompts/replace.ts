import { DIYMateContext } from "@context/index";
import { OpenAIModel } from "..";
import { ReplacePromptParams } from "@core/shared/interfaces";
import { ModelMessage } from "@core/shared/types";
import { ModelParams } from "../api";
import { WordinessOption, wordinessOptions } from "@models/shared";
import { parseSentences } from "@lib/parse_sentences";

function nWordsToWordiness(length: number) {
    const index =
      wordinessOptions.findIndex((opt: WordinessOption) => length <= opt.max) ||
      0;
    return {text: wordinessOptions[index], index};
  }

export function makePromptHandler(model: OpenAIModel, context: DIYMateContext){

    function generatePrompt(
        preText:string,
        postText:string,
        nWords:number,
        ):ModelMessage[]{
        
        const prefix = model.getPrefix();
        const blank = model.getBlank();
        const DIYWithBlank = `${preText} ${blank} ${postText}`;
        const blankedSentIndex = parseSentences(preText).length - 1;
        const sentence = parseSentences(DIYWithBlank)[blankedSentIndex];
    
        const wordinessText = nWordsToWordiness(nWords).text;
        const content = `${prefix} ${model.wrap(DIYWithBlank)}\n Sentence before ${blank}: ${sentence}\n Fill in the Blank ${blank} with ${wordinessText.text}:\n `;

        
        return [
            { role: 'system', content: 'You are a DIY Tutorial assistant. Just repond with the text that goes in the blank.' },
            { role: 'user', content: content },
        ];
    }


    return async function freeform(params:ReplacePromptParams) {
        const userMessages: ModelMessage[] = generatePrompt(params.pre,params.post,params.nWords);

        const modelParams: Partial<ModelParams> = {
            n:5,
            response_format:{type:"text"},
            max_tokens:512,
            stop_sequence:'',
            temperature:1,
            top_p:1,
            frequency_penalty:0,
            presence_penalty:0,
        }
        const modelResults = model.query(userMessages,modelParams);

        const blankedSentIndex = parseSentences(params.pre).length - 1;
        const sentence = parseSentences(params.pre)[blankedSentIndex];
    
        return modelResults;
    };

  
}