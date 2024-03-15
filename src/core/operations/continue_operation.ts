import { ModelResult, OperationSite, OperationType } from "@core/shared/types";
import { ChoiceOperation } from "./choice_operation";
import { TemplateResult } from "lit";
import { SerializedLexicalRange } from "@core/services/cursor_service";
import { ContinuePromptParams, OperationData } from "@core/shared/interfaces";
import { RangeSelection } from "lexical";

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

    private getOperatingPosition():{start:number,end:number}{
        const operationData = this.getOperationData();
        return {start:operationData.cursorStart,end:operationData.cursorEnd};
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
        this.textEditorService.insertGeneratedText(choice.content,operatingPosition);
    }
    onPendingChoice(choice: ModelResult, index: number): void {
        const operatingPosition = this.getOperatingPosition();
        this.textEditorService.insertChoiceNode(choice.content,operatingPosition);
    }

}
