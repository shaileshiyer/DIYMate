import { action, computed, flow, makeObservable, observable } from "mobx";
import { Service } from "./service";
import { ModelService } from "./model_service";
import { TextEditorService } from "./text_editor_service";
import { DialogMessage, DialogParams } from "@models/dialog_model";
import { LocalStorageService } from "./local_storage_service";


interface ServiceProvider{
    modelService: ModelService;
    textEditorService: TextEditorService;
    localStorageService: LocalStorageService;
}

export class ChatService extends Service {
    
    
    
    messages:DialogMessage[] = []
    currentMessage = '';
    isLoading= false;
    shouldIncludeDIY = true;
    
    constructor(private readonly serviceProvider:ServiceProvider){
        super();
        makeObservable(this,{
            currentMessage: observable,
            isLoading: observable,
            messages: observable,
            messagesToDisplay: computed,
            shouldIncludeDIY: observable,
            sendCurrentDIYTutorial:flow,
            sendMessage:flow,
            setCurrentMessage:action,
        });
    }

    get modelService(){
        return this.serviceProvider.modelService;
    }

    get textEditorService() {
        return this.serviceProvider.textEditorService;
    }

    get localStorageService(){
        return this.serviceProvider.localStorageService;
    }


    private getInitialMessage():DialogMessage{
        return {role:'assistant',content:"Hello, I am DIYMate, your tutorial writing assistant. What would you like me to help with?"};
    }

    get messagesToDisplay(){
        return [this.getInitialMessage(),...this.messages];
    }

    setCurrentMessage(currentMessage:string){
        this.currentMessage = currentMessage;
    }

    *sendCurrentDIYTutorial(){
        const currentDIY = this.localStorageService.getCurrentDIY();
        const diyPlainText = this.textEditorService.getPlainText();
        const message = `Here is the description of the DIY Tutorial:\n ${currentDIY?.description}\n Here is the DIY Tutorial so far:\n ${diyPlainText}`
        const dialogMessage:DialogMessage = {role:'user',content:message};
        this.messages.push(dialogMessage);
        try {
            this.isLoading = true;
            const response = yield this.modelService.getDialogModel().query({messages:[dialogMessage]});
            this.isLoading = false;
        } catch (error) {
            console.error(error);
            this.isLoading = false;
            this.messages.pop();
        }
    }

    *sendMessage(){
        if (this.currentMessage.length === 0){
            return;
        }
        this.isLoading = true;
        this.messages.push({role:'user',content:this.currentMessage});
        
        try{
            const dialogParams:DialogParams = {
                messages:[
                    {role:"instruction",content:this.currentMessage},
                    {role:"user",content:this.currentMessage},
                ]
            }
            const response = yield this.modelService.getDialogModel().query(dialogParams);
            this.messages.push(...response);
            this.currentMessage = '';
            this.isLoading = false;
        } catch(error){
            console.error(error);
            this.isLoading = false;
            this.messages.pop();
        }
        
    }






}