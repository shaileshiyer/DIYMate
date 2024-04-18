import { ModelResult, OperationSite, OperationTrigger, OperationType } from "@core/shared/types";
import { ChoiceOperation } from "./choice_operation";
import { TemplateResult, html } from "lit";
import { CustomImagePromptParams } from "@core/shared/interfaces";
import { SerializedCursor } from "@core/services/cursor_service";
import { computed, makeObservable } from "mobx";
import { TextInputControl } from "./operation_controls";
import { ServiceProvider } from "./operation";
import { ControlsStep } from "./steps";

/**
 * Generates an DIY instruction based on the image.
 */
export class CustomImagePromptOperation extends ChoiceOperation {
    static override isAvailable(
        operationSite: OperationSite,
        documentSite: OperationSite
    ) {
        return operationSite === OperationSite.IMAGE_NODE_SELECTION;
    }

    static id = OperationType.IMAGE_CUSTOM_PROMPT;
    static operationType = OperationType.IMAGE_CUSTOM_PROMPT;

    instantiatedWithPromptText = false;

    constructor(
        serviceProvider: ServiceProvider,
        trigger: OperationTrigger,
        instancePrompt: string = ""
    ) {
        super(serviceProvider, trigger);
        makeObservable(this, { instruction: computed });
        if (instancePrompt) {
            this.instantiatedWithPromptText = true;
            this.instanceControls.instruction.value = instancePrompt;
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
            this.instanceControls,
            "Use a Custom prompt"
        );
        this.setCurrentStep(controlsStep);
        return controlsStep.getPromise();
    }

    get instruction() {
        return this.instanceControls.instruction.value;
    }

    protected getLoadingMessage(): string | TemplateResult {
        return html`Using the prompt for the image: ${this.instruction}`;
    }

    static override getButtonLabel(...params: any[]): string | TemplateResult {
        return "custom image prompt";
    }

    static override getDescription(...params: any[]): string | TemplateResult {
        return "Generate text for the image with your own prompt";
    }

    private getOperatingPosition(): SerializedCursor {
        const operationData = this.getOperationData();
        return { from: operationData.cursorEnd, to: operationData.cursorEnd };
    }

    private getParams(): CustomImagePromptParams {
        const operationData = this.getOperationData();
        const { nodeAttrs } = operationData;
        const { alt = "", src = "", title = "" } = nodeAttrs;
        return {
            alt,
            src,
            title,
            pre: operationData.preText,
            post: operationData.postText,
            instruction:this.instruction,
        };
    }

    async run(): Promise<void> {
        const operatingPosition = this.getOperatingPosition();
        this.textEditorService.insertLoadingNode(operatingPosition);
        const params = this.getParams();
        const choices = await this.getModel().customImagePrompt(params);
        this.setChoices(choices);
    }

    onSelectChoice(choice: ModelResult, index: number): void {
        const operatingPosition = this.getOperatingPosition();
        const choiceContent = this.textEditorService.converter.makeHtml(
            choice.content
        );
        this.textEditorService.insertGeneratedText(
            choiceContent,
            operatingPosition
        );
    }
    onPendingChoice(choice: ModelResult, index: number): void {
        const operatingPosition = this.getOperatingPosition();
        const choiceContent = this.textEditorService.converter.makeHtml(
            choice.content
        );
        this.textEditorService.insertChoiceNode(
            choiceContent,
            operatingPosition
        );
    }

    override instanceControls = {
        instruction: new TextInputControl({
            prefix: "prompt",
            description: "A custom prompt for the image.",
            value: CustomImagePromptOperation.controls.instruction.value,
        }),
    };

    static override controls = {
        instruction: new TextInputControl({
            prefix: "prompt",
            description: "A custom prompt for the image",
            value: "describe the image",
            placeholder:"describe the image"
        }),
    };
}
