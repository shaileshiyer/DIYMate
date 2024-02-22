import { Model } from "models/model";
import { Service } from "./service";
import { DialogModel } from "models/dialog_model";
import { Constructor } from "@core/shared/types";

interface ServiceProvider {

}
/**
 * Responsible for managing models
 */
export class ModelService extends Service {
    private model?: Model;
    private dialogModel?: DialogModel;
    
    constructor(private readonly serviceProvider: ServiceProvider) {
        super();
    }
    
    useModel(modelClass:Constructor<Model>){
        const model = new modelClass(this.serviceProvider);
        this.model = model;
    }

    getModel(){
        if (!this.model){
            throw new Error(`No model registered`);
        }
        return this.model;
    }

    useDialogModel(dialogModelClass:Constructor<DialogModel>){
        const dialogModel = new dialogModelClass(this.serviceProvider);
        this.dialogModel = dialogModel;
    }

    get hasDialogModel(){
        return this.dialogModel != null;
    }

    getDialogModel(){
        if (!this.dialogModel){
            throw new Error(`No Dialog model registered`);
        }
        return this.dialogModel;
    }

}