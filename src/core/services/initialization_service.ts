import { ContextService } from "./context_service";
import { DocumentStoreService } from "./document_store_service";
import { LocalStorageService } from "./local_storage_service";
import { ModelService } from "./model_service";
import { OperationsService } from "./operations_service";
import { RouterService } from "./router_service";
import { SentencesService } from "./sentences_service";
import { Service } from "./service";
import { SessionService } from "./session_service";
import { TextEditorService } from "./text_editor_service";


interface ServiceProvider {
    routerService:RouterService;
    localStorageService:LocalStorageService;
    sessionService:SessionService;
    contextService: ContextService;
    documentStoreService: DocumentStoreService;
    modelService: ModelService;
    operationsService:OperationsService;
    sentencesService:SentencesService;
    textEditorService: TextEditorService;
}
/**
 * Initialises all important services in the application
 */
export class InitializationService extends Service {

    private isResetting = false;
    private beforeUnload = ()=>{};

    constructor(private readonly serviceProvider:ServiceProvider){
        super();
    }

    private get documentStoreService():DocumentStoreService{
        return this.serviceProvider.documentStoreService;
    }

    private get sessionService():SessionService{
        return this.serviceProvider.sessionService;
    }

    private clearDocumentAndReload(){
        const {localStorageService,routerService} = this.serviceProvider;
        localStorageService.clearDocumentState();
        // Reload the page when the local storage changes.
        window.removeEventListener('beforeUnload',this.beforeUnload);
        
        routerService.getRouter().render('/',true);
    }

    async reset(automaticallySave = true){
        if (this.isResetting){
            return;
        }

        this.isResetting = true;
        try{
            if (automaticallySave){
                await this.documentStoreService.saveDocument();
            }
            this.sessionService.reset();

        }catch(err:unknown){
            console.error(err);
        }
        this.isResetting = false;
        this.clearDocumentAndReload();
    }
}