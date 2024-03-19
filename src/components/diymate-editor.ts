import { MobxLitElement } from "@adobe/lit-mobx";
import { diymateCore } from "@core/diymate_core";
import { LocalStorageService } from "@core/services/local_storage_service";
import {
    TextEditorService,
} from "@core/services/text_editor_service";
import { tipTapStyles } from "@lib/tiptap";

import { PropertyValueMap, TemplateResult, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

@customElement("diymate-editor")
export class DIYMateEditor extends MobxLitElement {
    private localStorageService = diymateCore.getService(LocalStorageService);
    private textEditorService = diymateCore.getService(TextEditorService);

    @property({ type: Boolean })
    public disabled: boolean = false;

    get _editorRoot(): HTMLElement {
        return this.renderRoot!.querySelector("#diymate-editor")!;
    }

    static override get styles() {
        const styles =  css`
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
                height: 98vh;
                overflow-y: scroll;
            }

            #diymate-editor-container::-webkit-scrollbar{
                display:none;
            }

            #diymate-editor .tap-editor::-webkit-scrollbar{
                display:none;
            }


            #diymate-editor .tap-editor:focus {
                outline: none;
                border-bottom: 3px solid var(--md-sys-color-primary);
            }

            .disabled {
                opacity: 0.38;
            }
        `;
        return [tipTapStyles,styles];
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
        } else {
            this.textEditorService.enableEditor();
        }
    }

    override connectedCallback(): void {
        super.connectedCallback();
        const savedEditorState = this.localStorageService.getEditorState();
        this.textEditorService.initializeFromLocalStorage(savedEditorState);
    }
    override disconnectedCallback(): void {
        super.disconnectedCallback();
        // this.textEditorService.saveEditorSnapshot();
        this.textEditorService.onDisconnect();
    }

    protected render(): TemplateResult {
        return html`
            <div id="diymate-editor-container">
                <div
                    id="diymate-editor"
                    class=${classMap({ disabled: this.disabled })}
                    spellcheck="false"></div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "diymate-editor": DIYMateEditor;
    }
}
