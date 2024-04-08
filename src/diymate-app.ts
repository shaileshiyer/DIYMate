import { LitElement, html, css, PropertyValueMap } from "lit";
import { customElement, property } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import "@material/web/iconbutton/icon-button";
import "@material/web/button/filled-button";
import "@material/web/button/outlined-button";
import '@material/mwc-dialog/mwc-dialog';
import "@components/snackbar/index";
import { Dialog } from "@material/mwc-dialog/mwc-dialog";
import { SnackbarComponent } from "@components/snackbar";
import { diymateCore } from "@core/diymate_core";
import { RouterService } from "@core/services/router_service";
import { LoggingService } from "@core/services/logging_service";
import { DialogService } from "@core/services/dialog_service";
import "./components/welcome_dialog";
import "./components/image_upload_dialog";

import './pages/diymate_home';
import './pages/new_diy'
import './pages/loading'
import './pages/editor_page'
import './pages/demographics_page';
import './pages/end_study_page';

@customElement('diymate-app')
export class DIYMateApp extends MobxLitElement {
    private readonly routerService = diymateCore.getService(RouterService);
    private readonly dialogService = diymateCore.getService(DialogService);
    private readonly loggingService = diymateCore.getService(LoggingService);

    static override get styles(){
        const styles = css`
            #snackbar-container{
                --md-icon-button-icon-size:16px;
            }
        `;
        return [styles];
    }

    protected firstUpdated(): void {
        const routerOutlet = this.shadowRoot?.querySelector('#diy-mate-wrapper');
        if (!!routerOutlet){
            this.routerService.initializeRouter(routerOutlet);
        }
        this.dialogService.initialize();
        this.registerPopups();
    }

    connectedCallback(): void {
        super.connectedCallback();
    }
    
    private registerDialog(id: string) {
        const dialog = this.shadowRoot!.getElementById(id) as Dialog;
        if (dialog) this.dialogService.registerDialog(id, dialog);
      }
    
    private registerSnackbar(id: string) {
    const snackbar = this.shadowRoot!.getElementById(id) as SnackbarComponent;
    if (snackbar) this.dialogService.registerSnackbar(id, snackbar);
    }

    registerPopups(){
        this.registerDialog('welcome-dialog');
        this.registerDialog('message-dialog');
        this.registerDialog('confirm');
        this.registerDialog('image-dialog');

        this.registerSnackbar('bot-warning-snackbar');
        this.registerSnackbar('message-snackbar');
        this.registerSnackbar('error-snackbar');
    }



    renderDialogs(){
        return html`
            <mwc-dialog id="welcome-dialog" hideActions>
                <dm-welcome-dialog .close=${()=> void this.dialogService.closeWelcomeDialog()}></dm-welcome-dialog>
            </mwc-dialog>
            <mwc-dialog
                id="message-dialog"
                heading="${this.dialogService.messageHeader}"
                hideActions
            >
                ${this.dialogService.messageBody}
            </mwc-dialog>
            <mwc-dialog id="confirm" heading="${this.dialogService.messageHeader}" >
                ${this.dialogService.messageBody}
                <md-filled-button
                slot="primaryAction"
                dialogAction="confirm"
                >
                OK
                </md-filled-button>
                <md-outlined-button slot="secondaryAction" dialogAction="cancel">Cancel</md-outlined-button>
            </mwc-dialog>
            <mwc-dialog id="image-dialog">
                <dm-image-dialog .close=${()=> void this.dialogService.closeImageDialog()}></dm-image-dialog>
            </mwc-dialog>
        `
    }

    renderSnackbars(){
        return html`
            <diymate-snackbar id="bot-warning-snackbar" leading >
              <md-icon-button slot="dismiss"><md-icon>close</md-icon></md-icon-button>
            </diymate-snackbar>
            <diymate-snackbar id="message-snackbar" leading>
                <md-icon-button slot="dismiss"><md-icon>close</md-icon></md-icon-button>
            </diymate-snackbar>
            <diymate-snackbar id="error-snackbar" leading>
                <md-icon-button slot="dismiss"><md-icon>close</md-icon></md-icon-button>
            </diymate-snackbar>
        `;
    }

    render() {
        return html`
           <div id="diy-mate-wrapper"></div>
           <div id="dialogs-container">
            ${this.renderDialogs()}         
           </div>
           <div id="snackbar-container">
            ${this.renderSnackbars()}
           </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "diymate-app": DIYMateApp;
    }
}