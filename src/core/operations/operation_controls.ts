import {
    ControlPrefix,
    OperationClass,
    OperationControl as OperationControlInterface,
} from "@core/shared/interfaces";
import { TemplateResult } from "lit";
import { makeObservable, observable } from "mobx";

class OperationControl implements OperationControlInterface {
    value!: number | string | boolean;
    private readonly description: string | TemplateResult;

    constructor(private readonly prefix: ControlPrefix, description = "") {
        this.description = description;
    }

    getPrefix(): string | TemplateResult {
        return this.prefix instanceof Function
            ? this.prefix(this)
            : this.prefix;
    }
    getDescription(): string | TemplateResult {
        return this.description;
    }
}

export interface ControlParams {
    prefix: ControlPrefix;
    description: string;
}

export interface ToggleControlParams extends ControlParams {
    value: boolean;
}

export class ToggleControl extends OperationControl {
    constructor(params: ToggleControlParams) {
        const { prefix, description, value } = params;
        super(prefix, description);
        makeObservable(this, { value: observable });
        this.value = value;
    }

    override value: boolean;
}

export interface StepSliderControlParams<T> extends ControlParams {
    value: number;
    suffix?: ControlPrefix;
    steps: T[];
}

export class StepSliderControl<T> extends OperationControl {
    constructor(params: StepSliderControlParams<T>) {
        const { prefix, suffix, description, value, steps } = params;
        super(prefix, description);
        this.value = value;
        this.steps = steps;
        this.suffix = suffix;
        makeObservable(this, {
            value: observable,
            steps: observable,
        });
    }

    override value: number;
    steps: T[];
    suffix?: ControlPrefix;

    getStepValue() {
        return this.steps[this.value];
    }

    getSuffix(): string | TemplateResult {
        if (this.suffix instanceof Function) {
            return this.suffix(this);
        }
        return this.suffix ? this.suffix : "";
    }
}

export interface TextInputControlParams extends ControlParams {
    value: string;
    helperOperation?: OperationClass;
    placeholder?: string;
}

export class TextInputControl extends OperationControl {
    constructor(params: TextInputControlParams) {
        const {
            prefix,
            description,
            value,
            helperOperation,
            placeholder = "",
        } = params;
        super(prefix, description);

        this.value = value;
        this.helperOperation = helperOperation;
        this.placeholder = placeholder;
        makeObservable(this, { 
            value: observable,
         });
    }

    override value: string;
    helperOperation?: OperationClass;
    placeholder: string;

    hasHelperOperation() {
        return this.helperOperation != null;
    }
}


export interface TextAreaControlParams extends ControlParams {
    id?: string;
    value: string;
    helperOperation?: OperationClass;
    placeholder?: string;
}

export class TextareaControl extends OperationControl {
    constructor(params: TextAreaControlParams) {
        const {
            prefix,
            description,
            helperOperation,
            id = "",
            value,
            placeholder = "",
        } = params;
        super(prefix, description);

        this.id = id;
        this.value = value;
        this.helperOperation = helperOperation;
        this.placeholder = placeholder;

        makeObservable(this,{
            value: observable,
        })
    }

    id: string;
    override value: string;
    helperOperation?: OperationClass;
    placeholder: string;

    hasHelperOperation() {
        return this.helperOperation != null;
    }
}

