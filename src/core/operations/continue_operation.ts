import { ModelResult, OperationSite, OperationType } from "@core/shared/types";
import { ChoiceOperation } from "./choice_operation";
import { TemplateResult } from "lit";
import { SerializedLexicalRange } from "@core/services/cursor_service";

/**
 * A continuation appends text to the end of the current section.
 */
export class ContinueOperation extends ChoiceOperation {
    static override isAvailable(
        operationSite: OperationSite,
        documentSite: OperationSite,
    ) {
        return (
            operationSite === OperationSite.END_OF_SECTION ||
            operationSite === OperationSite.EMPTY_SECTION
        );
    }

    static override id = OperationType.CONTINUE;
    protected getLoadingMessage(): string | TemplateResult {
        return 'Generating text...';
    }

    static override getButtonLabel(...params: any[]): string | TemplateResult {
        return 'generate text';    
    }

    static override getDescription(...params: any[]): string | TemplateResult {
        return 'Generate text from the cursor.';    
    }

    private getOperatingPosition():SerializedLexicalRange{
        return this.cursorService.getSerializedRange();
    }



    run(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    onSelectChoice(choice: ModelResult, index: number): void {
        throw new Error("Method not implemented.");
    }
    onPendingChoice(choice: ModelResult, index: number): void {
        throw new Error("Method not implemented.");
    }

}
