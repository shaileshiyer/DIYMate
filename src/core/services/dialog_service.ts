import { makeObservable, observable } from "mobx";
import { KeyboardService, KeyboardServiceHelper } from "./keyboard_service";
import { LocalStorageService } from "./local_storage_service";
import { Service } from "./service";
import { TextEditorService } from "./text_editor_service";
import { Dialog } from "@material/mwc-dialog/mwc-dialog";
import { SnackbarComponent } from "@components/snackbar";

import { TemplateResult, html } from "lit";
import { WelcomeDialog } from "@components/welcome_dialog";

interface ServiceProvider {
    keyboardService: KeyboardService;
    localStorageService: LocalStorageService;
    textEditorService: TextEditorService;
}

export class DialogService extends Service {
    messageBody: string | TemplateResult = "";
    messageHeader: string | TemplateResult = "";
    private keyboardServiceHelper!: KeyboardServiceHelper;
    private readonly dialogs = new Map<string, Dialog>();
    private readonly snackbars = new Map<string, SnackbarComponent>();

    constructor(private readonly serviceProvider: ServiceProvider) {
        super();
        makeObservable(this, {
            messageBody: observable,
            messageHeader: observable,
        });
    }

    get keyboardService() {
        return this.serviceProvider.keyboardService;
    }

    get localStorageService() {
        return this.serviceProvider.localStorageService;
    }

    get textEditorService() {
        return this.serviceProvider.textEditorService;
    }

    initialize() {
        const {keyboardService} = this.serviceProvider;
        this.keyboardServiceHelper = keyboardService.makeHelper('dialogs');
    }

    registerDialog(id: string, dialog: Dialog) {
        this.dialogs.set(id, dialog);
    }

    registerSnackbar(id: string, snackbar: SnackbarComponent) {
        this.snackbars.set(id, snackbar);
    }

    closeWelcomeDialog() {
        const welcomeDialog = this.dialogs.get("welcome-dialog");
        if (welcomeDialog) {
            welcomeDialog.close();
        }
    }

    openMessageDialog(
        messageBody: string | TemplateResult,
        messageHeader = ""
    ) {
        this.messageBody = messageBody;
        const dialog = this.dialogs.get("message-dialog");
        if (dialog instanceof Dialog) {
            this.openDialog(dialog);
        }
    }

    private wasConfirmEventListenerAdded = false;
    private resolveConfirmDialog: (confirmed: boolean) => void = () => {};

    async openConfirmDialog(
        messageBody: string | TemplateResult,
        messageHeader = ""
    ): Promise<boolean> {
        this.messageBody = messageBody;
        const dialog = this.dialogs.get("confirm");
        if (dialog instanceof Dialog) {
            this.openDialog(dialog);

            if (!this.wasConfirmEventListenerAdded) {
                dialog.addEventListener("closed", (event) => {
                    // tslint:disable-next-line:no-any
                    if ((event as any).detail.action === "confirm") {
                        this.resolveConfirmDialog(true);
                    } else {
                        this.resolveConfirmDialog(false);
                    }
                    this.resolveConfirmDialog = () => {};
                });
                this.wasConfirmEventListenerAdded = true;
            }

            return new Promise((resolve) => {
                this.resolveConfirmDialog = resolve;
            });
        }

        return Promise.resolve(false);
    }

    openWelcomeDialog() {
        const dialog = this.dialogs.get("welcome-dialog");
        const hasBeenWelcomed = this.localStorageService.getHasBeenWelcomed();
        if (dialog) {
            const welcomeComponent = dialog.querySelector(
                "dm-welcome-dialog"
            ) as WelcomeDialog;
            welcomeComponent.hasbeenWelcomed = hasBeenWelcomed;
            
            dialog.addEventListener('closed', () => {
                this.localStorageService.setHasBeenWelcomed();
                this.openDoNotTrustTheBotSnackbar();
                this.textEditorService.getEditor.commands.focus();
              });

            this.openDialog(dialog)
        }
    }

    private openDialog(dialog: Dialog) {
        dialog.open = true;
        this.keyboardServiceHelper.registerKeyHandler("Escape", () => {
            dialog.close();
        });
        dialog.addEventListener("closed", () => {
            this.keyboardServiceHelper.unregisterKeyHandlers();
        });
    }

    getPendingSuggestionsMessage() {
        return html`
            You can't edit your DIY with pending choices.<br />
            Please choose a choice from the sidebar, or hit cancel.
        `;
    }

    getDoNotTrustTheBotMessage() {
        return html`
            ⚠️ DO NOT BELIEVE THE BOT!<br />
            Any information it provides is likely to be made up.<br />
            Take anything it outputs with a grain of salt.
        `;
    }

    private hasBeenWarnedNotToTrustTheBot = false;

    openDoNotTrustTheBotSnackbar() {
        if (!this.hasBeenWarnedNotToTrustTheBot) {
            this.openSnackbar(
                "bot-warning-snackbar",
                this.getDoNotTrustTheBotMessage(),
                true
            );
            // this.hasBeenWarnedNotToTrustTheBot = true;
        }
    }

    openPendingChoiceSnackbar() {
        const content = this.getPendingSuggestionsMessage();
        this.openSnackbar("message-snackbar", content);
    }

    openErrorSnackbar(errorMessage: string) {
        this.openSnackbar("error-snackbar", errorMessage, true);
    }

    private openSnackbar(
        id: string,
        content: string | TemplateResult,
        isWarning = false
    ) {
        const htmlContent: TemplateResult =
            typeof content === "string" ? html`${content}` : content;
        // tslint:disable-next-line:no-any
        const snackbar = this.snackbars.get(id);
        if (snackbar instanceof SnackbarComponent) {
            snackbar.open = false;
            snackbar.isWarning = isWarning;
            snackbar.content = htmlContent;
            snackbar.show();
        }
    }
}
