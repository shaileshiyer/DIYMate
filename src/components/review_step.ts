import { MobxLitElement } from "@adobe/lit-mobx";
import { diymateCore } from "@core/diymate_core";
import { Operation, ReviewOperation } from "@core/operations";
import { ReviewStep } from "@core/operations/steps";
import { OperationsService } from "@core/services/operations_service";
import { ReviewsService } from "@core/services/reviews_service";
import { KeyCommand } from "@core/shared/keyboard";
import { TemplateResult, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "./controls/key_command_small";
import { OperationClass, OperationControls } from "@core/shared/interfaces";
import "./operation_controls";

@customElement('dm-review-step')
export class ReviewStepComponent extends MobxLitElement {

    static override get styles(){
        const styles = css`

            :host {
                display: flex;
                flex-direction: column;
                width: 100%;
                height: 100%;
            }
            
            

            .review-controls-container {
                flex-grow: 0;
            }


            .review-controls-container .operation-message {
                line-height: 1.5;
                margin-bottom: 20px;
            }

            .review-container {
                flex-grow: 1;
                overflow: auto;
                /* padding-bottom: 150px; */
                padding-right: 10px;
                width: 100%;
                height:36em;
                margin-bottom: 1em;
                white-space: pre-line;
            }

            .review-container::-webkit-scrollbar {
                display: none;
            }

            .actions-container {
                display: grid;
                justify-content: space-around;
                grid-template-columns: auto auto;
                margin: 0 0 30px;
            }

            .action-button-wrapper {
                display: flex;
                padding: 5px 0;
            }
        `;

        return [styles];
    }

    private readonly operationsService = diymateCore.getService(OperationsService);
    private readonly reviewsService = diymateCore.getService(ReviewsService);

    @property({ type: Object }) reviewStep!: ReviewStep;


    renderOperationMessage(operation: Operation) {
        const message = operation.getMessage();
        if (!message) return "";

        return html` <div class="operation-message">${message}</div> `;
    }


    renderOperationControls(operation: Operation) {
        let controls: OperationControls;
        if (operation.hasInstanceControls()) {
            controls = operation.instanceControls;
        } else {
            const operationConstructor =
                operation.constructor as OperationClass;
            controls = operationConstructor.controls;
        }

        return html`
            <dm-operation-controls
                .controls=${controls}
                .onEnter=${() => operation.restart()}></dm-operation-controls>
        `;
    }

    
    renderAction(params: {
        message: string;
        keyCommand: KeyCommand;
        keyLabel: string;
        action: () => void;
    }) {
        const { message, keyCommand, keyLabel, action } = params;
        return html`
            <div class="action-button-wrapper">
                <dm-key-command-small
                    message=${message}
                    .keyCommand=${keyCommand}
                    keyLabel=${keyLabel}
                    .action=${action}>
                </dm-key-command-small>
            </div>
        `;
    }
    

    renderActions(operation: ReviewOperation) {
        const actions = {
            cancel: {
                message: "cancel",
                keyCommand: new KeyCommand("Escape"),
                keyLabel: "esc",
                action: () => {
                    operation.cancel();
                },
            },
            refresh: {
                message: "refresh",
                keyCommand: new KeyCommand("Tab"),
                keyLabel: "tab",
                action: () => {
                    operation.restart();
                },
            },
            finish: {
                message: "finish",
                keyCommand: new KeyCommand("Enter"),
                keyLabel: "Enter",
                action: () => {
                    operation.finish();
                },
            },

        };

        return html`
            <div class="actions-container">
                ${this.renderAction(actions.cancel)}
                ${this.renderAction(actions.refresh)}
                ${this.renderAction(actions.finish)}
            </div>
        `;
    }


    renderReviewInstructions():TemplateResult{
        return html`<div>You can always find your reviews in the reviews tab.</div>`
    }

    protected render(): TemplateResult {
        const operation = this.operationsService.currentOperation;
        if (!(operation instanceof ReviewOperation)) return html``;

        return html`
        <div class="review-controls-container">
                ${this.renderOperationMessage(operation)}
                ${this.renderOperationControls(operation)}
                ${this.renderActions(operation)}
                ${this.renderReviewInstructions()}
        </div>
        <div class="review-container">
            ${this.reviewStep.review?.content?? "Could not display review."}
        </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'dm-review-step': ReviewStepComponent;
    }
}