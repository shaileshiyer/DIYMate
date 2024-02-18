import { DIYMateContext } from "context";
import { OpenAIModel } from "..";
import { OutlinePromptParams } from "@core/shared/interfaces";
import { ModelMessage } from "types";
import { ModelParams } from "../api";

export const defaultOutlinePrompt: string = `Generate a DIY tutorial outline with image suggestions in the following JSON format:
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



export function makePromptHandler(model: OpenAIModel, context: DIYMateContext) {

  
    /** Return the actual prompt handler */
    return async function outline(params: OutlinePromptParams) {
        // const promptContext = getPromptContext();
        // const prompt = generatePrompt(params.text);
        // const inputText = promptContext + prompt;

        const userMessages: ModelMessage[] = [
            { role: 'system', content: 'You are a DIY Tutorial Assistant that generates outline for a DIY Tutorial for the author to start with.' },
            { role: 'user', content: `Given the description of the DIY Project:\n${params.description}\n ${params.outlinePrompt ?? defaultOutlinePrompt}` },
        ];

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
        return model.query(userMessages,modelParams);
    };

}