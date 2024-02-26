import { DIYMateCore } from "@core/diymate_core";
import { RouterService } from "@services/router_service";
import { LocalStorageService } from "@services/local_storage_service";
import { SessionService } from "@services/session_service";
import { InitializationService } from "@core/services/initialization_service";
import { ModelService } from "@core/services/model_service";
import { ContextService } from "@core/services/context_service";
import { TextEditorService } from "@core/services/text_editor_service";
import { CursorService } from "@core/services/cursor_service";
import { SentencesService } from "@core/services/sentences_service";

export function makeServiceProvider(self:DIYMateCore) {
    const serviceProvider = {
        get routerService(){
            return self.getService(RouterService)
        },
        get localStorageService(){
            return self.getService(LocalStorageService)
        },
        get sessionService(){
            return self.getService(SessionService)
        },
        get initializationService(){
            return self.getService(InitializationService);
        },
        get modelService(){
            return self.getService(ModelService);
        },
        get contextService(){
            return self.getService(ContextService);
        },
        get textEditorService(){
            return self.getService(TextEditorService);
        },
        get cursorService(){
            return self.getService(CursorService);
        },
        get sentencesService(){
            return self.getService(SentencesService);
        }
    }

    return serviceProvider;
}