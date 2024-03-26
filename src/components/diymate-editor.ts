import { MobxLitElement } from "@adobe/lit-mobx";
import { diymateCore } from "@core/diymate_core";
import { DocumentStoreService } from "@core/services/document_store_service";
import { LocalStorageService } from "@core/services/local_storage_service";
import { TextEditorService } from "@core/services/text_editor_service";
import { tipTapStyles } from "@lib/tiptap";

import { PropertyValueMap, TemplateResult, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import "@material/web/iconbutton/outlined-icon-button";
import "@material/web/icon/icon";
import "@material/web/select/outlined-select";
import "@material/web/select/select-option";
import { CursorService } from "@core/services/cursor_service";
import "./simple_tooltip";
import { tooltip } from "./simple_tooltip";

@customElement("diymate-editor")
export class DIYMateEditor extends MobxLitElement {
    private localStorageService = diymateCore.getService(LocalStorageService);
    private textEditorService = diymateCore.getService(TextEditorService);
    private documentStoreService = diymateCore.getService(DocumentStoreService);
    private cursorService = diymateCore.getService(CursorService);
    @property({ type: Boolean })
    public disabled: boolean = false;

    get _editorRoot(): HTMLElement {
        return this.renderRoot!.querySelector("#diymate-editor")!;
    }

    static override get styles() {
        const styles = css`
            #diymate-editor-container {
                display: flex;
                flex-direction: column;
                justify-content: start;
                width: 100%;
                /* margin: 2em; */
                /* padding: 2em auto; */
            }
            #diymate-editor .tap-editor {
                background-color: var(--md-sys-color-surface-container-highest);
                padding: 0 2em;
                border-bottom: 1px solid var(--md-sys-color-scrim);
                height: 92vh;
                overflow-y: scroll;
            }

            #diymate-editor-container::-webkit-scrollbar {
                display: none;
            }

            #diymate-editor .tap-editor::-webkit-scrollbar {
                display: none;
            }

            #diymate-editor .tap-editor:focus {
                outline: none;
                border-bottom: 3px solid var(--md-sys-color-primary);
            }

            #diymate-editor .tap-editor.disabled {
                /* opacity: 0.38; */
                cursor: not-allowed;
            }

            .editor-toolbar {
                --md-outlined-icon-button-container-shape: 0px;
                --md-icon-button-icon-size: 24px;
                --md-outlined-icon-button-outline-width: 0px;
                --md-outlined-icon-button-container-width: 30px;
                --md-outlined-icon-button-container-height: 30px;

                --md-outlined-field-bottom-space:3px;
                --md-outlined-field-top-space:3px;
                padding: 2px;
                display: flex;
                flex-direction: row;
            }

            .divider {
                width: 1px;
                background-color: var(--md-sys-color-outline-variant);
                margin: 0 4px;
            }

            .editor-bottom-bar {
                display: flex;
                flex-direction: row-reverse;
                font-size:14px;
            }
        `;
        return [tipTapStyles, styles];
    }

    protected firstUpdated(
        _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
    ): void {
        const editorRoot: HTMLElement = this._editorRoot;

        // const config = getLexicalConfig(editorRoot,"DIYMateEditor");

        this.textEditorService.initiliaze(editorRoot);
    }

    protected updated(
        _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
    ): void {
        if (this.disabled) {
            this.textEditorService.disableEditor();
            // this.textEditorService.getEditor.options.element.classList.add('disabled');
        } else {
            this.textEditorService.enableEditor();
            // this.textEditorService.getEditor.options.element.classList.remove('disabled');
        }
    }

    override connectedCallback(): void {
        super.connectedCallback();
        const savedEditorState = this.localStorageService.getEditorState();
        this.textEditorService.initializeFromLocalStorage(savedEditorState);
        this.documentStoreService.startAutoSave();
    }
    override disconnectedCallback(): void {
        super.disconnectedCallback();
        // this.textEditorService.saveEditorSnapshot();
        this.textEditorService.onDisconnect();
        this.documentStoreService.endAutoSave();
    }

    renderToolbar(): TemplateResult {


        return html`
            <div class="editor-toolbar">
                <md-outlined-icon-button
                    ${tooltip("undo")}
                    @click=${() =>
                        this.textEditorService.getEditor
                            .chain()
                            .focus()
                            .undo()
                            .run()}>
                    <md-icon>undo</md-icon>
                </md-outlined-icon-button>
                <md-outlined-icon-button
                    ${tooltip("redo")}
                    @click=${() =>
                        this.textEditorService.getEditor
                            .chain()
                            .focus()
                            .redo()
                            .run()}>
                    <md-icon>redo</md-icon>
                </md-outlined-icon-button>
                <div class="divider"></div>
                <!-- <md-outlined-select selected-index=0>
                    <md-select-option value="paragraph">Normal</md-select-option>
                    <md-select-option value="heading1">Heading 1</md-select-option>
                    <md-select-option value="heading2">Heading 2</md-select-option>
                    <md-select-option value="heading3">Heading 3</md-select-option>
                </md-outlined-select> -->
                <md-outlined-icon-button
                    ${tooltip("Clear formatting")}
                    @click=${() =>
                        this.textEditorService.getEditor
                            .chain()
                            .focus()
                            .clearNodes()
                            .run()}>
                    <md-icon>format_paragraph</md-icon>
                </md-outlined-icon-button>
                <md-outlined-icon-button
                    ${tooltip("toggle Title format")}
                    @click=${() =>
                        this.textEditorService.getEditor
                            .chain()
                            .focus()
                            .toggleHeading({ level: 1 })
                            .run()}>
                    <md-icon>format_h1</md-icon>
                </md-outlined-icon-button>
                <md-outlined-icon-button
                    ${tooltip("toggle Section title format")}
                    @click=${() =>
                        this.textEditorService.getEditor
                            .chain()
                            .focus()
                            .toggleHeading({ level: 2 })
                            .run()}>
                    <md-icon>format_h2</md-icon>
                </md-outlined-icon-button>
                <md-outlined-icon-button
                    ${tooltip("toggle Step title format")}
                    @click=${() =>
                        this.textEditorService.getEditor
                            .chain()
                            .focus()
                            .toggleHeading({ level: 3 })
                            .run()}>
                    <md-icon>format_h3</md-icon>
                </md-outlined-icon-button>
                <div class="divider"></div>
                <md-outlined-icon-button
                    ${tooltip("toggle bullet list")}
                    @click=${() =>
                        this.textEditorService.getEditor
                            .chain()
                            .focus()
                            .toggleBulletList()
                            .run()}>
                    <md-icon>format_list_bulleted</md-icon>
                </md-outlined-icon-button>
                <md-outlined-icon-button
                    ${tooltip("toggle numbered list")}
                    @click=${() =>
                        this.textEditorService.getEditor
                            .chain()
                            .focus()
                            .toggleOrderedList()
                            .run()}>
                    <md-icon>format_list_numbered</md-icon>
                </md-outlined-icon-button>
                <div class="divider"></div>
            </div>
        `;
    }

    renderBottomBar(): TemplateResult {

        const wordcount = this.cursorService.isCursorCollapsed ? this.textEditorService.wordCount : this.textEditorService.selectedWordCount;
        return html`
            <div class="editor-bottom-bar">
                <div>
                    Word Count:
                    ${wordcount}
                </div>
            </div>
        `;
    }

    override render(): TemplateResult {
        return html`
            <div id="diymate-editor-container">
                ${this.renderToolbar()}
                <div
                    id="diymate-editor"
                    class=${classMap({ disabled: this.disabled })}
                    spellcheck="false"></div>
                ${this.renderBottomBar()}
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "diymate-editor": DIYMateEditor;
    }
}
