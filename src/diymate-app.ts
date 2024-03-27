import { LitElement, html, css, PropertyValueMap } from "lit";
import { customElement, property } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import './pages/diymate_home';
import './pages/new_diy'
import './pages/loading'
import './pages/editor_page'
import { diymateCore } from "@core/diymate_core";
import { RouterService } from "@core/services/router_service";
import { DialogService } from "@core/services/dialog_service";
import "./components/welcome_dialog";
import "@material/web/iconbutton/icon-button"
import '@material/mwc-dialog/mwc-dialog';
import "@components/snackbar/index";
import { SnackbarComponent } from "@components/snackbar";
import { Dialog } from "@material/mwc-dialog/mwc-dialog";

@customElement('diymate-app')
export class DIYMateApp extends MobxLitElement {
    private readonly routerService = diymateCore.getService(RouterService);
    private readonly dialogService = diymateCore.getService(DialogService);

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

        this.registerSnackbar('bot-warning-snackbar');
        this.registerSnackbar('message-snackbar');
        this.registerSnackbar('error-snackbar');
    }



    renderDialogs(){
        return html`
            <mwc-dialog id="welcome-dialog">
                <dm-welcome-dialog .close=${()=> void this.dialogService.closeWelcomeDialog()}></dm-welcome-dialog>
            </mwc-dialog>
            <mwc-dialog
                id="message-dialog"
                heading="${this.dialogService.messageHeader}"
                hideActions
            >
                ${this.dialogService.messageBody}
            </mwc-dialog>
            <mwc-dialog id="confirm">
                ${this.dialogService.messageBody}
                <button
                slot="primaryAction"
                dialogAction="confirm"
                >
                OK
                </button>
                <button slot="secondaryAction" dialogAction="cancel">Cancel</button>
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