import { ModelResult, OperationType } from "@core/shared/types";
import { ChoiceOperation } from "./choice_operation";
import { TemplateResult } from "lit";
import { MetaPromptPromptParams } from "@core/shared/interfaces";

/**
 * A meta prompt operation that suggests new prompts to the user.
 */
export abstract class MetaPromptOperation extends ChoiceOperation {
    override canRewriteChoice: boolean = false;
    override canStarChoice: boolean = false;

    static id = OperationType.META_PROMPT;
    static operationType = OperationType.META_PROMPT;

    override readonly isHelperOperation: boolean = true;

    abstract override onSelectChoice(choice: ModelResult): Promise<void>;

    protected getLoadingMessage(): string | TemplateResult {
        return 'Generating prompts...';
    }

    static override getButtonLabel(...params: any[]): string | TemplateResult {
        return 'get a suggested action';    
    }

    static override getDescription(...params: any[]): string | TemplateResult {
        return 'Ask the LLM for suggested actions';
    }


    async run(): Promise<void> {
        const operationData = this.getOperationData();
        const params:MetaPromptPromptParams = {text:operationData.mdText};
        const prompts = await this.getModel().metaPrompt(params);
        this.setChoices(prompts);
    }


    onPendingChoice(choice: ModelResult, index: number): void {

    }


    done(){
        this.resolve();
    }

}
