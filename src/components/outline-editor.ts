import { MobxLitElement } from "@adobe/lit-mobx";
import { diymateCore } from "@core/diymate_core";
import { LocalStorageService } from "@core/services/local_storage_service";
import {
    LexicalConfig,
    TextEditorService,
} from "@core/services/text_editor_service";
import { CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { Task } from "@lit/task";
import { LitElement, PropertyValueMap, TemplateResult, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { DIYStructureJSON } from "@core/shared/types";

@customElement("outline-editor")
export class OutlineEditor extends MobxLitElement {
    private localStorageService = diymateCore.getService(LocalStorageService);
    private textEditorService = diymateCore.getService(TextEditorService);

    @property({ type: Object })
    public outline: DIYStructureJSON | null = null;

    @property({type:Boolean})
    public disabled:boolean = false;

    get _editorRoot(): HTMLElement {
        return this.renderRoot!.querySelector("#outline-editor")!;
    }

    static override get styles() {
        return css`
            .outline-container {
                display: flex;
                flex-direction: column;
                justify-content: start;
                max-width: 700px;
                width: 100%;
                margin: 2em auto;
                padding: 2em auto;
            }
            #outline-editor {                
                background-color: var(--md-sys-color-surface-container-highest);
                width: 100%;
                padding: 0 1em;
                min-height: 500px;
                max-height: 600px;
                border-bottom:1px solid var(--md-sys-color-scrim);
                overflow-y: scroll;
            }


            #outline-editor:focus{
                outline:none;
                border-bottom: 3px solid var(--md-sys-color-primary);
            }

            .disabled {
                opacity: 0.38;
            }
        `;
    }

    protected firstUpdated(
        _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
    ): void {
        const editorRoot: HTMLElement = this._editorRoot;

        const config: LexicalConfig = {
            root: editorRoot,
            editorConfig: {
                namespace: "OutlineEditor",
                onError: console.error,
                nodes: [HeadingNode,QuoteNode, LinkNode, ListNode, ListItemNode,CodeNode],
                editable: true,
            },
        };

        this.textEditorService.initiliaze(config);
        if (this.outline !== null) {
            this.textEditorService.insertOutline(this.outline);
        }
    }

    protected updated(
        _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
    ): void {
        if (this.outline !== null) {
            this.textEditorService.insertOutline(this.outline);
        }

        if (this.disabled){
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
        this.textEditorService.saveEditorSnapshot();
        this.textEditorService.onDisconnect();
    }

    protected render(): TemplateResult {
        return html`
            <div class="outline-container">
                <p>Edit your DIY Outline:</p>
                <div
                    id="outline-editor"
                    class=${classMap({disabled:this.disabled})}
                    ?contenteditable=${!this.disabled}
                    spellcheck="false"></div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "outline-editor": OutlineEditor;
    }
}
