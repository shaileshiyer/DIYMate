import { ModelResult, OperationSite, OperationTrigger, OperationType } from "@core/shared/types";
import { ChoiceOperation } from "./choice_operation";
import { TemplateResult } from "lit";
import { SerializedCursor } from "@core/services/cursor_service";
import { ReplacePromptParams, OperationData } from "@core/shared/interfaces";
import { StepSliderControl } from "./operation_controls";
import { ControlsStep } from "./steps";
import { wordinessOptions } from "@models/shared";
import { ServiceProvider } from "./operation";
import { computed, makeObservable } from "mobx";
import { createModelResult } from "@models/utils";

const defaultNWords = wordinessOptions[1].text;


/**
 * an replace operation that replaces the selected text.
 */
export class ReplaceOperation extends ChoiceOperation {
    
    
    static override isAvailable( operationSite: OperationSite,documentSite: OperationSite) {
        return (
            operationSite === OperationSite.SELECTION
        );
    }

    constructor(serviceProvider: ServiceProvider, trigger: OperationTrigger) {
        super(serviceProvider, trigger);
        makeObservable(this,{
            nWords:computed,
        })
      }

    static override id = OperationType.REPLACE;
    static operationType = OperationType.REPLACE;

    get nWords() {
        const index = ReplaceOperation.controls.nWords.value;
        return wordinessOptions[index].max;
    }
    
      get nWordsMessage() {
        return ReplaceOperation.controls.nWords.getStepValue();
    }
    

    protected getLoadingMessage(): string | TemplateResult {
        return `Replacing Selection with ${this.nWordsMessage}...`;
    }

    static override getButtonLabel(...params: any[]): string | TemplateResult {
        return 'replace selection';    
    }

    static override getDescription(...params: any[]): string | TemplateResult {
        return 'Replace the selected text';    
    }

    override async beforeStart() {
        // Only if the operation was triggered by key command do we move into the
        // controls step to get the prompt from a user input.
        if (this.trigger !== OperationTrigger.KEY_COMMAND) return;
    
        const controlsStep = new ControlsStep(
          this.serviceProvider,
          ReplaceOperation.controls,
          'Replace the text'
        );
        this.setCurrentStep(controlsStep);
        return controlsStep.getPromise();
      }
    

    private getOperatingPosition():SerializedCursor{
        const operationData = this.getOperationData();
        return {
            from:operationData.cursorStart,
            to:operationData.cursorEnd,
        }
    }


    private getParams(operationData:OperationData):ReplacePromptParams{
        return{
            pre:operationData.preText,
            post: operationData.postText,
            nWords: this.nWords,

        }
    }

    async run(): Promise<void> {
        const operationData = this.getOperationData();
        const operatingPosition = this.getOperatingPosition();
        // const selectionPosition = this.getSelectionPosition(operationData);
        // this.textEditorService.insertSelectionMark(selectionPosition);
        this.textEditorService.insertLoadingNode(operatingPosition);
        const params = this.getParams(operationData);
        const choices = await this.getModel().replace(params);
        const original = createModelResult(operationData.selectedPlainText);
        this.setChoices(choices,original);
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

    static nWordsChoices = wordinessOptions.map((e) => e.text);

    static override controls = {
      nWords: new StepSliderControl<string>({
        prefix: 'replace with',
        suffix: (control) => {
          const stepControl = control as StepSliderControl<string>;
          return stepControl.getStepValue();
        },
        description: 'How long the suggestions should be.',
        value: ReplaceOperation.nWordsChoices.indexOf(defaultNWords),
        steps: ReplaceOperation.nWordsChoices,
      }),
    };

}
