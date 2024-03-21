import { MobxLitElement } from "@adobe/lit-mobx";
import { ToggleControl } from "@core/operations/operation_controls";
import { TemplateResult, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import controlStyles from "./control_styles";
import { styleMap } from "lit/directives/style-map.js";
import "@material/web/switch/switch";
import { runInAction } from "mobx";

/**
 * Shows a toggle control for an operation
 */
@customElement("dm-toggle-control")
export class ToggleControlComponent extends MobxLitElement {
    @property({ type: Object }) control!: ToggleControl;
    @property({ type: Object }) onHover = (
        isHovered: string | TemplateResult
    ) => {};

    static override get styles() {
        return [controlStyles];
    }

    protected render(): TemplateResult {
        const { control } = this;
        const hoverTooltip = control.getDescription();

        return html`
            <div
                class="row"
                style=${styleMap({ height: "38px" })}>
                <div
                    class="operation-control-prefix"
                    @mouseenter=${() => void this.onHover(hoverTooltip)}
                    @mouseleave=${() => void this.onHover("")}>
                    ${control.getPrefix()} :
                </div>
                <md-switch
                    ?selected=${control.value === true}
                    @change=${(e: any) => {
                    runInAction(()=>{
                        control.value = e.currentTarget.selected;
                    }) ;
                }}
                    @mouseenter=${() => void this.onHover(hoverTooltip)}
                    @mouseleave=${() => void this.onHover("")}>
                </md-switch>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "dm-toggle-control": ToggleControlComponent;
    }
}
