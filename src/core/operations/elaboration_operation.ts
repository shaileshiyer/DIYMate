import { ModelResult, OperationSite, OperationType } from "@core/shared/types";
import { ChoiceOperation } from "./choice_operation";
import { TemplateResult } from "lit";
import { SerializedCursor } from "@core/services/cursor_service";
import { ElaboratePromptParams, OperationData } from "@core/shared/interfaces";

/**
 * an elaboration operation that elaborates on a specific detail.
 */
export class ElaborationOperation extends ChoiceOperation {
    
    static override isAvailable( operationSite: OperationSite,documentSite: OperationSite) {
        return (
            operationSite === OperationSite.SELECTION
        );
    }

    static override id = OperationType.ELABORATE;
    static operationType = OperationType.ELABORATE;

    protected getLoadingMessage(): string | TemplateResult {
        return 'Elaborating Selection...';
    }

    static override getButtonLabel(...params: any[]): string | TemplateResult {
        return 'elaborate selection';    
    }

    static override getDescription(...params: any[]): string | TemplateResult {
        return 'Elaborate on the selection';    
    }

    private getOperatingPosition():SerializedCursor{
        const operationData = this.getOperationData();
        const endOfSection = this.textEditorService.getEndOfCurrentSection({from:operationData.cursorStart,to:operationData.cursorEnd});
        return endOfSection;
    }


    private getParams(operationData:OperationData):ElaboratePromptParams{
        return{
            text:operationData.text,
            toElaborate: operationData.selectedPlainText,
        }
    }

    private getSelectionPosition(operationData:OperationData){
        return {
            from:operationData.cursorStart,
            to:operationData.cursorEnd,
        }
    }

    async run(): Promise<void> {
        const operationData = this.getOperationData();
        const operatingPosition = this.getOperatingPosition();
        const selectionPosition = this.getSelectionPosition(operationData);
        this.textEditorService.insertSelectionMark(selectionPosition);
        this.textEditorService.insertLoadingNode(operatingPosition);
        const params = this.getParams(operationData);
        const choices = await this.getModel().elaborate(params);
        this.setChoices(choices);
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
