import { MobxLitElement } from "@adobe/lit-mobx";
import { diymateCore } from "@core/diymate_core";
import { CursorService } from "@core/services/cursor_service";
import { SentencesService } from "@core/services/sentences_service";
import { TextEditorService } from "@core/services/text_editor_service";
import { LitElement, PropertyValueMap, TemplateResult, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@material/web/tabs/primary-tab";
import "@material/web/tabs/secondary-tab";
import "@material/web/tabs/tabs";
import "@material/web/icon/icon";

import "./chat";
import "./error_message";
import "./controls/key_command"

import { OperationsService } from "@core/services/operations_service";
import { runInAction } from "mobx";
import { classMap } from "lit/directives/class-map.js";
import { DocumentStoreService } from "@core/services/document_store_service";
import { InitializationService } from "@core/services/initialization_service";
import "./operations";
import "./current_operation";
import "./reviews";
import {tooltip} from './simple_tooltip';

@customElement("diymate-editor-sidebar")
export class DIYMateEditorSidebar extends MobxLitElement {
    private cursorService = diymateCore.getService(CursorService);
    private textEditorService = diymateCore.getService(TextEditorService);
    private sentencesService = diymateCore.getService(SentencesService);
    private operationsService = diymateCore.getService(OperationsService);
    private documentStoreService = diymateCore.getService(DocumentStoreService);
    private initializationService = diymateCore.getService(
        InitializationService
    );

    @property({ type: Number })
    activeTab: number = 0;

    protected firstUpdated(
        _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
    ): void {}
    connectedCallback(): void {
        super.connectedCallback();
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
    }

    protected renderDebug() {
        const availableOps = this.operationsService.availableOperations.map((val)=> val.name)
        return html`<div id="debug-wrappper">
            <h1>Sidebar Wrapper</h1>
            <p>Selected Text: ${this.cursorService.selectedText}</p>
            
            <p>
                serializedRange:
                ${JSON.stringify(this.cursorService.serializedRange)}
            </p>
            <p>currentSentence: ${this.sentencesService.currentSentence}</p>
            <p>currentSentenceSerializedRange:${JSON.stringify(this.sentencesService.currentSentenceSerializedRange)}</p>
            <p>nextSentenceOffset:${JSON.stringify(this.sentencesService.getNextSentenceRange())}</p>
            <p>currentSentenceIndex:${this.sentencesService.currentSentenceIndex}</p>
            
            <p><strong>CursorOffset: ${this.cursorService.cursorOffset} </strong></p>
            <p>isCursorAtStartOfNode: ${this.cursorService.isCursorAtStartOfNode}</p>
            <p>isCursorAtEndOfNode: ${this.cursorService.isCursorAtEndOfNode}</p>
            <p>isCurrentNodeEmpty: ${this.cursorService.isCurrentNodeEmpty}</p>
            <p>isCollapsed: ${this.cursorService.isCursorCollapsed}</p>
            <p>isAtStart: ${this.cursorService.isCursorAtStartOfText}</p>
            <p>isAtEnd: ${this.cursorService.isCursorAtEndOfText}</p>

            <p>InSingleNode: ${this.cursorService.isCursorInSingleNode}</p>
            <p>InTitle: ${this.cursorService.isCursorAtTitle}</p>
            <p>SectionTitle: ${this.cursorService.isCursorAtSectionTitle}</p>
            <p>InIntro: ${this.cursorService.isCursorInIntroduction}</p>
            
            <p>InStepTitle: ${this.cursorService.isCursorAtStepTitle}</p>
            <p>InStep: ${this.cursorService.isCursorInStep}</p>
            <p>InConclusionTitle: ${this.cursorService.isCursorAtConclusionTitle}</p>
            <p>InConclusion: ${this.cursorService.isCursorInConclusion}</p>
            <p>Plain Text:</p>
            <md-filled-text-field
                style="width:100%;"
                type="textarea"
                name="plain-text"
                placeholder="PlainText"
                .value=${this.textEditorService.plainText}
                rows="5"
                spellcheck="false"></md-filled-text-field>
                <p>Pre Text:</p>
            <md-filled-text-field
                style="width:100%;"
                type="textarea"
                name="plain-text"
                placeholder="PlainText"
                .value=${this.cursorService.preText}
                rows="10"
                spellcheck="false"></md-filled-text-field>
                <p>Post Text:</p>
            <md-filled-text-field
                style="width:100%;"
                type="textarea"
                name="plain-text"
                placeholder="PlainText"
                .value=${this.cursorService.postText}
                rows="10"
                spellcheck="false"></md-filled-text-field>
        </div> `;
    }

    static override get styles() {
        const styles = css`
            #editor-sidebar-wrapper {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                padding: 3px;
                margin: 2px;
            }

            #sidebar-content {
                justify-content: space-around;
                height: 55em;
                overflow: auto;
                /* overflow-y: scroll; */
                /* min-height:100%; */
            }

            #sidebar-content::-webkit-scrollbar {
                display: none;
            }

            .sidebar-contents {
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                padding: 10px 35px;
            }

            .no-padding {
                padding: 0;
            }

            .sidebar-bottom-links {
                margin-top: 20px;
            }

            .sidebar-bottom-links .link-button:not(:last-of-type) {
                margin-right: 5px;
            }

            .sidebar-contents .controls {
                text-transform: lowercase;
                user-select: none;
            }

            .sidebar-contents .button,
            .sidebar-contents .arrow,
            .sidebar-contents .controls-label,
            .sidebar-contents .controls-value {
                display: inline-block;
            }

            .sidebar-contents .controls-value {
                width: 30px;
                text-align: center;
                font-weight: bold;
            }

            .sidebar-contents .button {
                background: var(--dark-gray);
                padding: 5px 9px;
                border-radius: 4px;
                color: var(--white);
                font-size: 12px;
                margin-left: 5px;
                letter-spacing: 0.5px;
            }

            .sidebar-contents .arrow {
                width: 20px;
                text-align: center;
                height: 20px;
                line-height: 20px;
            }

            .sidebar-contents .button,
            .sidebar-contents .arrow {
                cursor: pointer;
            }

            .sidebar-contents .index-input {
                width: 40px;
                margin-right: 5px;
                margin-left: 5px;
                text-align: center;
            }

            .hidden {
                display: none;
            }

            .selected-text-prompt {
                font-style: italic;
                max-width: 270px;
            }

            .sidebar-bottom {
                position: fixed;
                bottom: 25px;
                left: 100vw - var(--sidebar-right-width) + 30px;
                /* background: rgba(255, 255, 255, 0.8); */
            }

            .link-button {
                font-size: 14px;
                line-height: 1.5;
                letter-spacing: 0.2px;
                display: inline-block;
                text-decoration: underline;
                cursor: pointer;
            }

            .link-button.disabled {
                text-decoration: none;
                cursor: default;
                pointer-events: none;
            }
        `;

        return [styles];
    }

    private setActiveIndex(index: number) {
        this.activeTab = index;
    }

    renderLinkButton(
        text: string,
        tooltipHint:string,
        onClick: (e: Event) => void | Promise<void>,
        disabled = false
    ) {
        const buttonClasses = classMap({
            "link-button": true,
            disabled: disabled,
        });
        return html`<div
            class=${buttonClasses}
            @click=${onClick}
            ${tooltip(tooltipHint)}
            >
            ${text}
        </div>`;
    }

    renderMainMenuButton(): TemplateResult {
        const onClick = () => {
            this.initializationService.reset();
        };
        return this.renderLinkButton("Main Menu","go to the main menu",onClick);
    }

    renderSaveButton(): TemplateResult {
        if (this.documentStoreService.isSaving) {
            return this.renderLinkButton("saving...","",() => {}, true);
        }

        const onClick = () => {
            this.documentStoreService.saveDocument();
        };
        return this.renderLinkButton("Save DIY","Saving DIY", onClick);
    }

    private getTopAndBottomContents() {
        let top: TemplateResult = html``;
        let bottom: TemplateResult = html``;

        if (this.operationsService.currentOperation !== null) {
            top = html`<dm-current-operation></dm-current-operation>`;
            bottom = html``;
        } else if (this.operationsService.isError) {
            // If the operation has errored, we'll add a message in the sidebar
            const onClose = () => {
                runInAction(() => {
                    this.operationsService.isError = false;
                });
            };
            const getMessage = () => {
                return html`
                ⚠️ Something went wrong... </br>
                Diymate is busy, please try again later.
                `;
            };

            top = html`
                <diymate-error-message
                    .onClose=${onClose}
                    .getMessage=${getMessage}>
                </diymate-error-message>
            `;
        } else {
            top = html`<dm-operations></dm-operations>`;
            

            const documentRow = html`
                ${this.renderMainMenuButton()} ${this.renderSaveButton()}
            `;

            bottom = html`<div class="sidebar-bottom-links">
                ${documentRow}
            </div>`;
        }

        return { top, bottom };
    }

    protected renderControls() {
        const { top, bottom } = this.getTopAndBottomContents();

        return html`
            <div class="sidebar-top">${top}</div>
            <div class="sidebar-bottom">${bottom}</div>
        `;
    }

    private renderSidebarContent(): TemplateResult {
        switch (this.activeTab) {
            case 0:
                return html`${this.renderControls()}`;
            case 1:
                return html`<diymate-chat></diymate-chat>`;
            case 2:
                return html`<dm-review-tab></dm-review-tab>`
            case 3:
                return html`${this.renderDebug()}`;
        }

        return html``;
    }

    protected render(): TemplateResult {
        return html`
            <div id="editor-sidebar-wrapper">
                <div id="sidebar">
                    <md-tabs
                        active-tab-index=${this.activeTab}
                        @change=${(event) =>
                            this.setActiveIndex(event.target.activeTabIndex)}>
                        <md-secondary-tab> Controls</md-secondary-tab>
                        <md-secondary-tab> Chat </md-secondary-tab>
                        <md-secondary-tab> Reviews </md-secondary-tab>
                        <md-secondary-tab> Debug </md-secondary-tab>
                    </md-tabs>
                    <div id="sidebar-content">
                        ${this.renderSidebarContent()}
                    </div>
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "diymate-editor-sidebar": DIYMateEditorSidebar;
    }
}
