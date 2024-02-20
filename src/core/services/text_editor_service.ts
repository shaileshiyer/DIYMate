import { $createParagraphNode, $createTextNode, $getRoot, $getSelection, $isTextNode, CreateEditorArgs, LexicalEditor, LexicalNode, ParagraphNode, SerializedEditorState, createEditor } from "lexical";
import { Service } from "./service";
import * as MobileDoc from 'mobiledoc-kit'
import { HistoryState, createEmptyHistoryState, registerHistory } from "@lexical/history";
import { makeObservable } from "mobx";
import { HeadingNode, registerRichText } from "@lexical/rich-text";
import { DIYStructureJSON } from "types";

import { $generateNodesFromDOM } from "@lexical/html";
import { $isListNode, ListNode } from "@lexical/list";
import { registerPlainText } from "@lexical/plain-text";
import { getMobiledocOptions } from "@lib/mobiledoc";
import { LocalStorageService } from "./local_storage_service";

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

}



export class TextEditorService extends Service {
    private editor!: LexicalEditor;
    private historyState!: HistoryState;

    private richtextCallback!: () => void;
    private historyCallback!: () => void;
    private updateListenerCallback!: () => void;
    private mutationListenerCallback!: () => void;


    constructor(private readonly serviceProvider: ServiceProvider) {
        super();
        makeObservable(this, {
        });
    }

    private get localStorageService():LocalStorageService{
        return this.serviceProvider.localStorageService;
    }


    initiliaze(config: LexicalConfig) {
        console.debug('Register root', config.root);
        this.editor = createEditor(config.editorConfig);
        this.historyState = createEmptyHistoryState();

        this.editor.setRootElement(config.root);
        
        // Patch the selection to make sure that we can still use this beyond the shadow DOM.
        patchGetSelection();


        this.richtextCallback = registerRichText(this.editor);

        // this.richtextCallback = registerPlainText(this.editor);
        this.historyCallback = registerHistory(this.editor, this.historyState, 1000);
        // this.editor.update(() => {
        //     const root = $getRoot();
        //     let para = $createParagraphNode();
        //     para.append($createTextNode('Lexical Editor test...'));
        //     root.append(para);
        // });

        if (this.editorStateForInitialization!== null){
            const parsedEditorState = this.editor.parseEditorState(this.editorStateForInitialization);
            this.editor.setEditorState(parsedEditorState);
        }



        this.updateListenerCallback = this.editor.registerUpdateListener(({ editorState }) => {
            editorState.read(() => {
                // console.log($getSelection());

                // console.log(JSON.stringify(this.editor.getEditorState()));
                // const html = $generateHtmlFromNodes(this.editor);
                // output.innerHTML = html;
            });
        });
        this.mutationListenerCallback = this.editor.registerMutationListener(ParagraphNode, (mutatedNodes) => {
            // mutatedNodes is a Map where each key is the NodeKey, and the value is the state of mutation.
            for (let [nodeKey, mutation] of mutatedNodes) {
                console.debug(nodeKey, mutation)
            }
        });
    }

    onDisconnect() {
        this.richtextCallback();
        this.historyCallback();
        this.updateListenerCallback();
        this.mutationListenerCallback();
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
                <ul>
                    ${step.instructions.map((val) => { return `<li>${val}</li>` })}
                </ul>
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

            // root.select();
            root.append(...filteredNodes);
            console.debug('Finished outline');

            // const root = $getRoot();
            // root.clear();
            // let title = $createHeadingNode('h1');
            // let textNode = $createTextNode(generatedOutline?.title);
            // title.append(textNode);
            // root.append(title);
            // let introduction = $createParagraphNode();
            // introduction.append($createTextNode(generatedOutline?.introduction));
            // root.append(introduction);
            // let para = $createParagraphNode();
            // para.append($createTextNode("Materials:"));
            // root.append(para);


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
  