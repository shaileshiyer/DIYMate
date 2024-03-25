import { OperationSite } from "@core/shared/types";
import { ReviewOperation } from ".";
import { TemplateResult, html } from "lit";
import { OperationData, ReviewDIYPromptParams } from "@core/shared/interfaces";

export class ReviewDIYOperation extends ReviewOperation {
    
    static override isAvailable(operationSite: OperationSite, documentSite?: OperationSite | undefined): boolean {
        return operationSite !== OperationSite.SELECTION;
    }

    protected getLoadingMessage(): string | TemplateResult {
        return 'Reviewing Current DIY...'
    }

    static override getButtonLabel(...params: any[]): string | TemplateResult {
        return 'review DIY';    
    }

    static override getDescription(...params: any[]): string | TemplateResult {
        return 'Review the entire DIY Tutorial';    
    }

    getParams(operationData:OperationData):ReviewDIYPromptParams{
        return{
            text:operationData.mdText,
        }
    }

    async run(): Promise<void> {
        const operationData = this.getOperationData();
        const params = this.getParams(operationData);

        const dialogMessages = await this.getDialogModel().reviewDIY(params);

        this.setReview(dialogMessages[0]);
    }

}