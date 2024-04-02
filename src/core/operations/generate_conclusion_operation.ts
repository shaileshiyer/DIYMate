import { ModelResult, OperationSite, OperationType } from "@core/shared/types";
import { ChoiceOperation } from "./choice_operation";
import { TemplateResult } from "lit";
import { GenerateConclusionPromptParams, GenerateIntroductionPromptParams, OperationData } from "@core/shared/interfaces";
import { SerializedCursor } from "@core/services/cursor_service";
import { createModelResult } from "@models/utils";

/**
 * generates an introduction for this diy tutorial.
 */
export class GenerateConclusionOperation extends ChoiceOperation {
    
    static override isAvailable( operationSite: OperationSite,documentSite: OperationSite) {
        return (
            documentSite === OperationSite.DIY_CONCLUSION
        );
    }

    static override id = OperationType.GENERATE_CONCLUSION;
    static operationType = OperationType.GENERATE_CONCLUSION;

    protected getLoadingMessage(): string | TemplateResult {
        return 'Generating conclusion...';
    }

    static override getButtonLabel(...params: any[]): string | TemplateResult {
        return 'generate conclusion';    
    }

    static override getDescription(...params: any[]): string | TemplateResult {
        return 'Generate an conclusion for this tutorial';    
    }

    private getOperatingPosition():SerializedCursor{
        const sectionRange = this.cursorService.getCurrentSectionRange();
        return sectionRange
    }

    private getParams(operation:OperationData,sectionRange:SerializedCursor):GenerateConclusionPromptParams{
        const [pre,post] = this.textEditorService.getPreandPostMarkdown(sectionRange);
        return {
            pre,
            post,
        }
    }

    

    async run(): Promise<void> {
        const operationData = this.getOperationData();
        const operatingPosition = this.getOperatingPosition();
        const originalConclusion = this.textEditorService.getMarkdownFromRange(operatingPosition);
        this.textEditorService.insertSelectionMarkAtPosition(operatingPosition);
        this.textEditorService.insertLoadingNode({from:operatingPosition.to,to:operatingPosition.to});
        const params= this.getParams(operationData,operatingPosition);
        const choices = await this.getModel().generateConclusion(params);

        const modelResult = createModelResult(originalConclusion);
        this.setChoices(choices,modelResult);
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
