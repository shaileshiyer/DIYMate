import { MobxLitElement } from "@adobe/lit-mobx";
import { KeyCommand, getMetaKeyString } from "@core/shared/keyboard";
import { OperationTrigger } from "@core/shared/types";
import { CSSResult, PropertyValueMap, TemplateResult, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import controlStyles from "./control_styles";
import { diymateCore } from "@core/diymate_core";
import { KeyboardService } from "@core/services/keyboard_service";
import '@material/web/button/outlined-button';
import keyCommandStyles from './key_command_styles'

/**
 * Component that shows a Key Command and button
 */
@customElement("dm-key-command")
export class KeyCommandComponent extends MobxLitElement {
    @property({ type: String }) message = "Command";
    @property({ type: Object }) keyCommand = new KeyCommand("NotImplemented");
    @property({ type: String }) keylabel = "";
    @property({ type: Object }) action = (
        triggerSource: OperationTrigger
    ) => {};
    @property({ type: Object }) onHover = (isHovered: boolean) => {};

    static override get styles(): CSSResult[] {
        return [controlStyles, keyCommandStyles];
    }

    private readonly keyboardService = diymateCore.getService(KeyboardService);
    private clearHandler = () => {};

    override firstUpdated(
        _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
    ): void {
        this.clearHandler = this.keyboardService.registerKeyHandler(
            this.keyCommand,
            () => {
                this.action(OperationTrigger.KEY_COMMAND);
            }
        );
    }

    override disconnectedCallback(): void {
        super.disconnectedCallback();
        this.clearHandler();
    }

    override render(): TemplateResult {
        const { message, keyCommand, keylabel } = this;
        const modifier = getMetaKeyString();

        const renderModifier = () =>
            keyCommand.metaKey
                ? html`<span class="key-command">${modifier}</span>${' + '}`
                : "";
        const renderShift = () =>
        keyCommand.shiftKey
            ? html`<span class="key-command">Shift</span>${' + '}`
            : "";
        const renderAlt = () =>
            keyCommand.altKey
                ? html`<span class="key-command">Alt</span>${' + '}`
                : "";
        const key = keylabel ? keylabel : keyCommand.key;

        return html`
            <div class="row">
                <div class="key-command-container">
                    ${renderModifier()}${renderShift()}${renderAlt()}
                    <span class="key-command">${key}</span>
                </div>
                <md-outlined-button
                    type="button"
                    @mousedown=${(event:MouseEvent) =>{
                        event.preventDefault();
                        this.action(OperationTrigger.BUTTON);
                        return false;
                    }}
                    @mouseenter=${()=> void this.onHover(true)}
                    @mouseleave=${()=> void this.onHover(false)}
                >
                ${message}
            </md-outlined-button>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "dm-key-command": KeyCommandComponent;
    }
}
