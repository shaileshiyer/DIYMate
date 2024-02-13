import { LocalStorageService } from "./local_storage_service";
import { RouterService } from "./router_service";
import { Service } from "./service";
import { SessionService } from "./session_service";


interface ServiceProvider {
    routerService:RouterService;
    localStorageService:LocalStorageService;
    sessionService:SessionService;
}
/**
 * Initialises all important services in the application
 */
export class InitializationService extends Service {
    constructor(private readonly serviceProvicer:ServiceProvider){
        super();
    }
}