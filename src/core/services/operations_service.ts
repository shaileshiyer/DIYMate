import {
    action,
    computed,
    flow,
    isObservableArray,
    makeAutoObservable,
    makeObservable,
    observable,
    toJS,
} from "mobx";
import { CursorService } from "./cursor_service";
import { SentencesService } from "./sentences_service";
import { Service } from "./service";
import { TextEditorService, commandKeys } from "./text_editor_service";
import {
    ModelResult,
    OperationSite,
    OperationTrigger,
} from "@core/shared/types";
import { OperationClass, OperationData } from "@core/shared/interfaces";
import { Operation } from "@core/operations/operation";
import { ChoiceOperation } from "@core/operations/choice_operation";
import { ChoiceStep } from "@core/operations/steps/choice_step";
import { ServiceProvider as OperationServiceProvider } from "@core/operations/operation";
import { TemplateResult } from "lit";
import { Constructor } from "@lib/types";
import { uuid } from "@lib/uuid";
import { SessionService } from "./session_service";
import { CancelOperationError } from "@lib/errors";
import { RewriteChoiceOperation } from "@core/operations/rewrite_choice_operation";
import { ReviewOperation } from "@core/operations";
import { ReviewStep } from "@core/operations/steps";

export interface ServiceProvider {
    cursorService: CursorService;
    sentencesService: SentencesService;
    textEditorService: TextEditorService;
    sessionService: SessionService;
}

type OperationFactory = () => Operation;

/**
 * Responsible for showing which operations are available. managing the current operations stack.
 * - What opeartions are currently available.
 * - What operations are currently running.
 */
export class OperationsService extends Service {
    isError = false;
    readonly allOperations: OperationClass[] = [];
    operationStack: Operation[] = [];
    private readonly onRunCallbacks = new Set<(op: Operation) => void>();
    hoverTooltip: string | TemplateResult = "";

    constructor(private readonly serviceProvider: ServiceProvider) {
        super();
        makeObservable(this, {
            allOperations: observable.ref,
            availableOperations: computed,
            operationStack: observable,
            currentOperation: computed,
            isChoosing: computed,
            isInReview: computed,
            isError: observable,
            isInOperation: computed,
            hoverTooltip: observable,
            setHoverTooltip: action,
            clearHoverTooltip: action,
            onRun: action,
            finalizeOperation: action,
            registerOperation: action,
            registerOperations: action,
            cancelCurrentOperation: action,
            removeOperation: action,
            startOperationWithParams: flow,
            startOperation: flow,
            rewriteCurrentChoice: flow,
        });
    }

    private get cursorService() {
        return this.serviceProvider.cursorService;
    }

    private get sentencesService() {
        return this.serviceProvider.sentencesService;
    }

    private get textEditorService() {
        return this.serviceProvider.textEditorService;
    }

    private get sessionService() {
        return this.serviceProvider.sessionService;
    }

    getOperationsSite(): OperationSite {
        const {
            isCursorSelection,
            isCursorAtStartOfNode,
            isCursorAtEndOfNode,
            isCurrentNodeEmpty,
        } = this.cursorService;
        const { isCursorWithinSentence, isCursorBetweenSentences } =
            this.sentencesService;

        const isDocumentEmpty = this.textEditorService.isEmpty;

        if (isDocumentEmpty) {
            return OperationSite.EMPTY_DOCUMENT;
        } else if (isCursorSelection) {
            return OperationSite.SELECTION;
        } else if (isCurrentNodeEmpty) {
            return OperationSite.EMPTY_SECTION;
        } else if (isCursorAtStartOfNode) {
            return OperationSite.START_OF_SECTION;
        } else if (isCursorAtEndOfNode) {
            return OperationSite.END_OF_SECTION;
        } else if (isCursorWithinSentence) {
            return OperationSite.WITHIN_SENTENCE;
        } else if (isCursorBetweenSentences) {
            return OperationSite.BETWEEN_SENTENCES;
        } else {
            return OperationSite.NONE;
        }
    }

    getLocationInDocumentStructure(): OperationSite {
        const {
            isCursorAtTitle,
            isCursorAtSectionTitle,
            isCursorInIntroduction,
            isCursorAtStepTitle,
            isCursorInStep,
            isCursorAtConclusionTitle,
            isCursorInConclusion,
        } = this.cursorService;

        if (isCursorAtTitle) {
            return OperationSite.DIY_TITLE;
        }else if (isCursorAtSectionTitle) {
            return OperationSite.DIY_SECTION_TITLE
        } else if (isCursorInIntroduction) {
            return OperationSite.DIY_INTRODUCTION;
        } else if(isCursorAtStepTitle){
            return OperationSite.DIY_STEP_TITLE
        } else if (isCursorInStep) {
            return OperationSite.DIY_STEP;
        } else if (isCursorInConclusion) {
            return OperationSite.DIY_CONCLUSION;
        } else {
            return OperationSite.NONE;
        }
    }

