import { MobxLitElement } from "@adobe/lit-mobx";
import { diymateCore } from "@core/diymate_core";
import { ChoiceOperation, Operation } from "@core/operations";
import { ChoiceStep } from "@core/operations/steps";
import { KeyboardService } from "@core/services/keyboard_service";
import { OperationsService } from "@core/services/operations_service";
import { KeyCommand } from "@core/shared/keyboard";
import { PropertyValueMap, TemplateResult, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "./controls/key_command_small";
import { preventDefault } from "@lib/utils";
import { classMap } from "lit/directives/class-map.js";
import "@material/web/fab/fab"
import "@material/web/icon/icon";
import { OperationClass, OperationControls } from "@core/shared/interfaces";
import "./operation_controls";

@customElement("dm-choices")
export class ChoicesComponent extends MobxLitElement {
    static override get styles() {
        const style = css`
            :host {
                display: flex;
                flex-direction: column;
                width: 100%;
                height: 100vh;
            }

            .choices-controls-container {
                flex-grow: 0;
            }

            .choices-controls-container .operation-message {
                line-height: 1.5;
                margin-bottom: 20px;
            }

            .choices-container {
                flex-grow: 1;
                overflow: auto;
                padding-bottom: 150px;
                padding-right: 10px;
                width: 100%;
                margin-bottom: 140px;
            }

            .actions-container {
                display: grid;
                grid-template-columns: auto auto;
                margin: 0 0 30px;
            }

            .action-button-wrapper {
                display: flex;
                padding: 5px 0;
            }

            .action-button-wrapper:nth-child(2n) {
                justify-content: flex-end;
            }

            .choice {
                cursor: pointer;
                margin-bottom: 15px;
                position: relative;
                line-height: 1.6;
                font-size: 14px;
                border-radius: 5px;
                padding: 8px 12px;
                border: 1px solid var(--md-sys-color-outline);
            }

            .choice.selected {
                background-color: var(--md-sys-color-primary-fixed-dim);
                border: none;
            }

            .empty-choices {
                font-style: italic;
                margin-top: 20px;
            }

            .orig-text-label {
                font-size: 9pt;
                color: var(--md-sys-color-on-primary-fixed);
            }

            .choices-instructions {
                padding: 8px 0;
                color: var(--md-sys-color-on-primary-fixed);
            }

            .choices-instructions:last-of-type {
                margin-bottom: 10px;
                padding-bottom: 20px;
            }

            .choice-buttons {
                transform: scale(0.7);
                position: absolute;
                right: -25px;
                bottom: -25px;
            }

            .choice-buttons md-fab.choose {
                --mdc-theme-secondary: var(--md-sys-color-secondary);
                --mdc-theme-on-secondary: var(--md-sys-color-on-secondary);
            }

            .choice-buttons md-fab.add-remove {
                --mdc-theme-secondary: var(--md-sys-color-outline);
                --mdc-theme-on-secondary: var(--md-sys-color-on-secondary);
            }

            .choice-paragraph {
                margin-top: 0;
                margin-bottom: 10px;
            }

            .choice-paragraph:last-of-type {
                margin-bottom: 0;
            }
        `;
        return [style];
    }

    private readonly keyboardService = diymateCore.getService(KeyboardService);
    private readonly operationsService = diymateCore.getService(OperationsService);

    @property({ type: Object }) choiceStep!: ChoiceStep;

    private readonly keyboardServiceHelper =
        this.keyboardService.makeHelper("choiceStep");

    override firstUpdated(
        _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
    ): void {
        const { choices, firstChoiceIsOriginal } = this.choiceStep;
        if (firstChoiceIsOriginal && !this.isEmpty()) {
            choices.setIndex(1);
        }

        this.keyboardServiceHelper.registerKeyHandler("ArrowDown", () => {
            choices.incrementIndex();
        });
        this.keyboardServiceHelper.registerKeyHandler("ArrowUp", () => {
            choices.decrementIndex();
        });
    }

    override disconnectedCallback(): void {
        super.disconnectedCallback();
        this.keyboardServiceHelper.unregisterKeyHandlers();
    }

    override connectedCallback(): void {
        super.connectedCallback();
    }

    isEmpty() {
        return this.choiceStep.choices.getNEntries() === 0;
    }

    private get choiceOperation(): ChoiceOperation {
        return this.operationsService.currentOperation! as ChoiceOperation;
    }

    override render() {
        const operation = this.operationsService.currentOperation;
        if (!(operation instanceof ChoiceOperation)) return;

        const isEmpty = this.isEmpty();

        return html`
            <div class="choices-controls-container">
                ${this.renderOperationMessage(operation)}
                ${this.renderOperationControls(operation)}
                ${this.renderActions(operation)}
                ${this.renderArrowInstructions()}
            </div>
            <div class="choices-container">
                ${this.renderChoices()}
                ${isEmpty ? this.renderEmptyMessage() : ""}
            </div>
        `;
    }

    renderOperationMessage(operation: Operation) {
        const message = operation.getMessage();
        if (!message) return "";

        return html` <div class="operation-message">${message}</div> `;
    }

    renderActions(operation: ChoiceOperation) {
        const isEmpty = this.isEmpty();
        const canRewriteChoice = operation.canRewriteChoice && !isEmpty;

        const actions = {
            choose: {
                message: "choose",
                keyCommand: new KeyCommand("Enter"),
                keyLabel: "enter",
                action: () => {
                    this.choiceStep.chooseCurrentIndex();
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
            refresh: {
                message: "refresh",
                keyCommand: new KeyCommand("Tab"),
                keyLabel: "tab",
                action: () => {
                    operation.restart();
                },
            },
            rewrite: {
                message: "rewrite",
                keyCommand: new KeyCommand("e", true),
                keyLabel: "e",
                action: () => {
                    this.operationsService.rewriteCurrentChoice();
                },
            },
        };

        return html`
            <div class="actions-container">
                ${isEmpty ? "" : this.renderAction(actions.choose)}
                ${this.renderAction(actions.cancel)}
                ${this.renderAction(actions.refresh)}
                ${canRewriteChoice ? this.renderAction(actions.rewrite) : ""}
            </div>
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

    renderArrowInstructions() {
        const nChoices = this.choiceStep.choices.getNEntries();
        if (nChoices < 2) return;

        const choiceIndex = this.choiceStep.choices.getIndex();
        return html`
            <div class="choices-instructions">
                <span class="key-command key-command-small">⬆</span>
                <span class="key-command key-command-small">⬇</span>
                to cycle through choices (${choiceIndex + 1}/${nChoices})
            </div>
        `;
    }

    renderChoices() {
        const canStar = this.choiceOperation.canStarChoice;
        const { choices, firstChoiceIsOriginal } = this.choiceStep;

        return choices.getEntries().map((choice, index) => {
            const selectIndex = (index: number) =>
                preventDefault(() => void choices.setIndex(index));

            const isSelected = choices.getIndex() === index;
            const choiceClasses = classMap({
                choice: true,
                selected: isSelected,
            });

            const isOrigText = firstChoiceIsOriginal && index === 0;
            const origTextLabel = html`<div class="orig-text-label">
                Original text
            </div>`;

            const choose = preventDefault(() => {
                this.choiceStep.chooseIndex(index);
            });
            const remove = preventDefault(() => {
                this.choiceStep.removeChoiceIndex(index);
            });
            // const onClickStar = preventDefault(() => {
            //     if (this.starredResultsService.hasStarred(choice)) {
            //         this.starredResultsService.unstar(choice);
            //     } else {
            //         this.starredResultsService.star(choice);
            //     }
            // });

            const renderChoiceButtons = () => {
                // const hasStarred =
                //     this.starredResultsService.hasStarred(choice);
                // const starIcon = hasStarred ? "star_rate" : "star_border";

                // clang-format off
                return html`
                    <div class="choice-buttons">
                        <md-fab
                            class="add-remove"
                            size="small"
                            @click=${remove}
                            title="remove">
                            <md-icon slot="icon">close</md-icon>
                        </md-fab>
                        
                        <md-fab
                            class="choose"
                            title="select"
                            size="small"
                            @click=${choose}>
                            <md-icon slot="icon">done</md-icon>
                        </md-fab>
                    </div>
                `;
                // clang-format on
            };

            // clang-format off
            return html`
                <div
                    class=${choiceClasses}
                    @click=${selectIndex(index)}
                    @dblclick=${choose}>
                    ${isOrigText ? origTextLabel : ""}
                    ${this.renderText(choice.content)}
                    ${isSelected ? renderChoiceButtons() : ""}
                </div>
            `;
            // clang-format on
        });
    }

    private renderText(text: string) {
        const brokenOnNewlines = text.split("\n");
        return brokenOnNewlines.map((p) => {
            return html`<p class="choice-paragraph">${p}</p>`;
        });
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

    renderEmptyMessage() {
        return html`
            <div class="empty-choices">No results for the given prompt.</div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "dm-choices": ChoicesComponent;
    }
}
