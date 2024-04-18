import { DIYMateContext } from "@context/index";
import { OpenAIModel } from "..";
import { ModelMessage } from "@core/shared/types";
import { ModelParams } from "../api";
import { CustomImagePromptParams, ImageInstructionParams } from "@core/shared/interfaces";

export function makePromptHandler(model: OpenAIModel, context: DIYMateContext){

    function generatePrompt(alt:string,title:string,imageDataString:string,preText:string,postText:string,customInstruction:string):ModelMessage[]{
        
       
        return [
            { role: 'system', content: 'You are an Assitant for a DIY tutorial who gives an SINGLE answer to the user for their prompt about an image.' },
            { 
                role: 'user', 
                content:[
                    {type:"text",text:`DIY text before the image:\n ${model.wrap(preText)} `},
                    {type:"text",text:`DIY text after the image:\n ${model.wrap(postText)} `},
                    {type:"text",text:`Image has title ${title} and alternate text ${alt}.\n`},
                    { type:"image_url", image_url:{ url:imageDataString}},
                    {type:"text", text:`\nGenerate a response for the prompt {${customInstruction}} for the above image ending with '<END>':`},
                ],
          },
        ];
    }

    async function getBase64StringImage(src:string):Promise<string>{
        const imageResponse = await fetch(src);
        const imageBlob = await imageResponse.blob();
        
        return new Promise((resolve,reject)=>{
            try{
                const fileReader = new FileReader();
                fileReader.readAsDataURL(imageBlob);
                fileReader.onloadend = ()=>{
                    resolve(fileReader.result as string);
                }
            } catch(err){
                reject(err);
            }
        })

    }


    return async function customImagePrompt(params:CustomImagePromptParams) {
        const imageDataString:string = await getBase64StringImage(params.src);
        const userMessages: ModelMessage[] = await generatePrompt(params.alt,params.title,imageDataString,params.pre,params.post,params.instruction);

        const modelParams: Partial<ModelParams> = {
            n:5,
            response_format:{type:"text"},
            max_tokens:256,
            stop_sequence:'<END>',
            temperature:1,
            top_p:1,
            frequency_penalty:0,
            presence_penalty:0,
        }
        return model.query(userMessages,modelParams);
    };


   
}