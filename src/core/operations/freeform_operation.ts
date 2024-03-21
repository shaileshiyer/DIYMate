import { ModelResult, OperationSite, OperationTrigger, OperationType } from "@core/shared/types";
import { ChoiceOperation } from "./choice_operation";
import { TemplateResult, html } from "lit";
import { SerializedCursor } from "@core/services/cursor_service";
import { ElaboratePromptParams, FreeformPromptParams, OperationControls, OperationData } from "@core/shared/interfaces";
import { TextInputControl } from "./operation_controls";
import { ServiceProvider } from "./operation";
import { ControlsStep } from "./steps";

/**
 * Custom prompt from the user.
 */
export class FreeFormOperation extends ChoiceOperation {
    
    static override isAvailable( operationSite: OperationSite,documentSite: OperationSite) {
        return (
            operationSite === OperationSite.EMPTY_SECTION || operationSite === OperationSite.END_OF_SECTION
        );
    }

    static override id = OperationType.FREEFORM;
    static operationType = OperationType.FREEFORM;

    instantiatedWithPromptText = false;

    constructor(
        serviceProvider:ServiceProvider,
        trigger: OperationTrigger,
        instancePrompt:string='',
    ){
        super(serviceProvider,trigger);
        if(instancePrompt){
         this.instantiatedWithPromptText = true;
         this.instanceControls.instruction.value = instancePrompt;   
        }
    }

    protected getLoadingMessage(): string | TemplateResult {
        return html`Using the prompt: ${this.instruction}`;
    }

    static override getButtonLabel(...params: any[]): string | TemplateResult {
        return 'make your own prompt';    
    }

    static override getDescription(...params: any[]): string | TemplateResult {
        return 'Generate Text with your own Prompt';    
    }

    private getOperatingPosition():SerializedCursor{
        const operationData = this.getOperationData();
        return {from:operationData.cursorStart,to:operationData.cursorEnd};
    }

    get instruction(){
        // return this.instantiatedWithPromptText? this.instanceControls.instruction.value: FreeFormOperation.controls.instruction.value;
        return this.instanceControls.instruction.value;
    }

    private getParams(operationData:OperationData):FreeformPromptParams{
        const markdownText = this.textEditorService.getMarkdownText();
        return{
            text:markdownText,
            instruction:this.instruction,
        }
    }

    override async beforeStart() {
        // If the operation was instantiated with a prompt, then there's no need to
        // move into the text input step;
        if (this.instantiatedWithPromptText) {
          return;
        }
    
        // Only if the operation was triggered by key command do we move into the
        // controls step to get the prompt from a user input.
        if (this.trigger !== OperationTrigger.KEY_COMMAND) return;
    
        const controlsStep = new ControlsStep(
          this.serviceProvider,
          FreeFormOperation.controls,
          'Use your own prompt'
        );
        this.setCurrentStep(controlsStep);
        return controlsStep.getPromise();
      }


    async run(): Promise<void> {
        const operationData = this.getOperationData();
        const operatingPosition = this.getOperatingPosition();

        this.textEditorService.insertLoadingNode(operatingPosition);
        const params = this.getParams(operationData);
        const choices = await this.getModel().freeform(params);
        this.setChoices(choices);
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
        instruction: new TextInputControl({
            prefix:'prompt',
            description:'A custom prompt to generate custom text.',
            value: FreeFormOperation.controls.instruction.value,
        })
    };

    static override controls = {
        instruction: new TextInputControl({
            prefix:'prompt',
            description:'A custom prompt to generate custom text.',
            value:'Continue the DIY.',
        })
    };
}
