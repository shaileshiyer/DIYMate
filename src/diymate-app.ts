import { LitElement, html, css, PropertyValueMap } from "lit";
import { customElement, property } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import './pages/diymate-home';
import './pages/new_diy'
import './pages/loading'
import './pages/editor-page'
import { diymateCore } from "@core/diymate_core";
import { RouterService } from "@core/services/router_service";

@customElement('diymate-app')
export class DIYMateApp extends MobxLitElement {
    private readonly routerService = diymateCore.getService(RouterService);

    protected firstUpdated(): void {
        const routerOutlet = this.shadowRoot?.querySelector('#diy-mate-wrapper');
        if (!!routerOutlet){
            this.routerService.initializeRouter(routerOutlet);
        }

    }

    render() {
        return html`
           <div id="diy-mate-wrapper"></div> 
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "diymate-app": DIYMateApp;
    }
}