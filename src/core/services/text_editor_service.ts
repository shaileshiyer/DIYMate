import { $createParagraphNode, $createTextNode, $getRoot, $getSelection, $isRangeSelection, $isTextNode, CreateEditorArgs, LexicalEditor, LexicalNode, ParagraphNode, SerializedEditorState, TextNode, createEditor } from "lexical";
import { Service } from "./service";
import { HistoryState, createEmptyHistoryState, registerHistory } from "@lexical/history";
import { makeObservable, observable } from "mobx";
import { HeadingNode, registerRichText } from "@lexical/rich-text";
import { $convertToMarkdownString, registerMarkdownShortcuts,TRANSFORMERS } from "@lexical/markdown";
import { DIYStructureJSON } from "@core/shared/types";

import { $generateNodesFromDOM } from "@lexical/html";
import { $isListItemNode, $isListNode, ListItemNode, ListNode } from "@lexical/list";
import { LocalStorageService } from "./local_storage_service";
import { CursorService } from "./cursor_service";

export interface LexicalConfig {
    root: HTMLElement | null;
    editorConfig: CreateEditorArgs;
}

export interface MobileDocConfig {
    element: HTMLElement;
    defaultText: string;
    placeholder: string;
}

interface ServiceProvider {
    localStorageService:LocalStorageService;
    cursorService:CursorService;
}



export class TextEditorService extends Service {
    private editor!: LexicalEditor;
    private historyState!: HistoryState;
    

    constructor(private readonly serviceProvider: ServiceProvider) {
        super();
        makeObservable(this, {
            isEnabled: observable,
            plainText:observable,
        });
    }

    private get localStorageService():LocalStorageService{
        return this.serviceProvider.localStorageService;
    }

    private get cursorService(){
        return this.serviceProvider.cursorService;
    }

    private richtextCallback!: () => void;
    private historyCallback!: () => void;
    private markdownCallback!:() => void;

    private editorListeners: (()=>void)[] = [];


