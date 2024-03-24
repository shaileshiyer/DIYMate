import { Service } from "./service";
import { SessionInformation, SessionService } from "./session_service";
import { CurrentDIY, LocalStorageService } from "./local_storage_service";
import { RouterService } from "./router_service";
import { TextEditorService } from "./text_editor_service";
import { makeObservable, observable, runInAction } from "mobx";
import { delay } from "@lib/utils";
import { JSONContent } from "@tiptap/core";

export interface SavedDocument {
    id:string;
    timestamp: number;
    sessionInfo: SessionInformation;
    editorState: string;
    plainText: string;
    currentDIY: CurrentDIY;
};

interface ServiceProvider {
    routerService: RouterService;
    localStorageService: LocalStorageService;
    textEditorService: TextEditorService;
    sessionService: SessionService;
}

/**
 * Responsible for managing loading and saving of documents (DIY Tutorials)
 */
export class DocumentStoreService extends Service {
    private autoSaveIntervalId = 0;
    private lastSavedText = '';
    isDeleting = false;
    isLoading = false;
    isSaving = false;
    documentId: string |null = null;
    userDocuments: SavedDocument[] = [];
    
    constructor(private readonly serviceProvider: ServiceProvider){
        super();
        makeObservable(this,{
            isDeleting: observable,
            isLoading: observable,
            isSaving: observable,
            userDocuments: observable,
        });
    }

    get routerService(){
        return this.serviceProvider.routerService;
    }

    get localStorageService(){
        return this.serviceProvider.localStorageService;
    }

    get textEditorService(){
        return this.serviceProvider.textEditorService;
    }

    get sessionService(){
        return this.serviceProvider.sessionService;
    }


    setDocumentId(documentId: string|null){
        this.documentId = documentId;
    }

    async loadUserDocuments(): Promise<SavedDocument[]>{
        return this.wrapIsLoading(async ()=>{
            const rawUserDocuments = this.localStorageService.loadDocuments();

            // Process documents to make sure they match the schema.
            // Certain objects might not be present in the document if so,
            // Overwrite them and intialized them as empty.
            let userDocuments = rawUserDocuments.map((document)=>{
                return {
                    conversation:[],
                    ...(document as any),
                };
            }) as SavedDocument[];
            userDocuments = userDocuments.filter((doc)=>{
                return doc.plainText && doc.plainText.length >0;
            });
            runInAction(()=>{
                this.userDocuments = userDocuments;
            })
            return this.userDocuments;
        });
    }

    async loadSavedDocument(document: SavedDocument) {
        let editorState: JSONContent| null = null;
        try {
            editorState = JSON.parse(document.editorState);
            if (editorState === null){
                throw Error('editor state is null.')
            }
        } catch(err){
            throw Error(`Editor state could not be parsed.${err}`);
        }
        this.localStorageService.setEditorState(editorState);
        // this.textEditorService.initializeFromLocalStorage(editorState);
        this.localStorageService.setCurrentDIY(document.currentDIY);
        this.localStorageService.setCurrentSession(document.sessionInfo);
        this.sessionService.restoreSession(document.sessionInfo);
        this.documentId = document.id;
        this.lastSavedText = document.plainText;

        this.localStorageService.setDocumentId(document.id);
        this.routerService.getRouter().render(`/editor/${document.id}`,true)
    }
    
    async loadAllDocuments(): Promise<SavedDocument[]>{
        return this.wrapIsLoading(async ()=>{
            return this.localStorageService.loadDocuments();
        })
    }

    async deleteCurrentDocument(){
        if (this.documentId){
            return this.deleteDocument(this.documentId);
        }
    }

    async deleteDocument(documentId: string){
       if (this.isDeleting) return;

       runInAction(()=>{
           this.isDeleting = true;
           this.userDocuments = this.userDocuments.filter(
                (doc)=> doc.id !== documentId
           );
       })

       this.localStorageService.deleteDocument(documentId);
       runInAction(()=>{
           this.isDeleting = false;
       })
    

    }

    private async wrapIsLoading<T>(fn: ()=> Promise<T>){
        runInAction(()=>{
            this.isLoading = true;
        })
        const result = await fn();
        runInAction(()=>{
            this.isLoading = false;
        })
        return result;
    }

    private createDocumentToSave():Omit<SavedDocument,'id'>{
        const text = this.textEditorService.getPlainText();
        const sessionInfo = this.sessionService.sessionInfo;
        return {
            sessionInfo: sessionInfo , 
            editorState: JSON.stringify(this.textEditorService.getStateSnapshot()),
            plainText: text,
            timestamp: Date.now(),
            currentDIY: this.localStorageService.getCurrentDIY()?? {description:'',outlinePrompt:'',generatedOutline:''},
        }
    }
    
    async saveDocument(){
        const documentData = this.createDocumentToSave();
        this.lastSavedText = documentData.plainText;

        if (documentData.plainText === '' || documentData.currentDIY.description=== ''){
            return;
        }

        runInAction(()=>{
            this.isSaving = true;
        })
        await delay(Math.random() * 500);
        const documentId = this.localStorageService.saveDocument(documentData,documentData.sessionInfo.session_id);
        this.documentId = documentId;
        this.localStorageService.setDocumentId(documentId);
        runInAction(()=>{
            this.isSaving = false;
        })
    }

    startAutoSave(){
        this.autoSaveIntervalId = window.setInterval(()=>{
            const text = this.textEditorService.getPlainText();
            
            if (text !== this.lastSavedText){
                this.saveDocument();
            }
        },10000);
    }

    endAutoSave(){
        clearInterval(this.autoSaveIntervalId);
    }


}