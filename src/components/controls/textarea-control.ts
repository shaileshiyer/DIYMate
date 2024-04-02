import "@material/web/icon/icon";
import "@material/web/textfield/filled-text-field";
import "@material/web/button/outlined-button";
import { MobxLitElement } from "@adobe/lit-mobx";
import { html, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";

import { TextareaControl } from "@core/operations/operation_controls";
import controlStyles from "./control_styles";
import { runInAction } from "mobx";
/**
 * A component that displays an input text area control for an operation
 */
@customElement("dm-textarea-control")
export class TextareaControlComponent extends MobxLitElement {
    @property({ type: Object, reflect: true }) control!: TextareaControl;
    @property({ type: Object, attribute: false }) onCopy: (
        e: ClipboardEvent
    ) => void = (e: ClipboardEvent) => {};
    @property({ type: Object }) onEnter = () => {};
    @property({ type: Object }) onClickHelper = () => {};
    @property({ type: Object }) onHover = (
        isHovered: string | TemplateResult
    ) => {};
    @property({ type: Boolean }) override autofocus = false;

    static override get styles() {
        return [controlStyles];
    }

    override render() {
        const { control } = this;
        const hoverTooltip = control.getDescription();

        return html`
            <div class="row">
                <div
                    class="operation-control-prefix"
                    @mouseenter=${() => void this.onHover(hoverTooltip)}
                    @mouseleave=${() => void this.onHover("")}>
                    ${control.getPrefix()} :
                </div>
                <div class="operation-control-input">
                    <textarea
                        placeholder=${control.placeholder}
                        class="textarea-control"
                        @keydown=${(e: KeyboardEvent) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                e.stopImmediatePropagation();
                                this.onEnter();
                                return false;
                            }
                            return true;
                        }}
                        @input=${
                            // tslint:disable-next-line:no-any
                            (e: any) => {
                                runInAction(()=>{
                                    control.value = e.target.value
                                }) ;
                            }
                        }
                        .value=${control.value}
                        @mouseenter=${() => void this.onHover(hoverTooltip)}
                        @mouseleave=${() => void this.onHover("")}
                        @copy=${(e: ClipboardEvent) => {
                            this.onCopy(e);
                        }}></textarea>
                    ${this.renderHelperOperationButton()}
                </div>
            </div>
        `;
    }

    renderHelperOperationButton() {
        const { control } = this;

        if (!control.hasHelperOperation()) return "";
        const hoverTooltip = control.helperOperation!.getDescription();

        return html`
            <md-outlined-button
                type="button"
                class="helper-operation"
                @click=${() => {
                    this.onClickHelper();
                }}
                @mouseenter=${() => void this.onHover(hoverTooltip)}
                @mouseleave=${() => void this.onHover("")}>
                <md-icon>
                    <span class="material-symbols-outline"> auto_awesome </span>
                </md-icon>
            </md-outlined-button>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "dm-textarea-control": TextareaControlComponent;
    }
}
