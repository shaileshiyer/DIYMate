import { MobxLitElement } from "@adobe/lit-mobx";
import { LitElement, PropertyValueMap, TemplateResult, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import '@material/web/progress/circular-progress'
import { diymateCore } from "@core/diymate_core";
import { RouterService } from "@core/services/router_service";
import { SessionService } from "@core/services/session_service";
import { LoggingService } from "@core/services/logging_service";

@customElement('loading-page')
export class LoadingPage extends LitElement{

    private routerService = diymateCore.getService(RouterService);
    private sessionService = diymateCore.getService(SessionService);
    private loggingService = diymateCore.getService(LoggingService);

    private messageTimeout:number = -1;

    static override get styles(){
        const styles = css`
             #loading-wrapper {
                display: flex;
                flex-direction: column;
                justify-content: center;
                min-width: 1280px;
                margin: 0 auto;
                padding: 2em auto;
                place-items: center;
                min-height: 100vh;
            }

            #loading-message {
                font-size:20px;
            }

        `;
        return [styles];
    }

    protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        
    }

    connectedCallback(): void {
        super.connectedCallback();
        this.loggingService.addLog('PAGE_NAVIGATE',{page:'loading-page'});
        this.messageTimeout = window.setTimeout(()=>{
            const sessionId = this.sessionService.sessionInfo.session_id;
            this.routerService.getRouter().render(`/editor/${sessionId}`,true);
        },3000);
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
    }

    protected render(): TemplateResult {
        return html`
        <div id="loading-wrapper">
            <div id="loading-message">Loading DIY Editor...</div>
            <md-circular-progress class="four-color" indeterminate fourColor></md-circular-progress>
        </div>
        `;
    }   
}


declare global {
    interface HTMLElementTagNameMap {
        "loading-page": LoadingPage;
    }
}


