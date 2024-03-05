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
import { OperationsService } from "@core/services/operations_service";
import { runInAction } from "mobx";
import { classMap } from "lit/directives/class-map.js";
import { DocumentStoreService } from "@core/services/document_store_service";
import { InitializationService } from "@core/services/initialization_service";

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
    private activeTab: number = 0;

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
        return html`<div id="debug-wrappper">
            <h1>Sidebar Wrapper</h1>

            <!-- Operation Site and Document Site -->
            <p>OperationSite: ${this.operationsService.getOperationsSite()}</p>
            <p>
                OperationSite:
                ${this.operationsService.getLocationInDocumentStructure()}
            </p>
            <p>Selected Text: ${this.cursorService.selectedText}</p>
            <!-- <p>Pre Text: ${this.cursorService.preText}</p>
        <p>Post Text: ${this.cursorService.postText}</p> -->
            <p>
                Current Node: ${JSON.stringify(this.cursorService.currentNode)}
            </p>
            <p>
                serializedRange:
                ${JSON.stringify(this.cursorService.serializedRange)}
            </p>
            <p>
                cursorOffset:${JSON.stringify(this.cursorService.cursorOffset)}
            </p>

            <p>currentSentence: ${this.sentencesService.currentSentence}</p>
            <p>
                cursorSpan: ${JSON.stringify(this.sentencesService.cursorSpan)}
            </p>
            <p>
                currentSentenceIndex:
                ${this.sentencesService.currentSentenceIndex}
            </p>
            <p>
                currentSentenceSerializedRange:
                ${JSON.stringify(
                    this.sentencesService.currentSentenceSerializedRange
                )}
            </p>
            <p>
                currentSentenceRange:
                ${this.sentencesService.getCurrentSentenceRange()}
            </p>
            <p>
                nextSentenceOffset: ${this.sentencesService.nextSentenceOffset}
            </p>

            <!-- Cursor Checks -->
            <p>
                CursorOffsetRange:
                ${JSON.stringify(this.cursorService.getOffsetRange())}
            </p>
            <!-- <p>isCursorBetweenSentences: ${this.sentencesService
                .isCursorBetweenSentences} </p>
        <p>isCursorinMiddleOfSentence: ${this.sentencesService
                .isCursorWithinSentence} </p>
        <p>isCursorAtParagraphStart: ${this.cursorService
                .isCursorAtStartOfNode} </p>
        <p>isCursorAtParagraphEnd: ${this.cursorService
                .isCursorAtEndOfNode} </p>
        <p>isCursorCollapsed: ${this.cursorService.isCursorCollapsed}</p>
        <p>isCursorSelection: ${this.cursorService.isCursorSelection}</p>
        <p>isCursorinSameNode: ${this.cursorService.isCursorInSingleNode}</p>
        <p>isCursorinMiddle: ${this.cursorService.isCursorinMiddle}</p>
        <p>isCursorAtStartOfDocument: ${this.cursorService
                .isCursorAtStartOfText}</p>
        <p>isCursorAtEndOfDocument: ${this.cursorService
                .isCursorAtEndOfText}</p>
        <p>isCursorAtTitle: ${this.cursorService.isCursorAtTitle}</p>
        <p>isCursorInIntroduction: ${this.cursorService
                .isCursorInIntroduction}</p>
        <p>isCursorInStep: ${this.cursorService.isCursorInStep}</p>
        <p>isCursorInConclusion: ${this.cursorService
                .isCursorInConclusion}</p> -->

            <p>Plain Text:</p>
            <md-filled-text-field
                style="width:100%;"
                type="textarea"
                name="plain-text"
                placeholder="PlainText"
                .value=${this.textEditorService.plainText}
                rows="20"
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
        onClick: (e: Event) => void | Promise<void>,
        disabled = false
    ) {
        const buttonClasses = classMap({
            "link-button": true,
            disabled: disabled,
        });
        return html`<div
            class=${buttonClasses}
            @click=${onClick}>
            ${text}
        </div>`;
    }

    renderMainMenuButton(): TemplateResult {
        const onClick = () => {
            this.initializationService.reset();
        };
        return this.renderLinkButton("Main Menu", onClick);
    }

    renderSaveButton(): TemplateResult {
        if (this.documentStoreService.isSaving) {
            return this.renderLinkButton("saving...", () => {}, true);
        }

        const onClick = () => {
            this.documentStoreService.saveDocument();
        };
        return this.renderLinkButton("Save DIY", onClick);
    }

    private getTopAndBottomContents() {
        let top: TemplateResult = html``;
        let bottom: TemplateResult = html``;

        if (this.operationsService.currentOperation !== null) {
            top = html`<diymate-operation></diymate-operation>`;
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
            top = html`<diymate-operations></diymate-operations>`;

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
