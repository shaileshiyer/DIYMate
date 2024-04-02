import { DIYMateContext } from "@context/index";


import { OpenAIDialogModel } from "../dialog";
import { DialogParams } from "@models/dialog_model";
import { ReviewDIYSelectionPromptParams } from "@core/shared/interfaces";

export function makePromptHandler(
    model: OpenAIDialogModel,
    context: DIYMateContext
) {
    function generatePrompt(pre: string,toReview:string,post:string): DialogParams {
        return {
            messages: [
                { role: "user", content: `DIY TUTORIAL with part to be reviewed:\n ${pre}<review>${toReview}</review>${post}\n part of the DIY to review:\n ${toReview}` },
                {
                    role: "instruction",
                    content: 'Review ONLY the portion of the DIY Tutorial starting with "<review>" and ending with "</review>" '+
                     'within the context of this DIY Tutorial. Suggest how that portion can be improved. Dont provide commentary '+ 
                     'for the rest of the DIY tutorial.',
                },
            ],
        };
    }

    return async function reviewDIY(params: ReviewDIYSelectionPromptParams) {
        const userMessages = generatePrompt(params.pre,params.toReview,params.post);

        return model.query(userMessages);
    };
}
