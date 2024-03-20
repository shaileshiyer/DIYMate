import { DIYMateContext } from "context";
import { OpenAIModel } from "..";
import { OutlinePromptParams } from "@core/shared/interfaces";
import { ModelMessage } from "@core/shared/types";
import { ModelParams } from "../api";

export const defaultOutlineDescription: string = "It should be brief and have short sentences.";



export function makePromptHandler(model: OpenAIModel, context: DIYMateContext) {

    function generatePrompt(params:OutlinePromptParams){
        const prefix = "Given the description of the DIY Project:";
        const outlineDescriptionPrefix = "The outline to be generated is described as follows:";
        const outlineFormatInstruction: string = `Generate a DIY tutorial outline in the following JSON format:
        \`\`\`JSON
        {
        "title": "Title of the DIY Project",
        "heroshot_alt_text": "Alternate text for the hero shot",
        "introduction": "Introduction to the DIY Project",
        "materials":["material 1","material 2"],
        "tools":["tool 1","tool 2"],
        "competences":["competence 1","competences 2"],
        "safety_instruction":["safety 1","safety 2","safety 3"],
        "steps":[
            {
            "index": 0,
            "title": "step title",
            "image_alt_text":"Alternate text for image for this step.",
            "materials_in_step":["material 1","material 2"],
            "tools_in_step":["tool 1","tool 2"],
            "instructions":["instruction 1","instruction 2"]
            },
            {
            "index": 1,
            "title": "step title",
            "image_alt_text":"Alternate text for image for this step.",
            "materials_in_step":["material 1","material 2"],
            "tools_in_step":["tool 1","tool 2"],
            "instructions":["instruction 1","instruction 2"]
            }],
            "conclusion":{
            "final_image_alt_text":"Alternate text for final image",
            "text":"Summarize the DIY tutorial"
            }
        }
        \`\`\`
        `;


        const userContent = `${prefix}\n${params.description}\n${outlineDescriptionPrefix}\n${params.outlineDescription ?? defaultOutlineDescription}\n ${outlineFormatInstruction}`


        const userMessages: ModelMessage[] = [
            { role: 'system', content: 'You are a DIY Tutorial Assistant that generates outline for a DIY Tutorial for the author to start with.' },
            { role: 'user', content:userContent },
        ];

        return userMessages;
    }
  
    /** Return the actual prompt handler */
    return async function outline(params: OutlinePromptParams) {
        // const promptContext = getPromptContext();
        const prompt = generatePrompt(params);
        // const inputText = promptContext + prompt;

       

        const modelParams: Partial<ModelParams> = {
            n:1,
            response_format:{type:"json_object"},
            max_tokens:2000,
            stop_sequence:'',
            temperature:1,
            top_p:1,
            frequency_penalty:0,
            presence_penalty:0,
        }
        return model.query(prompt,modelParams);
    };

}