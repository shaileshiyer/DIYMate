import { DIYMateContext } from "@context/index";
import { OpenAIModel } from "..";
import { FreeformPromptParams, RewriteSelectionPromptParams } from "@core/shared/interfaces";
import { ModelMessage } from "@core/shared/types";
import { ModelParams } from "../api";

export function makePromptHandler(model: OpenAIModel, context: DIYMateContext){

    function insertBlank(pre:string,post:string){
        return `${pre}${model.getBlank}${post}`;
    }
    function generatePrompt(
        textBeforeSelection:string,
        textAfterSelection:string,
        selectionToRewrite:string,
        howToRewrite:string,
        ):ModelMessage[]{
        
        const prefix = model.getPrefix();
        const getDIYWithBlank = insertBlank(textBeforeSelection,textAfterSelection);
        const promptText = "The text to be rewritten that fills in the blank:"
        const toRewriteText = `Rewritten to be ${howToRewrite}: `


        const content = `${prefix}${model.wrap(getDIYWithBlank)}\n ${promptText}\n ${selectionToRewrite}\n ${howToRewrite} ${toRewriteText}`;

        
        return [
            { role: 'system', content: 'You are a DIY Tutorial assistant.Helping rewrite the DIY tutorial.' },
            { role: 'user', content: content },
        ];
    }


    return async function rewriteSelection(params:RewriteSelectionPromptParams) {
        const {pre,post,howToRewrite,toRewrite} = params;
        const userMessages: ModelMessage[] = generatePrompt(pre,post,toRewrite,howToRewrite);

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