    get availableOperations(): OperationClass[] {
        const operationSite = this.getOperationsSite();
        const documentSite = this.getLocationInDocumentStructure();
        this.removeAllKeyTriggerOperations();
        return this.allOperations.filter((operationClass) => {
            return operationClass.isAvailable(operationSite, documentSite);
        });
    }

    get currentOperation(): Operation | null {
        const index = this.operationStack.length - 1;
        return this.operationStack[index] ? this.operationStack[index] : null;
    }

    get isInOperation() {
        return !!this.currentOperation;
    }

    get isChoosing() {
        return (
            this.isInOperation &&
            this.currentOperation instanceof ChoiceOperation &&
            this.currentOperation?.currentStep instanceof ChoiceStep &&
            this.currentOperation.currentStep.choices.getNEntries() > 0
        );
    }

    get isInReview() {
        return (
            this.isInOperation &&
            this.currentOperation instanceof ReviewOperation &&
            this.currentOperation?.currentStep instanceof ReviewStep &&
            this.currentOperation.currentStep.review
        );
    }

    onRun(callback: (op: Operation) => void) {
        this.onRunCallbacks.add(callback);
    }

    removeOperation(operation: Operation) {
        this.operationStack = this.operationStack.filter(
            (o) => o !== operation
        );
    }

    setHoverTooltip(tooltip: string | TemplateResult) {
        this.hoverTooltip = tooltip;
    }
    clearHoverTooltip() {
        this.hoverTooltip = "";
    }

    /**
     * If the operation stack is empty, then we need to reenable the text editor
     * and set the undo snapshot if the text has changed.
     */
    finalizeOperation() {
        if (!this.isInOperation) {
            this.textEditorService.enableEditor();
            this.textEditorService.saveEditorSnapshot();
            this.textEditorService.nextChangeTriggersUndoSnapshot = true;
        }
    }

    registerOperation(operationClass: OperationClass) {
        this.allOperations.push(operationClass);
    }

    registerOperations(...operationClasses: OperationClass[]) {
        this.allOperations.push(...operationClasses);
    }

    setKeyTriggerOperation(key:string,operationClass:OperationClass){
        const operationKeyEventsStorage = this.textEditorService.getEditor.extensionStorage.operationKeyEvents;
        operationKeyEventsStorage[key] = () => this.triggerOperation(operationClass,OperationTrigger.KEY_COMMAND);
    }

    removeAllKeyTriggerOperations(){
        commandKeys.map((key)=>{
            const operationKeyEventsStorage = this.textEditorService.getEditor.extensionStorage.operationKeyEvents;
            operationKeyEventsStorage[key] = () => {};
        });
    }

    triggerOperation(
        operationClass: OperationClass,
        trigger: OperationTrigger
    ) {
        if (operationClass != null) {
            const factoryFn = this.makeOperationFactory(
                operationClass,
                trigger
            );
            this.startOperation(factoryFn, trigger);
        }
    }

    private makeOperationFactory(
        operationClass: OperationClass,
        trigger: OperationTrigger
    ): OperationFactory {
        return () => new operationClass(this.serviceProvider, trigger);
    }

    buildOperation<T extends Operation>(
        operationClass: Constructor<T>,
        trigger: OperationTrigger
    ): T {
        return new operationClass(this.serviceProvider, trigger);
    }

    cancelCurrentOperation() {
        if (this.currentOperation) {
            this.currentOperation.cancel();
        }
    }

    *startOperationWithParams(
        // tslint:disable-next-line:no-any
        operationClass: OperationClass,
        params: any,
        trigger = OperationTrigger.APP
    ) {
        const factory: OperationFactory = () => {
            return new operationClass(this.serviceProvider, trigger, params);
        };
        return this.startOperation(factory);
    }

