import { LitElement, html, css, PropertyValueMap } from "lit";
import { customElement, property } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { Router } from "@vaadin/router";
import './pages/diymate-home';

@customElement('diymate-app')
export class DIYMateApp extends MobxLitElement {

    protected firstUpdated(): void {
        const router = new Router(this.shadowRoot?.querySelector('#diy-mate-wrapper'));

        router.setRoutes([
            { path: '/', component: 'diymate-home' }
        ])
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