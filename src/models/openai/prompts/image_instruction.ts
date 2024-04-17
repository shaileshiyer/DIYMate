import { DIYMateContext } from "@context/index";
import { OpenAIModel } from "..";
import { ModelMessage } from "@core/shared/types";
import { ModelParams } from "../api";
import { ImageInstructionParams } from "@core/shared/interfaces";

export function makePromptHandler(model: OpenAIModel, context: DIYMateContext){

    function generatePrompt(alt:string,title:string,imageDataString:string,preText:string,postText:string):ModelMessage[]{
        
       
        return [
            { role: 'system', content: 'You are a DIY Tutorial Assistant helping the user generate DIY instruction from an image' },
            { 
                role: 'user', 
                content:[
                    {type:"text",text:`DIY text before the image:\n ${model.wrap(preText)} `},
                    {type:"text",text:`DIY text after the image:\n ${model.wrap(postText)} `},
                    {type:"text",text:`Image has title ${title} and alternate text ${alt}.\n`},
                    { type:"image_url", image_url:{ url:imageDataString}},
                    {type:"text", text:"\nGenerate a SINGLE DIY instruction from the above image:"},
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


    return async function imageInstruction(params:ImageInstructionParams) {
        const imageDataString:string = await getBase64StringImage(params.src);
        const userMessages: ModelMessage[] = await generatePrompt(params.alt,params.title,imageDataString,params.pre,params.post);

        const modelParams: Partial<ModelParams> = {
            n:5,
            response_format:{type:"text"},
            max_tokens:256,
            stop_sequence:'.',
            temperature:1,
            top_p:1,
            frequency_penalty:0,
            presence_penalty:0,
        }
        return model.query(userMessages,modelParams);
    };


   
}