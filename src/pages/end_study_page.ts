import { MobxLitElement } from "@adobe/lit-mobx";
import { diymateCore } from "@core/diymate_core";
import { LoggingService } from "@core/services/logging_service";
import { RouterService } from "@core/services/router_service";
import { TemplateResult, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@material/web/iconbutton/filled-icon-button";
import "@material/web/button/filled-button";
import "@material/web/icon/icon";
import "@material/web/button/filled-tonal-button";
import { InitializationService } from "@core/services/initialization_service";
import "@material/web/progress/circular-progress";
import { SessionService } from "@core/services/session_service";

@customElement("dm-end-study-page")
export class EndStudyPage extends MobxLitElement {
    static override get styles() {
        const styles = css`
            #end-study-wrapper {
                display: flex;
                flex-direction: column;
                justify-content: center;
                min-width: 1280px;
                margin: 0 auto;
                padding: 2em auto;
                place-items: center;
                min-height: 100vh;
            }

            #end-study-wrapper h1 {
                font-size:4em;
            }

            .end-study-message {
                font-size: 20px;
            }
            .hidden {
                display: none;
            }
        `;
        return [styles];
    }

    private readonly routerService = diymateCore.getService(RouterService);
    private readonly sessionService = diymateCore.getService(SessionService);
    private readonly loggingService = diymateCore.getService(LoggingService);
    private readonly initializationService = diymateCore.getService(InitializationService);

    @property({type:Boolean})
    private isDownloading = false;

    connectedCallback(): void {
        super.connectedCallback();
        this.loggingService.addLog("PAGE_NAVIGATE", {
            page: "end-study-page",
        });
    }

    private async exportData():Promise<void> {
        this.isDownloading = true;
        const exportData = await this.loggingService.exportParticipantData();
        const filename = `participant_${this.sessionService.sessionInfo.session_id}.json`
        const participantFile = new File([exportData],filename,{type:'text/plain'});

        const hiddenElement = this.renderRoot.querySelector('.hidden');
        if (hiddenElement){
            const link = document.createElement('a');
            const url = URL.createObjectURL(participantFile);
            link.href= url;
            link.download = participantFile.name;
            hiddenElement.appendChild(link);
            link.click();
            hiddenElement.removeChild(link);
            window.URL.revokeObjectURL(url);
        }

        this.isDownloading = false;
    }

    protected render(): TemplateResult {
        const backHome = () => {
            this.initializationService.reset(false);
        };
        return html`
            <div id="end-study-wrapper">
                <div class="end-study">
                    <h1>😸Thank you🙏🏼</h1>
                    <div class="end-study-message">
                    <p>Thank you for participating in this study. We will now conduct a semi-structured interview about your experience.</p>
                    </div>
                    <div class="hidden"></div>
                    <hr></hr>
                    <div>
                        ${this.isDownloading? html`<md-circular-progress indeterminate fourColor></md-circular-progress>`:html``}
                        <md-filled-button type="button"  @click=${this.exportData}>
                            <md-icon slot="icon">${this.isDownloading? 'downloading': 'download'}</md-icon>
                            Export Data
                        </md-filled-button>

                        <md-filled-tonal-button type="button" @click=${backHome}>
                            <md-icon slot="icon">home</md-icon>
                            Home
                        </md-filled-tonal-button>
                    </div>
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "dm-end-study-page": EndStudyPage;
    }
}
