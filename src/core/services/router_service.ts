import { Router } from "@vaadin/router";
import { Service } from "./service";


export class RouterService extends Service {
    private readonly router:Router;
    constructor(){
        super();
        this.router = new Router();
    }

    initializeRouter(node: Node){
        this.router.setOutlet(node);
        this.router.setRoutes([
            { path: '/', component: 'diymate-home' },
            { path: '/new', component: 'diymate-new-diy' },
        ])
    }

    getRouter(){
        return this.router;
    }
    
}