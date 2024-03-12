import { MobxLitElement } from "@adobe/lit-mobx";
import { diymateCore } from "@core/diymate_core";
import { StepSliderControl, TextInputControl, TextareaControl, ToggleControl } from "@core/operations/operation_controls";
import { OperationsService } from "@core/services/operations_service";
import { OperationControl, OperationControls } from "@core/shared/interfaces";
import { TemplateResult, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

import "./controls/key_command";
import "./controls/key_command_small";
import "./controls/step_slider_control";
import "./controls/text_input_control";
import "./controls/textarea-control";
import "./controls/toggle_control";
import { OperationTrigger } from "@core/shared/types";

/**
 * A component that displays the controls for a given a operation.
 */
@customElement("dm-operation-controls")
export class OperationControlsComponent extends MobxLitElement {
    static override get styles() {
        const style = css`
            .row {
                display: flex;
                flex-direction: row;
                align-items: center;
                padding: 3px 0;
            }
        `;
        return [style];
    }
    private readonly operationsService =
        diymateCore.getService(OperationsService);

    @property({ type: Object }) controls!: OperationControls;
    @property({ type: Object }) onEnter = () => {};
    @property({ type: Boolean }) override autofocus = false;

    private renderControl(control: OperationControl) {
        const onHover = (tooltip: string | TemplateResult) => {
            this.operationsService.setHoverTooltip(tooltip);
        };

        if (control instanceof TextInputControl) {
            return html`
                <dm-text-input-control
                    .onClickHelper=${() => {
                        if (control.hasHelperOperation()) {
                            const helperOperationClass =
                                control.helperOperation!;
                            this.operationsService.startOperation(
                                helperOperationClass,
                                OperationTrigger.CONTROL
                            );
                        }
                    }}
                    .control=${control}
                    .onEnter=${() => void this.onEnter()}
                    .onHover=${onHover}
                    ?autofocus=${this.autofocus}>
                </dm-text-input-control>
            `;
        } else if (control instanceof StepSliderControl){
            return html`
            <dm-step-slider-control .control=${control} .onHover=${onHover}></dm-step-slider-control>
            `;
        } else if (control instanceof ToggleControl){
            return html`
            <dm-toggle-control .control=${control} .onHover=${onHover}></dm-toggle-control>
            `;
        } else if (control instanceof TextareaControl){
            return html`
                <dm-textarea-control
                    .onClickHelper=${() => {
                        if (control.hasHelperOperation()) {
                            const helperOperationClass =
                                control.helperOperation!;
                            this.operationsService.startOperation(
                                helperOperationClass,
                                OperationTrigger.CONTROL
                            );
                        }
                    }}
                    .control=${control}
                    .onEnter=${() => void this.onEnter()}
                    .onHover=${onHover}
                    ?autofocus=${this.autofocus}>
                </dm-textarea-control>
            `;
        }

        return html``;

    }

    protected override render(): TemplateResult {
        const { controls } = this;
        if (!controls) return html``;
        return html`${Object.values(controls).map(
            (control) => html` <div class="row">${this.renderControl(control)}</div> `
          )}`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "dm-operation-controls": OperationControlsComponent;
    }
}
