import { TemplateResult } from "lit";
import { Step } from "./step"

export class LoadingStep extends Step {
    constructor(public message:TemplateResult | string){
        super();
    }
}