    *startOperation(
        factoryOrClass: OperationClass | OperationFactory,
        trigger = OperationTrigger.APP
    ):any {
        const factory: OperationFactory = isOperationClass(factoryOrClass)
            ? this.makeOperationFactory(
                  factoryOrClass as OperationClass,
                  trigger
              )
            : (factoryOrClass as OperationFactory);

        // Ensure that we get initial state before the text editor is disabled,
        // because we need to make sure the cursor position is captured.
        const initialState = this.textEditorService.getStateSnapshot();

        // Ensure the text editor undo/redo snapshot is taken before the operation
        // is run.
        if (!this.isInOperation) {
            this.textEditorService.disableEditor();
            //   this.textEditorService.maybeMakePseudoSelection();

            // If we're starting this operation from another operation, then don't set
            // the undo stack.
            if (trigger !== OperationTrigger.OPERATION) {
                // this.textEditorService.setUndo();
            }
        }

        const operation = factory();

        const cursorOffset = this.cursorService.getOffsetRange();
        const operationData: OperationData = {
            id: uuid(),
            documentId: this.sessionService.sessionInfo.session_id,
            timestamp: Date.now(),
            text: this.textEditorService.getPlainText(),
            cursorStart: cursorOffset.start,
            cursorEnd: cursorOffset.end,
            preText:this.cursorService.preText,
            postText:this.cursorService.postText,
            selectedText:this.cursorService.selectedText,
            mdText:this.textEditorService.getMarkdownText(),
        };

        operation.setOperationData(operationData);

        operation.onFinish((wasSuccess: boolean) => {
            this.removeOperation(operation);
            if (operation.isHelperOperation) {
                if (!wasSuccess) {
                    this.finalizeOperation();
                }
            } else {
                this.finalizeOperation();
            }

            if(!wasSuccess){
                this.textEditorService.restoreFocusAfterCancel({from:operationData.cursorStart,to:operationData.cursorEnd});
            }
        });
        operation.onRun(() => {
            for (const callback of this.onRunCallbacks) {
                callback(operation);
            }
        });


        this.operationStack.push(operation);
        const currentOperation = this.currentOperation!;

        // tslint:disable-next-line:no-any
        let result: any;
        try {
            currentOperation.setInitialState(initialState);
            const operationPromise = currentOperation.start();
            
            result = yield operationPromise;
        } catch (err: any) {
            // Reset all pending state in the TextEditor
            currentOperation.resetTextEditor();
            currentOperation.finish();
            
            if (err instanceof CancelOperationError) {
                return;
            }

            this.isError = true;
            throw err;
        }

        this.textEditorService.triggerUpdateCallbacks();
        return result;
    }

    *rewriteCurrentChoice() {
        const parentOperation = this.currentOperation;
        if (parentOperation instanceof ChoiceOperation) {
            const parentChoiceStep = parentOperation.currentStep as ChoiceStep;
            parentChoiceStep.pause();
            const choiceToRewrite = parentChoiceStep.choices.getCurrentEntry();
            if (choiceToRewrite == null) return;

            const indexToRewrite = parentChoiceStep.choices.getIndex();
            return this.startOperation(() => {
                // We need to cast this.serviceProvider as the correct interface for
                // the operation.
                const serviceProvider = this
                    .serviceProvider as unknown as OperationServiceProvider;
                const rewriteChoiceOperation = new RewriteChoiceOperation(
                    serviceProvider,
                    OperationTrigger.OPERATION
                );
                rewriteChoiceOperation.initialize(choiceToRewrite.content);
                rewriteChoiceOperation.onPendingChoice = (
                    choice: ModelResult
                ) => {
                    parentChoiceStep.choices.updateEntry(
                        indexToRewrite,
                        choice
                    );
                };

                rewriteChoiceOperation.onSelectChoice = async () => {
                    /**
                     * We need to implement the logic of the choice step's callback, but
                     * ensure that we finish the adjustment operation before we finish the
                     * underlying choice operation.
                     */
                    parentChoiceStep.chooseIndex(indexToRewrite);
                    await rewriteChoiceOperation.finish();
                    return parentOperation.finish();
                };

                rewriteChoiceOperation.onCancel = async () => {
                    parentChoiceStep.choices.updateEntry(
                        indexToRewrite,
                        choiceToRewrite
                    );
                    parentChoiceStep.unpause();
                };
                return rewriteChoiceOperation;
            }, OperationTrigger.OPERATION);
        }
    }
}

/**
 * We need to check the prototype chain to see if the class is a subclass of
 * Operation
 */
function isOperationClass(obj: OperationClass | OperationFactory) {
    while ((obj = Object.getPrototypeOf(obj))) {
        if (obj.name === "Operation") {
            return true;
        }
    }
    return false;
}
