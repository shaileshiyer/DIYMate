import { ModelResult, OperationSite, OperationType } from "@core/shared/types";
import { ChoiceOperation } from "./choice_operation";
import { TemplateResult } from "lit";
import { NextSentencePromptParams, OperationData } from "@core/shared/interfaces";
import { SerializedCursor } from "@core/services/cursor_service";

/**
 * A next sentence operation that generates the next sentence.
 */
export class NextSentenceOperation extends ChoiceOperation {
    
    static override isAvailable( operationSite: OperationSite,documentSite: OperationSite) {
        return (
            operationSite === OperationSite.END_OF_SECTION ||
            operationSite === OperationSite.BETWEEN_SENTENCES
        ) && (
            documentSite !== OperationSite.DIY_TITLE &&
            documentSite !== OperationSite.DIY_SECTION_TITLE &&
            documentSite !== OperationSite.DIY_STEP_TITLE
        );
    }

    static id = OperationType.NEXT_SENTENCE;
    static operationType = OperationType.NEXT_SENTENCE;

    protected getLoadingMessage(): string | TemplateResult {
        return 'Generating text...';
    }

    static override getButtonLabel(...params: any[]): string | TemplateResult {
        return 'generate sentence';    
    }

    static override getDescription(...params: any[]): string | TemplateResult {
        return 'Generate the next sentence.';    
    }

    private getOperatingPosition():SerializedCursor{
        // const operationData = this.getOperationData();
        const nextSentenceRange = this.sentencesService.getNextSentenceRange();
        console.debug(nextSentenceRange);
        return nextSentenceRange;
    }

    private getParams(operationData:OperationData):NextSentencePromptParams{
        const prevSentence = this.sentencesService.getSentenceBeforeCursor();
        const params = {pre:operationData.preText,post: operationData.postText, previousSentence:prevSentence};
        return params;
        
    }



    async run(): Promise<void> {
        const operationData = this.getOperationData();
        const operatingPosition = this.getOperatingPosition();
        this.textEditorService.insertLoadingNode(operatingPosition);
        const params = this.getParams(operationData);
        const choices = await this.getModel().nextSentence(params);
        this.setChoices(choices);
    }

    onSelectChoice(choice: ModelResult, index: number): void {
        const operatingPosition = this.getOperatingPosition();
        // const choiceContent = this.textEditorService.converter.makeHtml(choice.content);
        this.textEditorService.insertGeneratedTextInline(choice.content,operatingPosition);
    }
    onPendingChoice(choice: ModelResult, index: number): void {
        const operatingPosition = this.getOperatingPosition();
        // const choiceContent = this.textEditorService.converter.makeHtml(choice.content);
        this.textEditorService.insertChoiceInline(choice.content,operatingPosition);
    }

}
