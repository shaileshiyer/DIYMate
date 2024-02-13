import { DIYMateContext } from "context";

import { Service } from "./service";

export class ContextService extends Service {
    private context!:DIYMateContext;

    initialize(context:DIYMateContext){
        this.context = context;
    }

    getContext() {
        return this.context;
    }
}