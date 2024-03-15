import { MobxLitElement } from "@adobe/lit-mobx";
import { diymateCore } from "@core/diymate_core";
import { OperationsService } from "@core/services/operations_service";
import { commandKeys } from "@core/services/text_editor_service";
import { OperationClass } from "@core/shared/interfaces";
import { KeyCommand } from "@core/shared/keyboard";
import { OperationTrigger } from "@core/shared/types";
import { PropertyValueMap, TemplateResult, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import "./controls/key_command";
import "./operation_controls";

@customElement("dm-operations")
export class OperationsComponent extends MobxLitElement {
    static override get styles() {
        const style = css`
            .operation-button-row,
            .operation-control-row {
                display: flex;
                flex-direction: row;
                align-items: center;
            }

            .operation-control-row {
                padding: 3px 0;
            }

            .operation-row {
                padding: 6px 0 15px;
                display: flex;
                flex-direction: column;
            }

            .operation-hint {
                font-style: italic;
                margin-top: 40px;
                line-height: 1.8;
            }

            .diymate-global-controls {
                margin-top: 12px;
                padding: 10px 0;
            }

            .global-controls-line {
                margin-bottom: 12px;
                border-top: 1px solid var(--gray);
                flex: 1;
                height: 1px;
            }
        `;
        return [style];
    }

    private readonly operationsService = diymateCore.getService(OperationsService);

    protected firstUpdated(
        _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
    ): void {
        this.operationsService.clearHoverTooltip();
    }

    override disconnectedCallback(): void {
        super.disconnectedCallback();
        this.operationsService.clearHoverTooltip();
    }

    override connectedCallback(): void {
        super.connectedCallback();
    }

    protected render(): TemplateResult {
        return html`${this.renderAvailableOperations()}
        ${this.renderOperationHint()}`;
    }

    renderAvailableOperations() {
        const availableOperations = this.operationsService.availableOperations;
        const renderedOperations = availableOperations.map(
            (operationClass, index) => {
                const buttonLabel = operationClass.getButtonLabel();
                const keyCommand = new KeyCommand(commandKeys[index], true);

                return html`
                    <div class="operation-row">
                        <dm-key-command
                            message=${buttonLabel}
                            .keyCommand=${keyCommand}
                            .action=${(triggerSource: OperationTrigger) => {
                                this.operationsService.triggerOperation(
                                    operationClass,
                                    triggerSource
                                );
                            }}
                            .onHover=${(isHovered: boolean) => {
                                if (isHovered) {
                                    const tooltip =
                                        operationClass.getDescription();
                                    this.operationsService.setHoverTooltip(
                                        tooltip
                                    );
                                } else {
                                    this.operationsService.clearHoverTooltip();
                                }
                            }}></dm-key-command>
                        ${this.renderOperationControls(operationClass)}
                    </div>
                `;
            }
        );

        return html`
            <div class="available-operations">${renderedOperations}</div>
        `;
    }

    renderOperationControls(operationClass: OperationClass) {
        if (!operationClass.controls) {
            return html``;
        }

        return html`
            <dm-operation-controls
                .controls=${operationClass.controls}
                .onEnter=${() => {
                    this.operationsService.triggerOperation(
                        operationClass,
                        OperationTrigger.CONTROL
                    );
                }}>
            </dm-operation-controls>
        `;
    }

    renderOperationHint() {
        return html`
            <div class="operation-hint">
                ${this.operationsService.hoverTooltip}
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "dm-operations": OperationsComponent;
    }
}