    initiliaze(config: LexicalConfig) {
        this.editor = createEditor(config.editorConfig);
        this.historyState = createEmptyHistoryState();

        this.editor.setRootElement(config.root);
        
        // Patch the selection to make sure that we can still use this beyond the shadow DOM.
        patchGetSelection();

        this.editor.update(()=>{
            const root = $getRoot();
            root.clear();
        })

        /**Register all plugins */
        this.richtextCallback = registerRichText(this.editor);
        this.historyCallback = registerHistory(this.editor, this.historyState, 1000);
        this.markdownCallback = registerMarkdownShortcuts(this.editor,TRANSFORMERS);


        /** Can set content to an empty editor here */

        if (this.editorStateForInitialization!== null){
            const parsedEditorState = this.editor.parseEditorState(this.editorStateForInitialization);
            this.editor.setEditorState(parsedEditorState);
            this.editorStateForInitialization = null;
        }

        
        this.editorListeners = [
            this.editor.registerMutationListener(ParagraphNode, (mutatedNodes) => {
                // mutatedNodes is a Map where each key is the NodeKey, and the value is the state of mutation.
                // for (let [nodeKey, mutation] of mutatedNodes) {
                //     console.debug(nodeKey, mutation)
                // }
            }),
            this.editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {

                    this.plainText = $convertToMarkdownString(TRANSFORMERS);

                    this.cursorService.cursorUpdate();
                    // console.log(JSON.stringify(this.editor.getEditorState()));
                    // const html = $generateHtmlFromNodes(this.editor);
                    // output.innerHTML = html;
                });
            }),
            this.editor.registerNodeTransform(TextNode,(node)=>{
                // console.debug('textnode is transformed',node);
            }),
            this.editor.registerMutationListener(ListNode,(mutatedNodes)=>{
                // console.debug('listNode');
                // for (let [nodeKey, mutation] of mutatedNodes) {
                //     console.debug(nodeKey, mutation)
                // }
            }),
        ];


    }

    onDisconnect() {
        this.richtextCallback();
        this.historyCallback();
        this.markdownCallback();
        // disconnect listeners.
        for (let listener of this.editorListeners){
            listener();
        }

        this.editor.setRootElement(null);
        this.editor.blur();
    }

    lastSnapshot!: SerializedEditorState;
    private readonly snapshotDebounce = 750;
    private lastSetSnapshotTime = 0;
    nextChangeTriggersUndoSnapshot = false;
  
    private shouldIgnoreUpdate = false;
    saveEditorSnapshot(now = Date.now()){
        const snapshot = this.getStateSnapshot();
        if (this.lastSnapshot == null || snapshot !== this.lastSnapshot){
            this.lastSnapshot = snapshot;
            this.lastSetSnapshotTime = now;
            this.localStorageService.setEditorState(snapshot);
        }
    }

    private editorStateForInitialization:SerializedEditorState|null = null;
    initializeFromLocalStorage(editorState:SerializedEditorState|null){
        this.editorStateForInitialization = editorState;
    }

    getStateSnapshot():SerializedEditorState {
        return this.editor.getEditorState().toJSON();
    }


    plainText:string = '';

    getPlainText():string {
        return this.plainText;
    }


    isEnabled = true;
    disableEditor(){
        this.editor.setEditable(false);
        this.isEnabled = false;
    }

    enableEditor(){
        this.editor.setEditable(true);
        this.isEnabled = true;
    }

    get isEmpty():boolean {
        const text = this.plainText;
        return text.trim().length === 0;
    }

    get wordCount():number {
        return this.plainText.split(' ').filter((word)=> word.length > 0).length;
    }



    // Actions
    insertOutline(generatedOutline: DIYStructureJSON) {
        // console.debug(generatedOutline);
        const htmlstring = `
        <h1>${generatedOutline?.title}</h1>
        <p>${generatedOutline?.introduction}</p>
        <p>Materials:</p>
        <ul>
            ${generatedOutline?.materials.map((val) => { return `<li>${val}</li>` })}
        </ul>
        <p>Tools:</p>
        <ul>
            ${generatedOutline?.tools.map((val) => { return `<li>${val}</li>` })}
        </ul>
        <p>Competences:</p>
        <ul>
        ${generatedOutline?.competences.map((val) => { return `<li>${val}</li>` })}
        </ul>
        <p>Safety Instructions </p>
        <ol>
            ${generatedOutline?.safety_instruction.map((val) => { return `<li>${val}</li>` })}
        </ol>
        ${generatedOutline?.steps.map((step) => {
            return `
                <h2>${step.title}</h2>
                <p>Materials used in this step:</p>
                <ul>
                    ${step.materials_in_step.map((val) => { return `<li>${val}</li>` })}
                </ul>
                <p>Tools used in this step:</p>
                <ul>
                    ${step.tools_in_step.map((val) => { return `<li>${val}</li>` })}
                </ul>
                <p>Instructions:</p>
                <ol>
                    ${step.instructions.map((val) => { return `<li>${val}</li>` })}
                </ol>
            `
        })}
        <h2>Conclusion</h2>
        <p>${generatedOutline?.conclusion.text}</p>`;

        const dom = new DOMParser().parseFromString(htmlstring, 'text/html');
        this.editor.update(() => {
            const nodes: LexicalNode[] = $generateNodesFromDOM(this.editor, dom);
            const root = $getRoot();
            root.clear();
            const filteredNodes = nodes.filter((node) => {
                if (!$isTextNode(node)) {
                    if ($isListNode(node)) {
                        const list = node as ListNode;
                        list.getChildren().filter((child) => {
                            if (child.getTextContent() === ',') {
                                child.remove();
                            }
                        })
                    }
                    return true;
                }
            });

            root.append(...filteredNodes);
            console.debug('Finished outline');

        });
    }


}


/**
 * We need to hack the window.getSelection method to use the shadow DOM,
 * since the mobiledoc editor internals need to get the selection to detect
 * cursor changes. First, we walk down into the shadow DOM to find the
 * actual focused element. Then, we get the root node of the active element
 * (either the shadow root or the document itself) and call that root's
 * getSelection method.
 */
export function patchGetSelection() {
    const oldGetSelection = window.getSelection.bind(window);
    window.getSelection = (useOld: boolean = false) => {
      const activeElement = findActiveElementWithinShadow();
      const shadowRootOrDocument: ShadowRoot | Document = activeElement
        ? (activeElement.getRootNode() as ShadowRoot | Document)
        : document;
      const selection = (shadowRootOrDocument as any).getSelection();
  
      if (!selection || useOld) return oldGetSelection();
      return selection;
    };
  }
  
  /**
   * Recursively walks down the DOM tree to find the active element within any
   * shadow DOM that it might be contained in.
   */
function findActiveElementWithinShadow(
    element: Element | null = document.activeElement
  ): Element | null {
    if (element?.shadowRoot) {
      return findActiveElementWithinShadow(element.shadowRoot.activeElement);
    }
    return element;
  }
  