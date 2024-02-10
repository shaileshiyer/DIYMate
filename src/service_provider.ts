import { DIYMateCore } from "@core/diymate_core";
import { RouterService } from "@services/router_service";

export function makeServiceProvider(self:DIYMateCore) {
    const serviceProvider = {
        get routerService(){
            return self.getService(RouterService)
        }
    }

    return serviceProvider;
}