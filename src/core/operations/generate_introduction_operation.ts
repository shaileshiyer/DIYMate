import { ModelResult, OperationSite, OperationType } from "@core/shared/types";
import { ChoiceOperation } from "./choice_operation";
import { TemplateResult } from "lit";
import { GenerateIntroductionPromptParams, OperationData } from "@core/shared/interfaces";
import { SerializedCursor } from "@core/services/cursor_service";
import { createModelResult } from "@models/utils";

/**
 * generates an introduction for this diy tutorial.
 */
export class GenerateIntroductionOperation extends ChoiceOperation {
    
    static override isAvailable( operationSite: OperationSite,documentSite: OperationSite) {
        return (
            documentSite === OperationSite.DIY_INTRODUCTION
        );
    }

    static id = OperationType.GENERATE_INTRODUCTION;
    static operationType = OperationType.GENERATE_INTRODUCTION;

    protected getLoadingMessage(): string | TemplateResult {
        return 'Generating introduction...';
    }

    static override getButtonLabel(...params: any[]): string | TemplateResult {
        return 'generate introduction';    
    }

    static override getDescription(...params: any[]): string | TemplateResult {
        return 'Generate an introduction for this tutorial';    
    }

    private getOperatingPosition():SerializedCursor{
        const sectionRange = this.cursorService.getCurrentSectionRange();
        return sectionRange
    }

    private getParams(operation:OperationData,sectionRange:SerializedCursor):GenerateIntroductionPromptParams{
        const [pre,post] = this.textEditorService.getPreandPostMarkdown(sectionRange);
        return {
            pre,
            post,
        }
    }

    

    async run(): Promise<void> {
        const operationData = this.getOperationData();
        const operatingPosition = this.getOperatingPosition();
        const originalIntro = this.textEditorService.getMarkdownFromRange(operatingPosition);
        this.textEditorService.insertSelectionMarkAtPosition(operatingPosition);
        this.textEditorService.insertLoadingNode({from:operatingPosition.to,to:operatingPosition.to});
        const params= this.getParams(operationData,operatingPosition);
        const choices = await this.getModel().generateIntroduction(params);

        const modelResult = createModelResult(originalIntro);
        this.setChoices(choices,modelResult);
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
