
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
  INDENT_CONTENT_COMMAND,
  BaseSelection
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

import { LitElement, PropertyValueMap, TemplateResult, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { ref, createRef, Ref } from "lit/directives/ref.js";
import { patchGetSelection } from "@core/services/text_editor_service";


@customElement('base-editor')
export class BaseLexicalEditor extends LitElement {

  private config = {
    namespace: "MyEditor",
    onError: console.error,
    nodes: [LinkNode, QuoteNode, ListNode, ListItemNode]
  };

  private historyState = createEmptyHistoryState();

  private editor = createEditor(this.config);

  private _el: HTMLElement | null = null;
  private _output: HTMLElement | null = null;


  editorRef: Ref<HTMLDivElement> = createRef();

  @property()
  private htmlOutput = "";

  static override get styles() {
    return css`
      #editor {
        /* width: 80%; */
        height: 300px;
        border: 1px solid #ccc;
      }

      blockquote {
        margin: 0;
        margin-left: 20px;
        font-size: 15px;
        color: rgb(101, 103, 107);
        border-left-color: rgb(206, 208, 212);
        border-left-width: 4px;
        border-left-style: solid;
        padding-left: 16px;
      }
    `;
  }

  constructor() {
    super();
  }


  private setupEditorListeners() {
    patchGetSelection();
    registerRichText(this.editor);
    registerHistory(this.editor, this.historyState, 1000);
    this.editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        console.log($getSelection());

        console.log(JSON.stringify(this.editor.getEditorState()));
        // const html = $generateHtmlFromNodes(this.editor);
        // this.htmlOutput = html;
      });
    });

    this.editor.update(() => {
      const root = $getRoot();
      root.append($createParagraphNode().append($createTextNode("Hello this is test...")));
    })

  }

  protected setupToolbar() {
    function getSelectedNode(selection: any) {
      const anchor = selection.anchor;
      const focus = selection.focus;
      const anchorNode = selection.anchor.getNode();
      const focusNode = selection.focus.getNode();
      if (anchorNode === focusNode) {
        return anchorNode;
      }
      const isBackward = selection.isBackward();
      if (isBackward) {
        return $isAtNodeEnd(focus) ? anchorNode : focusNode;
      } else {
        return $isAtNodeEnd(anchor) ? focusNode : anchorNode;
      }
    }

    this.editor.registerCommand(
      TOGGLE_LINK_COMMAND,
      (payload) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }
        const node = getSelectedNode(selection);
        const parent = node.getParent();
        if ($isLinkNode(parent) || $isLinkNode(node)) {
          toggleLink(null);
        } else {
          toggleLink(node.getTextContent());
        }
        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    this.shadowRoot!.getElementById("font-normal")!.addEventListener("click", () => {
      this.editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, {
            "font-size": null
          });
        }
      });
    });
    this.shadowRoot!.getElementById("font-small")!.addEventListener("click", () => {
      this.editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, {
            "font-size": "10px"
          });
        }
      });
    });
    this.shadowRoot!.getElementById("font-large")!.addEventListener("click", () => {
      this.editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, {
            "font-size": "20px"
          });
        }
      });
    });

    let canUndo = false;
    let canRedo = false;

    this.editor.registerCommand(
      CAN_UNDO_COMMAND,
      (payload) => {
        canUndo = payload;
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
    this.editor.registerCommand(
      CAN_REDO_COMMAND,
      (payload) => {
        canRedo = payload;
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
    // this.editor.registerCommand(
    //   UNDO_COMMAND,
    //   () => {
    //     undo(this.editor, historyState);
    //     return true;
    //   },
    //   COMMAND_PRIORITY_EDITOR
    // );
    // this.editor.registerCommand(
    //   REDO_COMMAND,
    //   () => {
    //     redo(this.editor, historyState);
    //     return true;
    //   },
    //   COMMAND_PRIORITY_EDITOR
    // );
    this.shadowRoot!.getElementById("undo")!.addEventListener("click", () => {
      if (canUndo) {
        this.editor.dispatchCommand(UNDO_COMMAND, null);
      }
    });
    this.shadowRoot!.getElementById("redo")!.addEventListener("click", () => {
      if (canRedo) {
        this.editor.dispatchCommand(REDO_COMMAND, null);
      }
    });

    this.shadowRoot!.getElementById("bold")!.addEventListener("click", () => {
      this.editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
    });
    this.shadowRoot!.getElementById("link")!.addEventListener("click", () => {
      this.editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    });
    this.shadowRoot!.getElementById("italic")!.addEventListener("click", () => {
      this.editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
    });
    this.shadowRoot!.getElementById("underline")!.addEventListener("click", () => {
      this.editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
    });
    this.shadowRoot!.getElementById("strikethrough")!.addEventListener("click", () => {
      this.editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
    });
    this.shadowRoot!.getElementById("quote")!.addEventListener("click", () => {
      this.editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createQuoteNode());
        }
      });
    });
    this.shadowRoot!.getElementById("paragraph")!.addEventListener("click", () => {
      this.editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createParagraphNode());
        }
      });
    });
    this.shadowRoot!.getElementById("text-left")!.addEventListener("click", () => {
      this.editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left");
    });
    this.shadowRoot!.getElementById("text-center")!.addEventListener("click", () => {
      this.editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center");
    });
    this.shadowRoot!.getElementById("text-right")!.addEventListener("click", () => {
      this.editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right");
    });
    this.shadowRoot!.getElementById("text-justify")!.addEventListener("click", () => {
      this.editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify");
    });

    this.shadowRoot!.getElementById("list-ul")!.addEventListener("click", () => {
      // this.editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
      insertList(this.editor, "bullet");
    });
    this.shadowRoot!.getElementById("list-ol")!.addEventListener("click", () => {
      // this.editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
      insertList(this.editor, "number");
    });
    this.shadowRoot!.getElementById("list-clear")!.addEventListener("click", () => {
      // this.editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
      removeList(this.editor);
    });

    this.shadowRoot!.getElementById("indent")!.addEventListener("click", () => {
      this.editor.dispatchCommand(INDENT_CONTENT_COMMAND, null);
    });
    this.shadowRoot!.getElementById("outdent")!.addEventListener("click", () => {
      this.editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, null);
    });

  }

  
  protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    this._el = this.shadowRoot!.querySelector('#editor')!;
    this._output = this.renderRoot!.querySelector("#output")!;

    console.debug(this._el);
    this.editor.setRootElement(this._el);
    this.setupEditorListeners();
  }

  connectedCallback(): void {
    super.connectedCallback();

  }


  protected renderToolbar() {
    return html`<div
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
  </div>`;
  }

  protected render(): TemplateResult {
    return html`
    <div class="card">
        ${this.renderToolbar()}
        <div class="card-body">
          <div id="editor" contenteditable slot="editable-div"></div>
        </div>
        <div id="output" .innerText=${live(JSON.stringify(this.editor.getEditorState().toJSON()))}></div>
      </div>
        `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "base-editor": BaseLexicalEditor;
  }
}