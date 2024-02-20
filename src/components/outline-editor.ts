import { diymateCore } from "@core/diymate_core";
import { LocalStorageService } from "@core/services/local_storage_service";
import { LexicalConfig, TextEditorService } from "@core/services/text_editor_service";
import { LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { HeadingNode } from "@lexical/rich-text";
import { LitElement, TemplateResult, html } from "lit";

class OutlineEditor extends LitElement {
    
    private localStorageService = diymateCore.getService(LocalStorageService);
    private textEditorService = diymateCore.getService(TextEditorService);


    get _editorRoot():HTMLElement {
        return this.renderRoot!.querySelector('#outline-editor')!;
    }



    protected override firstUpdated(): void {
        // const editorRoot: HTMLElement = this.shadowRoot?.getElementById('outline-editor')!;
        const editorRoot: HTMLElement = this._editorRoot;

        console.debug('Register root', editorRoot);
        
        const config: LexicalConfig = {
            root: editorRoot,
            editorConfig: {
                namespace: "OutlineEditor",
                onError: console.error,
                nodes: [HeadingNode,LinkNode, ListNode, ListItemNode],
                editable: true,
            }
        }
        this.textEditorService.initiliaze(config);

    }

    override connectedCallback(): void {
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
        <p>Edit your DIY Outline</p>
        <div class="outline-container">
            <div id="outline-editor" contenteditable>
            </div>
        </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'outline-editor': OutlineEditor;
    }
}