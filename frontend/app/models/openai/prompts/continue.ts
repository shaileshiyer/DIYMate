import { ContinuePromptParams } from "@core/shared/interfaces";
import { ContinueExample,DIYmateContext } from "@context/index";
import { OperationType } from "@core/shared/types";
import { OpenAIModel } from "..";

export function makePromptHandler(model:OpenAIModel,context:DIYmateContext) {
    function generatePrompt(text:string){
        const prefix = model.getStoryPrefix;
        const suffix = 'Continue the story';
        
        return `${prefix} ${model.wrap(text)}\n${suffix} `;
    }

    function getPromptContext() {
        const examples = context.getExampleData<ContinueExample>(
          OperationType.CONTINUE
        );
        let promptContext = model.getPromptPreamble();
        examples.forEach(({input, target}) => {
          const prompt = generatePrompt(input);
          promptContext += `${prompt} ${model.wrap(target)}\n\n`;
        });
        return promptContext;
      }
    
      /** Return the actual prompt handler */
      return async function continuation(params: ContinuePromptParams) {
        const promptContext = getPromptContext();
        const prompt = generatePrompt(params.text);
        const inputText = promptContext + prompt;
        return model.query(inputText);
      };

}