import { action, computed, flow, makeObservable, observable } from "mobx";
import { Service } from "./service";
import { ModelService } from "./model_service";
import { TextEditorService } from "./text_editor_service";
import { DialogMessage, DialogParams } from "@models/dialog_model";
import { LocalStorageService } from "./local_storage_service";
import { DocumentStoreService } from "./document_store_service";
import { LoggingService } from "./logging_service";


interface ServiceProvider{
    modelService: ModelService;
    textEditorService: TextEditorService;
    localStorageService: LocalStorageService;
    documentStoreService: DocumentStoreService;
    loggingService:LoggingService;
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
            setShouldIncludeDIY:action,
            initializeFromStorage:action,
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

    get documentStoreService(){
        return this.serviceProvider.documentStoreService;
    }

    get loggingService(){
        return this.serviceProvider.loggingService;
    }


    private getInitialMessage():DialogMessage{
        return {role:'assistant',content:"Hello, I am DIYMate, your tutorial writing assistant. What would you like me to help with?"};
    }

    get messagesToDisplay(){
        return [this.getInitialMessage(),...this.messages];
    }

    initializeFromStorage(messages:DialogMessage[]){
        this.messages = messages;
    }

    setCurrentMessage(currentMessage:string){
        this.currentMessage = currentMessage;
    }

    setShouldIncludeDIY(value:boolean){
        this.shouldIncludeDIY = value;
    }

    *sendCurrentDIYTutorial(){
        const currentDIY = this.localStorageService.getCurrentDIY();
        const diyMdText = this.textEditorService.getMarkdownText();
        const message = `Here is the description of the DIY Tutorial:\n ${currentDIY?.description}\n Here is the DIY Tutorial so far:\n ${diyMdText}`
        const dialogMessage:DialogMessage = {role:'user',content:message};
        // this.messages.push(dialogMessage);
        try {
            // this.isLoading = true;
            const response:DialogMessage[] = yield this.modelService.getDialogModel().query({messages:[dialogMessage]});
            yield this.loggingService.updateCounter('CHAT_CURRENT_DIY_SENT');
            yield this.loggingService.addLog('CHAT_CURRENT_DIY_SENT',{message});
            // this.isLoading = false;
            // this.documentStoreService.saveDocument();
        } catch (error) {
            console.error(error);
            throw error;
            // this.isLoading = false;
            // this.messages.pop();
        }
    }

    *sendMessage(){
        if (this.currentMessage.length === 0){
            return;
        }
        this.isLoading = true;
        this.messages.push({role:'user',content:this.currentMessage});

        
        try{
            if (this.shouldIncludeDIY){
                yield this.sendCurrentDIYTutorial();
            }

            const dialogParams:DialogParams = {
                messages:[
                    {role:"instruction",content:this.currentMessage},
                    {role:"user",content:this.currentMessage},
                ]
            }
            const response:DialogMessage[] = yield this.modelService.getDialogModel().query(dialogParams);
            this.messages.push(...response);
            yield this.loggingService.updateCounter('CHAT_MESSAGE_SENT');
            yield this.loggingService.addLog('CHAT_MESSAGE_SENT',{message:this.currentMessage,modelResponse:response[0].content||response});
            this.currentMessage = '';
            this.isLoading = false;
            this.documentStoreService.saveDocument();

        } catch(error){
            console.error(error);
            this.isLoading = false;
            this.messages.pop();
        }
        
    }






}