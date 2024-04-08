import { Router } from "@vaadin/router";
import { Service } from "./service";
import { LoggingService } from "./logging_service";

interface ServiceProvider {
    loggingService:LoggingService;
}

/**
 * RouterService Used to manage the routes.
 *  / - home
 * /new - new DIY Page
 * /loading - Loading-Page
 * /editor/:sessionId - EditorPage
 */
export class RouterService extends Service {
    private readonly router: Router;
    constructor(private readonly serviceProvider:ServiceProvider) {
        super();
        this.router = new Router();
    }

    get loggingService(){
        return this.serviceProvider.loggingService;
    }



    initializeRouter(node: Node) {
        this.router.setOutlet(node);
        this.router.setRoutes([
            { path: "/", component: "diymate-home"},
            { path: "/pretask", component: "demographics-page" },
            { path: "/new", component: "diymate-new-diy" },
            { path: "/loading", component: "loading-page" },
            { path: "/editor/:sessionId",component:'editor-page'},
            { path: "/endtask", component: "dm-end-study-page" },
        ]);

        
    }

    getRouter() {
        return this.router;
    }
}
