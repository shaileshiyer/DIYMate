import { OperationSite } from "@core/shared/types";
import { ReviewOperation } from ".";
import { TemplateResult, html } from "lit";
import { OperationData, ReviewDIYPromptParams, ReviewDIYSelectionPromptParams } from "@core/shared/interfaces";

export class ReviewDIYSelectionOperation extends ReviewOperation {
    
    static override isAvailable(operationSite: OperationSite, documentSite?: OperationSite | undefined): boolean {
        return operationSite === OperationSite.SELECTION;
    }

    protected getLoadingMessage(): string | TemplateResult {
        return 'Reviewing Selection...'
    }

    static override getButtonLabel(...params: any[]): string | TemplateResult {
        return 'review selection';    
    }

    static override getDescription(...params: any[]): string | TemplateResult {
        return 'Review a part of the DIY Tutorial.';    
    }

    getParams(operationData:OperationData):ReviewDIYSelectionPromptParams{
        return{
            pre:operationData.preText,
            toReview:operationData.selectedText,
            post:operationData.postText,
        }
    }

    async run(): Promise<void> {
        const operationData = this.getOperationData();
        const params = this.getParams(operationData);

        const dialogMessages = await this.getDialogModel().reviewDIYSelection(params);

        this.setReview(dialogMessages[0]);
    }

}