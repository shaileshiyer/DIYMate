import { StepLifecycle } from "@core/shared/types";
import { CancelOperationError, CancelStepError } from "@lib/errors";

export abstract class Step {
    state = StepLifecycle.NOT_STARTED;

    get isFinished() {
        return this.state === StepLifecycle.FINISHED;
    }

    resolve = () => {};
    reject = (e: Error) => {};

    setup() {}
    cleanup() {}
    pause() {}
    unpause() {}

    private promise!: Promise<void>;
    getPromise() {
        if (!this.promise) {
            this.promise = new Promise((resolve, reject) => {
                this.resolve = resolve;
                this.reject = reject;
            });
        }
        return this.promise;
    }

    cancelPromise() {
        if (this.promise) {
            this.reject(new CancelStepError());
            this.onFinishCallback();
        }
    }

    start() {
        this.state = StepLifecycle.STARTED;
        this.setup();
        this.onStartCallback();
    }

    private onStartCallback = () => {};
    onStart(callback: () => void) {
        this.onStartCallback = callback;
    }

    cancel() {
        this.state = StepLifecycle.FINISHED;
        this.cleanup();
        this.onCancelCallback();
    }

    private onCancelCallback = () => {};
    onCancel(callback: () => void) {
        this.onCancelCallback = callback;
    }

    cancelOperation() {
        this.reject(new CancelOperationError());
    }

    restart() {
        this.onRestartCallback();
    }

    private onRestartCallback = () => {};
    onRestart(callback: () => void) {
        this.onRestartCallback = callback;
    }

    finish() {
        this.state = StepLifecycle.FINISHED;
        this.cleanup();
        this.resolve();
        this.onFinishCallback();
    }

    private onFinishCallback = () => {};
    onFinish(callback: () => void) {
        this.onFinishCallback = callback;
    }
}

export class NotStartedStep extends Step {}
export class FinishedStep extends Step {}
