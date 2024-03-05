import { Router } from "@vaadin/router";
import { Service } from "./service";


/**
 * RouterService Used to manage the routes.
 *  / - home
 * /new - new DIY Page
 * /loading - Loading-Page
 * /editor/:sessionId - EditorPage
 */
export class RouterService extends Service {
    private readonly router: Router;
    constructor() {
        super();
        this.router = new Router();
    }

    initializeRouter(node: Node) {
        this.router.setOutlet(node);
        this.router.setRoutes([
            { path: "/", component: "diymate-home" },
            { path: "/new", component: "diymate-new-diy" },
            { path: "/loading", component: "loading-page" },
            { path: "/editor/:sessionId",component:'editor-page'},
        ]);
    }

    getRouter() {
        return this.router;
    }
}
