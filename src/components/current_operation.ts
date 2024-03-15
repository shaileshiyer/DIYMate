import { MobxLitElement } from "@adobe/lit-mobx";
import { diymateCore } from "@core/diymate_core";
import { Operation } from "@core/operations";
import { ChoiceStep, ControlsStep, LoadingStep } from "@core/operations/steps";
import { OperationsService } from "@core/services/operations_service";
import { PropertyValueMap, TemplateResult, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "./operation_controls";
import "@material/web/progress/circular-progress";
import { KeyCommand } from "@core/shared/keyboard";
import "./choices";
import "./controls/key_command_small";

/**
 * A component that displays the current Operation in the sidebar
 */
@customElement("dm-current-operation")
export class CurrentOperationComponent extends MobxLitElement {
    static override get styles() {
        const style = css`
            .controls-step-title {
                font-weight: 700;
                color: var(--blue);
                margin-bottom: 20px;
                border-bottom: 2px solid var(--blue);
                padding: 10px 0;
            }

            .controls-step-subtitle {
                font-weight: normal;
                color: black;
                font-style: italic;
                padding: 10px 0;
            }

            .operation-loading-container {
                margin-top: 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
                width: 100%;
            }

            .operation-spinner-container {
                margin-bottom: 20px;
            }

            .operation-loading-message {
                text-align: center;
                width: 100%;
            }

            .buttons-container {
                margin: 5px 0;
                display: flex;
                padding-left: 100px;
            }

            dm-key-command-small {
                margin-right: 10px;
            }

            mwc-circular-progress-four-color {
                --mdc-circular-progress-bar-color-1: #2196f3;
                --mdc-circular-progress-bar-color-2: #e91e63;
                --mdc-circular-progress-bar-color-3: #ffc107;
                --mdc-circular-progress-bar-color-4: #03dac5;
            }
        `;
        return [style];
    }

    private readonly operationsService = diymateCore.getService(OperationsService);

    override render(): TemplateResult {
        const operation = this.operationsService.currentOperation;
        if (operation === null) return html``;

        const currentStep = operation.currentStep;
        console.debug(currentStep);
        if (currentStep instanceof LoadingStep) {
            return this.renderLoadingMessage(currentStep);
        }

        if (currentStep instanceof ChoiceStep) {
            return html` <dm-choices .choiceStep=${currentStep}></dm-choices> `;
        }

        if (currentStep instanceof ControlsStep) {
            return this.renderControlsStep(currentStep);
        }

        return html``;
    }

    renderLoadingMessage(currentStep: LoadingStep): TemplateResult {
        return html`
            <div class="operation-loading-container">
                <div class="operation-spinner-container">
                    <md-circular-progress
                        fourColor
                        indeterminate></md-circular-progress>
                </div>
                <div class="operation-loading-message">
                    ${currentStep.message}
                </div>
            </div>
        `;
    }

    renderControlsStep(currentStep: ControlsStep): TemplateResult {
        const operation = this.operationsService.currentOperation!;

        const subtitle = currentStep.subtitle
            ? html`<div class="controls-step-subtitle">
                  ${currentStep.subtitle}
              </div>`
            : html``;

        return html`
            <div class="controls-step-title">
                ${currentStep.title} ${subtitle}
            </div>
            ${this.renderControls(currentStep)}
            <div class="buttons-container">
                ${this.renderButtons(operation)}
            </div>
        `;
    }

    renderControls(currentStep: ControlsStep) {
        return html`
            <dm-operation-controls
                .controls=${currentStep.controls}
                .onEnter=${() => {
                    currentStep.finish();
                }}
                autofocus></dm-operation-controls>
        `;
    }

    renderButtons(operation: Operation) {
        const actions = {
            go: {
                message: "go",
                keyCommand: new KeyCommand("Enter"),
                keyLabel: "enter",
                action: () => {
                    operation.currentStep.finish();
                },
            },
            cancel: {
                message: "cancel",
                keyCommand: new KeyCommand("Escape"),
                keyLabel: "esc",
                action: () => {
                    operation.cancel();
                },
            },
        };

        return [
            this.renderKeyCommand(actions.go),
            this.renderKeyCommand(actions.cancel),
        ];
    }

    renderKeyCommand(params: {
        message: string;
        keyCommand: KeyCommand;
        keyLabel: string;
        action: () => void;
    }) {
        const { message, keyCommand, keyLabel, action } = params;
        return html`
            <dm-key-command-small
                message=${message}
                .keyCommand=${keyCommand}
                keyLabel=${keyLabel}
                .action=${action}>
            </dm-key-command-small>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "dm-current-operation": CurrentOperationComponent;
    }
}
