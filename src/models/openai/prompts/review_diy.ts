import { DIYMateContext } from "@context/index";


import { OpenAIDialogModel } from "../dialog";
import { DialogParams } from "@models/dialog_model";
import { ReviewDIYPromptParams } from "@core/shared/interfaces";

export function makePromptHandler(
    model: OpenAIDialogModel,
    context: DIYMateContext
) {
    function generatePrompt(text: string): DialogParams {
        return {
            messages: [
                { role: "user", content: `CURRENT DIY TUTORIAL:\n ${text}\n` },
                {
                    role: "instruction",
                    content: "Review the text of the given DIY tutorial and provide a list of suggestions for ONLY the text for each step of the DIY Tutorial "+
                     "for the author so that it is easier to understand and follow for an reading audience of varying skill levels "+
                     "and experience in DIY.",
                },
            ],
        };
    }

    return async function reviewDIY(params: ReviewDIYPromptParams) {
        const userMessages = generatePrompt(params.text);

        return model.query(userMessages);

    };
}
