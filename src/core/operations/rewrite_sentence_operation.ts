import { ModelResult, OperationSite, OperationTrigger, OperationType } from "@core/shared/types";
import { ChoiceOperation } from "./choice_operation";
import { TemplateResult, html } from "lit";
import { SerializedCursor } from "@core/services/cursor_service";
import { ElaboratePromptParams, FreeformPromptParams, OperationControls, OperationData, RewriteSelectionPromptParams, RewriteSentencePromptParams } from "@core/shared/interfaces";
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
export class RewriteSentenceOperation extends ChoiceOperation {
    
    static override isAvailable( operationSite: OperationSite,documentSite: OperationSite) {
        return (
             operationSite === OperationSite.WITHIN_SENTENCE
        );
    }

    static override id = OperationType.REWRITE_SENTENCE;
    static operationType = OperationType.REWRITE_SENTENCE;

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
        return html`Rewriting sentence: ${this.howToRewrite}`;
    }

    static override getButtonLabel(...params: any[]): string | TemplateResult {
        return 'rewrite the sentence';    
    }

    static override getDescription(...params: any[]): string | TemplateResult {
        return 'rewrites current sentence';    
    }

    private getOperatingPosition():SerializedCursor{
        const operationData = this.getOperationData();
        const currentSentenceRange = this.sentencesService.currentSentenceSerializedRange;
        if (currentSentenceRange===null){
            return {from:operationData.cursorStart,to:operationData.cursorEnd} 
        }
        return currentSentenceRange;
    }

    get howToRewrite():string{
        // return this.instantiatedWithPromptText? this.instanceControls.instruction.value: FreeFormOperation.controls.instruction.value;
        return this.instanceControls.howToRewrite.value;
    }

    private getParams(operationData:OperationData):RewriteSentencePromptParams{
        // const markdownText = this.textEditorService.getMarkdownText();
        const currentSentenceRange = this.sentencesService.currentSentenceSerializedRange;
        if (currentSentenceRange===null ){
            return {
                pre:'',
                post:'',
                toRewrite:'',
                howToRewrite:'',
            }
        }
        const currentSentence = this.sentencesService.currentSentence;
        const [pre,post] = this.textEditorService.getPreandPostMarkdown(currentSentenceRange);
        return{
            pre:pre,
            post:post,
            toRewrite: currentSentence,
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
        const choices = await this.getModel().rewriteSentence(params);
        const originalText = createModelResult(params.toRewrite);
        this.setChoices(choices,originalText);
    }

    onPendingChoice(choice: ModelResult, index: number): void {
        const operatingPosition = this.getOperatingPosition();
        // const choiceContent = this.textEditorService.converter.makeHtml(choice.content);
        this.textEditorService.insertChoiceInline(choice.content,operatingPosition);
    }

    onSelectChoice(choice: ModelResult, index: number): void {
        const operatingPosition = this.getOperatingPosition();
        // const choiceContent = this.textEditorService.converter.makeHtml(choice.content);
        this.textEditorService.insertGeneratedTextInline(choice.content,operatingPosition);
    }
    
    override instanceControls = {
        howToRewrite: new TextInputControl({
            prefix:'rewrite sentence',
            description:'Instructions for how to rewrite the sentence',
            value: RewriteSentenceOperation.controls.howToRewrite.value,
        })
    };

    static override controls = {
        howToRewrite: new TextInputControl({
            prefix:'rewrite sentence',
            description:'Instructions for how to rewrite the sentence',
            value:'to be concise',
        })
    };
}
