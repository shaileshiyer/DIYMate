import { ModelResult, OperationSite, OperationTrigger, OperationType } from "@core/shared/types";
import { ChoiceOperation } from "./choice_operation";
import { TemplateResult, html } from "lit";
import { SerializedCursor } from "@core/services/cursor_service";
import { ElaboratePromptParams, FreeformPromptParams, OperationControls, OperationData, RewriteSelectionPromptParams } from "@core/shared/interfaces";
import { TextInputControl } from "./operation_controls";
import { ServiceProvider } from "./operation";
import { ControlsStep } from "./steps";
import { computed, makeObservable } from "mobx";
import { createModelResult } from "@models/utils";

// class FreeformMetaPromptOperation extends MetaPromptOperation {
//     async onSelectChoice(choice: ModelResult) {
//       // When the user selects a prompt, we're going to trigger a new freeform
//       // prompt operation using the selected prompt. We'll do this by running
//       // a new operation on the resolution of this operation's promise.
//       this.onFinish(() => {
//         this.operationsService.startOperation(
//           () =>
//             new FreeformOperation(
//               this.serviceProvider,
//               OperationTrigger.OPERATION,
//               choice.text
//             ),
//           OperationTrigger.OPERATION
//         );
//       });
//     }
//   }

/**
 * Custom prompt from the user.
 */
export class RewriteSelectionOperation extends ChoiceOperation {
    
    static override isAvailable( operationSite: OperationSite,documentSite: OperationSite) {
        return (
             operationSite === OperationSite.SELECTION
        );
    }

    static id = OperationType.REWRITE_SELECTION;
    static operationType = OperationType.REWRITE_SELECTION;

    instantiatedWithHowToRewrite = false;

    constructor(
        serviceProvider:ServiceProvider,
        trigger: OperationTrigger,
        howToRewrite:string='',
    ){
        super(serviceProvider,trigger);
        makeObservable(this,{howToRewrite:computed});
        if(howToRewrite){
         this.instantiatedWithHowToRewrite = true;
         this.instanceControls.howToRewrite.value = howToRewrite;   
        }
    }

    protected getLoadingMessage(): string | TemplateResult {
        return html`Rewriting selection: ${this.howToRewrite}`;
    }

    static override getButtonLabel(...params: any[]): string | TemplateResult {
        return 'rewrite selection';    
    }

    static override getDescription(...params: any[]): string | TemplateResult {
        return 'rewrites selection';    
    }

    private getOperatingPosition():SerializedCursor{
        const operationData = this.getOperationData();
        return {from:operationData.cursorStart,to:operationData.cursorEnd};
    }

    get howToRewrite():string{
        // return this.instantiatedWithPromptText? this.instanceControls.instruction.value: FreeFormOperation.controls.instruction.value;
        return this.instanceControls.howToRewrite.value;
    }

    private getParams(operationData:OperationData):RewriteSelectionPromptParams{
        // const markdownText = this.textEditorService.getMarkdownText();
        return{
            pre:operationData.preText,
            post:operationData.postText,
            toRewrite:operationData.selectedText,
            howToRewrite:this.howToRewrite,
        }
    }

    override async beforeStart() {
        // If the operation was instantiated with a prompt, then there's no need to
        // move into the text input step;
        if (this.instantiatedWithHowToRewrite) {
          return;
        }
    
        // Only if the operation was triggered by key command do we move into the
        // controls step to get the prompt from a user input.
        if (this.trigger !== OperationTrigger.KEY_COMMAND) return;
    
        const controlsStep = new ControlsStep(
          this.serviceProvider,
          this.instanceControls,
          'Rewrite the text'
        );
        this.setCurrentStep(controlsStep);
        return controlsStep.getPromise();
      }


    async run(): Promise<void> {
        const operationData = this.getOperationData();
        const operatingPosition = this.getOperatingPosition();

        // this.textEditorService.insertLoadingNode(operatingPosition);
        this.textEditorService.insertSelectionMark(operatingPosition);
        const params = this.getParams(operationData);
        const choices = await this.getModel().rewriteSelection(params);
        const originalText = createModelResult(params.toRewrite);
        this.setChoices(choices,originalText);
    }

    onPendingChoice(choice: ModelResult, index: number): void {
        const operatingPosition = this.getOperatingPosition();
        const choiceContent = this.textEditorService.converter.makeHtml(choice.content);
        this.textEditorService.insertChoiceNode(choiceContent,operatingPosition);
    }

    onSelectChoice(choice: ModelResult, index: number): void {
        const operatingPosition = this.getOperatingPosition();
        const choiceContent = this.textEditorService.converter.makeHtml(choice.content);
        this.textEditorService.insertGeneratedText(choiceContent,operatingPosition);
    }
    
    override instanceControls = {
        howToRewrite: new TextInputControl({
            prefix:'rewrite text',
            description:'Instructions for how to rewrite the text',
            value: RewriteSelectionOperation.controls.howToRewrite.value,
        })
    };

    static override controls = {
        howToRewrite: new TextInputControl({
            prefix:'rewrite text',
            description:'Instructions for how to rewrite the text',
            value:'to be more descriptive',
        })
    };
}
