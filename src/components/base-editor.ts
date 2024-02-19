
import {
    createEditor,
    FORMAT_TEXT_COMMAND,
    FORMAT_ELEMENT_COMMAND,
    CAN_REDO_COMMAND,
    CAN_UNDO_COMMAND,
    REDO_COMMAND,
    UNDO_COMMAND,
    COMMAND_PRIORITY_LOW,
    COMMAND_PRIORITY_EDITOR,
    $getRoot,
    $getSelection,
    $createParagraphNode,
    $createTextNode,
    $isRangeSelection,
    OUTDENT_CONTENT_COMMAND,
    INDENT_CONTENT_COMMAND
} from "lexical";
import { $wrapNodes, $isAtNodeEnd, $patchStyleText } from "@lexical/selection";
import { $generateHtmlFromNodes } from "@lexical/html";
// import { registerPlainText } from "@lexical/plain-text";
import {
    registerRichText,
    QuoteNode,
    $createQuoteNode
} from "@lexical/rich-text";
import {
    LinkNode,
    toggleLink,
    TOGGLE_LINK_COMMAND,
    $isLinkNode
} from "@lexical/link";
import {
    $isListNode,
    INSERT_CHECK_LIST_COMMAND,
    INSERT_ORDERED_LIST_COMMAND,
    INSERT_UNORDERED_LIST_COMMAND,
    ListNode,
    ListItemNode,
    insertList,
    removeList,
    REMOVE_LIST_COMMAND
} from "@lexical/list";
import {
    createEmptyHistoryState,
    registerHistory,
} from "@lexical/history";

import { LitElement, PropertyValueMap, TemplateResult, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement('base-editor')
export class BaseLexicalEditor extends LitElement {

    private config = {
        namespace: "MyEditor",
        onError: console.error,
        nodes: [LinkNode, QuoteNode, ListNode, ListItemNode]
    };

    private historyState = createEmptyHistoryState();

    private editor = createEditor(this.config);

    private _el:HTMLElement|null = null;
    private _output:HTMLElement|null = null;
    constructor() {
        super();
    }

    protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
      this._el = this.renderRoot?.querySelector("#editor");
      this._output = this.renderRoot?.querySelector("#output");
      if (!!this._el && !!this._output){
          this.editor.setRootElement(this._el);
          registerRichText(this.editor);
          registerHistory(this.editor, this.historyState, 1000);
          this.editor.registerUpdateListener(({ editorState }) => {
              editorState.read(() => {
                  console.log($getSelection());
      
                  console.log(JSON.stringify(this.editor.getEditorState()));
                  // const html = $generateHtmlFromNodes(this.editor);
                  // output.innerHTML = html;
              });
          });
      }
    }
  
    connectedCallback(): void {
        super.connectedCallback();

    }

    protected render(): TemplateResult {
        return html`<div class="card">
        <div
          class="card-header btn-toolbar"
          role="toolbar"
          aria-label="Toolbar with button groups"
        >
          <div class="btn-group">
            <button type="button" id="undo" class="btn">
              <i class="fas fa-undo"></i>
            </button>
            <button type="button" id="redo" class="btn">
              <i class="fas fa-redo"></i>
            </button>
          </div>
          <div class="btn-group">
            <button type="button" id="font-normal" class="btn">
              <i class="fas fa-font"></i>
            </button>
            <button type="button" id="font-small" class="btn">s</button>
            <button type="button" id="font-large" class="btn">l</button>
          </div>
          <div class="btn-group">
            <button type="button" id="bold" class="btn">
              <i class="fas fa-bold"></i>
            </button>
            <button type="button" id="italic" class="btn">
              <i class="fas fa-italic"></i>
            </button>
            <button type="button" id="underline" class="btn">
              <i class="fas fa-underline"></i>
            </button>
            <button type="button" id="strikethrough" class="btn">
              <i class="fas fa-strikethrough"></i>
            </button>
          </div>
          <div class="btn-group">
            <button type="button" id="paragraph" class="btn">
              <i class="fas fa-paragraph"></i>
            </button>
            <button type="button" id="quote" class="btn">
              <i class="fas fa-quote-right"></i>
            </button>
            <button type="button" id="link" class="btn">
              <i class="fas fa-link"></i>
            </button>
          </div>
          <div class="btn-group">
            <button type="button" id="text-left" class="btn">
              <i class="fas fa-align-left"></i>
            </button>
            <button type="button" id="text-right" class="btn">
              <i class="fas fa-align-right"></i>
            </button>
            <button type="button" id="text-center" class="btn">
              <i class="fas fa-align-center"></i>
            </button>
            <button type="button" id="text-justify" class="btn">
              <i class="fas fa-align-justify"></i>
            </button>
          </div>
          <div class="btn-group">
            <button type="button" id="list-ul" class="btn">
              <i class="fas fa-list-ul"></i>
            </button>
            <button type="button" id="list-ol" class="btn">
              <i class="fas fa-list-ol"></i>
            </button>
            <button type="button" id="list-clear" class="btn">
              <i class="fas fa-eraser"></i>
            </button>
          </div>
          <div class="btn-group">
            <button type="button" id="indent" class="btn">
              <i class="fas fa-indent"></i>
            </button>
            <button type="button" id="outdent" class="btn">
              <i class="fas fa-outdent"></i>
            </button>
          </div>
          <div style="display: flex;">
            <span id="color-fg">FG</span>
            <span id="color-bg">BG</span>
          </div>
        </div>
        <div class="card-body">
          <div id="editor" class="form-control" contenteditable>
            hogehoge
          </div>
        </div>
      </div>
      <div id="output"></div>
        `
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "base-editor": BaseLexicalEditor;
    }
}