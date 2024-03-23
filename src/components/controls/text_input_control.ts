import "@material/web/icon/icon";
import "@material/web/textfield/filled-text-field";
import "@material/web/button/outlined-button";
import { MobxLitElement } from "@adobe/lit-mobx";
import { html, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { TextInputControl } from "@core/operations/operation_controls";
import controlStyles from "./control_styles";
import { runInAction } from "mobx";
import { MdFilledTextField } from "@material/web/textfield/filled-text-field";
import { createRef, ref } from "lit/directives/ref.js";
/**
 * A component that displays an input text control for an operation
 */
@customElement("dm-text-input-control")
export class TextInputControlComponent extends MobxLitElement {
    @property({ type: Object }) control!: TextInputControl;
    @property({ type: Object }) onEnter = () => {};
    @property({ type: Object }) onClickHelper = () => {};
    @property({ type: Object }) onHover = (
        isHovered: string | TemplateResult
    ) => {};
    @property({ type: Boolean }) tofocus = false;

    static override get styles() {
        return [controlStyles];
    }

    // private focusCallback = (element:Element|undefined)=>{
    //   if(element){
    //     console.debug('focusCallback',element,document.activeElement);
    //     element.focus();
    //   }
    // }

    override firstUpdated() {
        const input = this.renderRoot.querySelector(".autofocus");
        console.debug("text-field-update", input);
        if (this.tofocus && input instanceof HTMLInputElement) {
            input.addEventListener("focus", () => {
                console.debug("isfocusing");
            });
            console.debug("input", input);
            // this.inputElement.value?.focus();
            input.focus();
            console.debug(
                "text-fieldfocus",
                input.autofocus,
                document.activeElement
            );
            // Reset the value to the current value in order to make the cursor appear
            // at the end of the input
            const val = input.value;
            input.value = "";
            input.value = val;
        }
    }

    override render() {
        const inputClasses = classMap({
            autofocus: this.tofocus,
            "text-input-control": true,
        });

        const { control } = this;
        const hoverTooltip = control.getDescription();

        // clang-format off
        return html`
            <div class="row">
                <div
                    class="operation-control-prefix"
                    @mouseenter=${() => void this.onHover(hoverTooltip)}
                    @mouseleave=${() => void this.onHover("")}>
                    ${control.getPrefix()} :
                </div>
                <div class="operation-control-input">
                    <input
                        type="text"
                        class=${inputClasses}
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
                                runInAction(() => {
                                    control.value = e.target.value;
                                });
                            }
                        }
                        value="${control.value}"
                        placeholder="${control.placeholder}"
                        @mouseenter=${() => void this.onHover(hoverTooltip)}
                        @mouseleave=${() => void this.onHover("")}
                        >
                      </input>
                </div>
            </div>
            ${this.renderHelperOperationButton()}
        `;
        // clang-format on
    }

    renderHelperOperationButton() {
        const { control } = this;

        if (!control.hasHelperOperation()) return "";
        const hoverTooltip = control.helperOperation!.getDescription();

        // clang-format off
        return html`
            <div class="row">
                <div class="operation-control-prefix"></div>
                <span class="helper-operation-container">
                    or...
                    <md-outlined-button
                        type="button"
                        class="helper-operation"
                        @click=${() => {
                            this.onClickHelper();
                        }}
                        @mouseenter=${() => void this.onHover(hoverTooltip)}
                        @mouseleave=${() => void this.onHover("")}>
                        ${control.helperOperation!.getButtonLabel()}
                    </md-outlined-button>
                </span>
            </div>
        `;
        // clang-format on
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "dm-text-input-control": TextInputControlComponent;
    }
}
