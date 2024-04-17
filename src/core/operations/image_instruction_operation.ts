import { ModelResult, OperationSite, OperationType } from "@core/shared/types";
import { ChoiceOperation } from "./choice_operation";
import { TemplateResult } from "lit";
import { ContinuePromptParams, ImageInstructionParams, OperationData } from "@core/shared/interfaces";
import { SerializedCursor } from "@core/services/cursor_service";

/**
 * Generates an DIY instruction based on the image.
 */
export class ImageInstructionOperation extends ChoiceOperation {
    
    static override isAvailable( operationSite: OperationSite,documentSite: OperationSite) {
        return (
            operationSite === OperationSite.IMAGE_NODE_SELECTION
        );
    }

    static id = OperationType.IMAGE_DIY_INSTRUCTION;
    static operationType = OperationType.IMAGE_DIY_INSTRUCTION;

    protected getLoadingMessage(): string | TemplateResult {
        return 'Generating instruction from image...';
    }

    static override getButtonLabel(...params: any[]): string | TemplateResult {
        return 'generate Instruction';    
    }

    static override getDescription(...params: any[]): string | TemplateResult {
        return 'Generates an instruction from the selected image';    
    }

    private getOperatingPosition():SerializedCursor{
        const operationData = this.getOperationData();
        return {from:operationData.cursorEnd,to:operationData.cursorEnd};
    }


    private getParams():ImageInstructionParams{
        const operationData = this.getOperationData();
        const {nodeAttrs} = operationData;
        const {alt='',src='',title=''} = nodeAttrs;
        return {
            alt,
            src,
            title,
            pre:operationData.preText,
            post:operationData.postText,
        }
    }


    async run(): Promise<void> {
        const operatingPosition = this.getOperatingPosition();
        this.textEditorService.insertLoadingNode(operatingPosition);
        const params = this.getParams();
        const choices = await this.getModel().imageInstruction(params);
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
