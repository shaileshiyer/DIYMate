import { CursorService } from "@core/services/cursor_service";
import { ModelService } from "@core/services/model_service";
import { OperationsService } from "@core/services/operations_service";
import { RouterService } from "@core/services/router_service";
import { SentencesService } from "@core/services/sentences_service";
import { TextEditorService } from "@core/services/text_editor_service";
import { OperationData } from "@core/shared/interfaces";
import { OperationSite, OperationTrigger, OperationType } from "@core/shared/types";
import { Model } from "@models/model";
// import { SerializedEditorState } from "lexical";
import { JSONContent } from "@tiptap/core";
import { TemplateResult } from "lit";
import { OperationControls } from "@core/shared/interfaces";
import { makeObservable, observable, runInAction } from "mobx";
import { FinishedStep, NotStartedStep, Step } from "./steps/step";
import { LoadingStep } from "./steps/loading_step";
import { CancelOperationError, CancelStepError } from "@lib/errors";
import { KeyboardService } from "@core/services/keyboard_service";
import { ReviewsService } from "@core/services/reviews_service";
import { DialogModel } from "@models/dialog_model";

export interface ServiceProvider {
    routerService: RouterService;
    cursorService: CursorService;
    operationsService: OperationsService;
    sentencesService: SentencesService;
    textEditorService: TextEditorService;
    keyboardService: KeyboardService;
    modelService: ModelService;
    reviewsService:ReviewsService;
}

export abstract class Operation {
    constructor(
        protected serviceProvider: ServiceProvider,
        public trigger: OperationTrigger
    ) {
        makeObservable(this,{
            currentStep:observable.ref,
        })
    }

    protected get routerService() {
        return this.serviceProvider.routerService;
    }

    protected get cursorService() {
        return this.serviceProvider.cursorService;
    }

    protected get operationsService() {
        return this.serviceProvider.operationsService;
    }

    protected get modelService() {
        return this.serviceProvider.modelService;
    }

    protected get sentencesService() {
        return this.serviceProvider.sentencesService;
    }

    protected get textEditorService() {
        return this.serviceProvider.textEditorService;
    }

    protected get keyboardService() {
        return this.serviceProvider.keyboardService;
    }

    protected get reviewService() {
        return this.serviceProvider.reviewsService;
    }

    private operationData!: OperationData;

    setOperationData(operationData: OperationData) {
        this.operationData = operationData;
    }

    getOperationData() {
        if (!this.operationData) {
            throw new Error("OperationData is not intiialized");
        }
        return this.operationData;
    }

    isHelperOperation = false;

    isStandaloneOperation = false;

    protected initialState!: JSONContent;

    abstract run(): Promise<void>;
    async onCancel() {}
    protected async onRestart() {}
    protected async beforeStart() {}

    protected abstract getLoadingMessage(): TemplateResult | string;
    getMessage(): TemplateResult | string {
        return "";
    }

    protected resolve = (result?: any) => {};
    protected reject = (err: unknown) => {};

    getModel(): Model {
        return this.modelService.getModel();
    }

    getDialogModel():DialogModel{
        return this.modelService.getDialogModel();
    }

    instanceControls: OperationControls = {};
    hasInstanceControls() {
        return Object.keys(this.instanceControls).length > 0;
    }

    // @observable.shallow currentStep: Step = new NotStartedStep();
    currentStep: Step = new NotStartedStep();
    setCurrentStep(step: Step) {
        if (this.currentStep) {
            this.currentStep.finish();
        }
        runInAction(()=>{
            this.currentStep = step;
        })
        step.start();
    }

    isLoading() {
        return this.currentStep instanceof LoadingStep;
    }

    resetTextEditor() {
        this.textEditorService.setStateFromSnapshot(this.initialState);
    }

    setInitialState(initialState: JSONContent) {
        this.initialState = initialState;
    }

    isStarted() {
        return !(this.currentStep instanceof NotStartedStep);
    }

    setIsLoading() {
        const message = this.getLoadingMessage();
        this.setCurrentStep(new LoadingStep(message));
    }

    setIsFinished() {
        this.setCurrentStep(new FinishedStep());
    }

    async start(): Promise<any> {
        this._start();
        return this.createPromise();
    }

    private async _start(): Promise<void> {
        try {
            if (this.isStarted()) return;
            await this.beforeStart();
            this.setIsLoading();
            await this.run();
            for (const callback of this.onRunCallbacks) {
                callback();
            }
        } catch (err: unknown) {
            this.handleError(err);
        }
    }

    async restart(shouldResetTextEditor = true): Promise<void> {
        try {
            await this.onRestart();
            if (shouldResetTextEditor) {
                this.resetTextEditor();
            }
            this.setIsLoading();
            await this.run();
        } catch (err: unknown) {
            this.handleError(err);
        }
    }

    async cancel(shouldResetTextEditor = true): Promise<void> {
        this.currentStep.cancelPromise();
        await this.onCancel();
        if (shouldResetTextEditor) {
            this.resetTextEditor();
        }
        return this.finish(false);
    }

    private handleError(err: unknown) {
        // A CancelOperationError is a way of cancelling the entire operation from
        // within a step that's currently being awaited
        if (err instanceof CancelOperationError) {
            this.cancel();
            return;
        }
        // A CancelStepError is a way of escaping the current step only
        if (err instanceof CancelStepError) {
            return;
        }
        this.reject(err);
    }

    // tslint:disable-next-line:no-any
    async finish(wasSuccess = true, result?: any) {
        for (const callback of this.onFinishCallbacks) {
            callback(wasSuccess);
        }

        if (!this.currentStep.isFinished) {
            this.currentStep.finish();
        }
        this.resolve(result);
    }

    private readonly onFinishCallbacks = new Set<
        (wasSuccess: boolean) => void
    >();
    onFinish(callback: (wasSuccess: boolean) => void) {
        this.onFinishCallbacks.add(callback);
    }

    private readonly onRunCallbacks = new Set<() => void>();
    onRun(callback: () => void) {
        this.onRunCallbacks.add(callback);
    }

    protected createPromise(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.resolve = resolve as () => void;
            this.reject = reject as () => void;
        });
    }

    static id: OperationType = OperationType.NONE;
    static controls: OperationControls = {};
    static globalControls = {};


    static getDescription(...params:any []):string | TemplateResult {
        return '';
    }

    static getButtonLabel(...params: any[]): string | TemplateResult{
        return '';
    }
    static isAvailable(operationSite:OperationSite,documentSite?: OperationSite){
        return true;
    }
}
