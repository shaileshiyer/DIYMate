import { MobxLitElement } from "@adobe/lit-mobx";
import { KeyCommand, getMetaKeyString } from "@core/shared/keyboard";
import { OperationTrigger } from "@core/shared/types";
import { CSSResult, PropertyValueMap, TemplateResult, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import controlStyles from "./control_styles";
import { diymateCore } from "@core/diymate_core";
import { KeyboardService } from "@core/services/keyboard_service";
import "@material/web/button/outlined-button";
import keyCommandStyles from "./key_command_styles";
/**
 * Component that shows a Small Key Command and button
 */
@customElement("dm-key-command-small")
export class KeyCommandSmallComponent extends MobxLitElement {
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

    protected renderKeyCommand() {
        const { keyCommand, keylabel } = this;

        const modifier = getMetaKeyString();

        const renderModifier = () =>
            keyCommand.metaKey
                ? html`<span class="key-command key-command-small"
                          >${modifier}</span
                      >${" + "}`
                : "";
        const key = keylabel ? keylabel : keyCommand.key;

        return html`
            <div class="key-command-container-small">
                ${renderModifier()}
                <span class="key-command key-command-small">${key}</span>
            </div>
        `;
    }

    override render(): TemplateResult {
        const { message } = this;

        return html`
                <md-outlined-button
                    type="button"
                    class="key-command-button"
                    @mousedown=${(event: MouseEvent) => {
                        event.preventDefault();
                        this.action(OperationTrigger.BUTTON);
                        return false;
                    }}
                    @mouseenter=${() => void this.onHover(true)}
                    @mouseleave=${() => void this.onHover(false)}>
                    ${message} ${this.renderKeyCommand()}
                </md-outlined-button>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "dm-key-command-small": KeyCommandSmallComponent;
    }
}
