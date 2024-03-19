import { ModelResult, OperationSite, OperationType } from "@core/shared/types";
import { ChoiceOperation } from "./choice_operation";
import { TemplateResult } from "lit";
import { ContinuePromptParams, OperationData } from "@core/shared/interfaces";
import { RangeSelection } from "lexical";
import { SerializedCursor } from "@core/services/cursor_service";

/**
 * A continuation appends text to the end of the current section.
 */
export class ContinueOperation extends ChoiceOperation {
    
    static override isAvailable(
        operationSite: OperationSite,
        documentSite: OperationSite,
    ) {
        return (
            operationSite === OperationSite.END_OF_SECTION ||
            operationSite === OperationSite.EMPTY_SECTION
        );
    }

    static override id = OperationType.CONTINUE;
    static operationType = OperationType.CONTINUE;

    protected getLoadingMessage(): string | TemplateResult {
        return 'Generating text...';
    }

    static override getButtonLabel(...params: any[]): string | TemplateResult {
        return 'generate text';    
    }

    static override getDescription(...params: any[]): string | TemplateResult {
        return 'Generate text from the cursor.';    
    }

    private getOperatingPosition():SerializedCursor{
        const operationData = this.getOperationData();
        return {from:operationData.cursorStart,to:operationData.cursorEnd};
    }



    async run(): Promise<void> {
        const operationData = this.getOperationData();
        const operatingPosition = this.getOperatingPosition();
        this.textEditorService.insertLoadingNode(operatingPosition);
        const params:ContinuePromptParams = {text:operationData.preText};
        const choices = await this.getModel().continue(params);
        this.setChoices(choices);
        console.debug(this.currentStep,this.operationsService);
    }

    onSelectChoice(choice: ModelResult, index: number): void {
        const operatingPosition = this.getOperatingPosition();
        const choiceContent = this.textEditorService.converter.makeHtml(choice.content);
        this.textEditorService.insertGeneratedText(choiceContent,operatingPosition);
    }
    onPendingChoice(choice: ModelResult, index: number): void {
        const operatingPosition = this.getOperatingPosition();
        const choiceContent = this.textEditorService.converter.makeHtml(choice.content);
        this.textEditorService.insertChoiceNode(choiceContent,operatingPosition);
    }

}
