import {
    DIYStructureJSON,
    ModelResult,
    OperationSite,
    OperationTrigger,
    OperationType,
} from "@core/shared/types";
import { ChoiceOperation } from "./choice_operation";
import { TemplateResult, html } from "lit";
import { SerializedCursor } from "@core/services/cursor_service";
import {
    OperationControls,
    OperationData,
    OutlinePromptParams,
} from "@core/shared/interfaces";
import { TextInputControl, TextareaControl } from "./operation_controls";
import { ServiceProvider } from "./operation";
import { ControlsStep } from "./steps";
import { computed, makeObservable } from "mobx";


/**
 * generate an outline for the DIY tutorial from the user.
 */
export class OutlineOperation extends ChoiceOperation {
    static override isAvailable(
        operationSite: OperationSite,
        documentSite: OperationSite
    ) {
        return operationSite === OperationSite.EMPTY_DOCUMENT;
    }

    static override id = OperationType.OUTLINE;
    static operationType = OperationType.OUTLINE;

    instantiatedWithParams = false;
    override canRewriteChoice = false;

    constructor(
        serviceProvider: ServiceProvider,
        trigger: OperationTrigger,
        diyDescription: string = "",
        outlineDescription: string = ""
    ) {
        super(serviceProvider, trigger);
        makeObservable(this, {
            diyDescription: computed,
            outlineDescription: computed,
        });
        if (diyDescription !== "" && outlineDescription !== "") {
            this.instantiatedWithParams = true;
            this.instanceControls.diyDescription.value = diyDescription;
            this.instanceControls.outlineDescription.value = outlineDescription;
        }
    }

    protected getLoadingMessage(): string | TemplateResult {
        return html`Generating DIY Outline`;
    }

    static override getButtonLabel(...params: any[]): string | TemplateResult {
        return "Generate Outline";
    }

    static override getDescription(...params: any[]): string | TemplateResult {
        return "Generate the intial outline for the DIY";
    }

    private getOperatingPosition(): SerializedCursor {
        return { from: 1, to: 1 };
    }

    get diyDescription() {
        // return this.instantiatedWithPromptText? this.instanceControls.instruction.value: FreeFormStepOperation.controls.instruction.value;
        return this.instanceControls.diyDescription.value;
    }

    get outlineDescription() {
        // return this.instantiatedWithPromptText? this.instanceControls.instruction.value: FreeFormStepOperation.controls.instruction.value;
        return this.instanceControls.outlineDescription.value;
    }

    override async beforeStart() {
        // If the operation was instantiated with a prompt, then there's no need to
        // move into the text input step;
        if (this.instantiatedWithParams) {
            return;
        }

        // Only if the operation was triggered by key command do we move into the
        // controls step to get the prompt from a user input.
        if (this.trigger !== OperationTrigger.KEY_COMMAND) return;

        const controlsStep = new ControlsStep(
            this.serviceProvider,
            this.instanceControls,
            "Create an Outline"
        );
        this.setCurrentStep(controlsStep);
        return controlsStep.getPromise();
    }

    private getParams(): OutlinePromptParams {
        return {
            description: this.diyDescription,
            outlineDescription: this.outlineDescription,
        };
    }

    async run(): Promise<void> {
        const operatingPosition = this.getOperatingPosition();

        this.textEditorService.insertLoadingNode(operatingPosition);
        const params = this.getParams();
        const choices = await this.getModel().outline(params);
        this.setChoices(choices);
    }

    

    onPendingChoice(choice: ModelResult, index: number): void {
        const operatingPosition = this.getOperatingPosition();

        const generatedOutlineJSON:DIYStructureJSON = JSON.parse(choice.content);
        const choiceContent = this.textEditorService.generateOutlineHtmlString(generatedOutlineJSON);
        this.textEditorService.insertChoiceNode(
            choiceContent,
            operatingPosition
        );
    }

    onSelectChoice(choice: ModelResult, index: number): void {
        const generatedOutlineJSON:DIYStructureJSON = JSON.parse(choice.content);
        this.textEditorService.insertOutline(generatedOutlineJSON)
    }

    override instanceControls = {
        diyDescription: new TextareaControl({
            prefix: "DIY Description",
            description: "Describe your DIY tutorial",
            placeholder: "Describe your DIY tutorial",
            value: OutlineOperation.controls.diyDescription.value,
        }),
        outlineDescription: new TextareaControl({
            prefix: "Outline Description",
            description: "Describe your outline",
            placeholder: "Describe your outline",
            value: OutlineOperation.controls.outlineDescription.value,
        }),
    };

    static override controls = {
        diyDescription: new TextareaControl({
            prefix: "DIY Description",
            description: "Describe your DIY tutorial",
            placeholder: "Describe your DIY tutorial",
            value: "",
        }),
        outlineDescription: new TextareaControl({
            prefix: "Outline Description",
            description: "Describe your outline",
            placeholder: "Describe your outline",
            value: "",
        }),
    };
}
