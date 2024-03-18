import { action, computed, makeObservable, observable } from "mobx";
import { Editor, JSONContent,EditorEvents, NodePos } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import {Transaction} from "@tiptap/pm/state";
import { Node } from "@tiptap/pm/model";

import { Service } from "./service";

import { DIYStructureJSON } from "@core/shared/types";

import { LocalStorageService } from "./local_storage_service";
import { CursorService } from "./cursor_service";
import { SentencesService } from "./sentences_service";
import { HighlightMark } from "@lib/tiptap";

interface ServiceProvider {
    localStorageService: LocalStorageService;
    cursorService: CursorService;
    sentencesService: SentencesService;
}

interface Paragraphs {
    offset: number;
    text: string;
}

type editorEventProp = {editor:Editor,transaction:Transaction};

export class TextEditorService extends Service {
    private editor!: Editor;

    constructor(private readonly serviceProvider: ServiceProvider) {
        super();
        makeObservable(this, {
            isEnabled: observable,
            plainText: observable,
            onTextUpdate: action,
        });
    }

    private get localStorageService(): LocalStorageService {
        return this.serviceProvider.localStorageService;
    }

    private get cursorService() {
        return this.serviceProvider.cursorService;
    }
    private get sentencesService() {
        return this.serviceProvider.sentencesService;
    }

    get getEditor() {
        return this.editor;
    }

    private editorListeners: (() => void)[] = [];


    private updateHandler:((props:EditorEvents['update'])=>void)| null = null;
    private selectionUpdateHandler:((props:EditorEvents['selectionUpdate'])=>void)| null = null;

    initiliaze(element: Element | undefined) {
        /**
         * Setup the editor here.
         */

        this.editor = new Editor({
            element: element,
            extensions: [
                StarterKit.configure({
                    heading: {
                        levels: [1, 2, 3],
                    },
                    bold: {
                        HTMLAttributes: {
                            class: "marked",
                        },
                    },
                    listItem:{
                      
                    },
                }),
                HighlightMark.configure({
                    class: "marked",
                }),
            ],
            content: "<p> Test Content...</p>",
            injectCSS: false,
            editorProps: {
                attributes: {
                    class: "tap-editor",
                },
            },
        });
        /** Can set content to an empty editor here */

        if (this.editorStateForInitialization !== null) {
            /**
             * Set parsed editor content.
             */
            this.editor.commands.setContent(this.editorStateForInitialization);
            this.editorStateForInitialization = null;
        }

        /**Setup listeners here. */
        this.editorListeners = [
        ];

        this.updateHandler = ({editor,transaction}): void=>{
          this.onTextUpdate(editor,transaction);
        };

        this.selectionUpdateHandler = ({editor,transaction})=>{
          console.debug('selection');
          // console.debug(editor.getHTML());
          this.cursorService.cursorUpdate(editor,transaction);
          this.sentencesService.highlightCurrentSentence(editor,transaction);
        };

        this.editor.on('update',this.updateHandler);
        this.editor.on('selectionUpdate',this.selectionUpdateHandler);
 
    }



    onTextUpdate(editor:Editor,transaction: Transaction) {
      console.debug("onRead");
      this.updatePlainText(editor,transaction);
    }

    onDisconnect() {
        if (this.updateHandler!== null && this.selectionUpdateHandler){
          this.editor.off('update',this.updateHandler);
          this.editor.off('selectionUpdate',this.selectionUpdateHandler);
        }
        
        this.editor.destroy();
    }

    lastSnapshot!: JSONContent;
    private readonly snapshotDebounce = 750;
    private lastSetSnapshotTime = 0;
    nextChangeTriggersUndoSnapshot = false;

    private shouldIgnoreUpdate = false;
    saveEditorSnapshot(now = Date.now()) {
        const snapshot = this.getStateSnapshot();
        if (this.lastSnapshot == null || snapshot !== this.lastSnapshot) {
            this.lastSnapshot = snapshot;
            this.lastSetSnapshotTime = now;
            this.localStorageService.setEditorState(snapshot);
        }
    }

    private editorStateForInitialization: JSONContent | null = null;
    initializeFromLocalStorage(editorState: JSONContent | null) {
        this.editorStateForInitialization = editorState;
    }

    getStateSnapshot(): JSONContent {
        return this.editor.getJSON();
    }

    setStateFromSnapshot(editorState: JSONContent) {
        // const parsedEditorState = this.editor.parseEditorState(editorState);
        this.editor.commands.setContent(editorState);
    }

    private readonly updateCallbacks = new Set<() => void>();
    onUpdate(updateCallback: () => void) {
        this.updateCallbacks.add(updateCallback);
        return () => void this.updateCallbacks.delete(updateCallback);
    }
    triggerUpdateCallbacks() {
        for (const callback of this.updateCallbacks.values()) {
            callback();
        }
    }

    plainText: string = "";
    paragraphs: Paragraphs[] = [];
    private updatePlainText(editor:Editor,tr:Transaction) {
      // Adding the condition where i check for changes actually makes the highlight selection lag.
      // if(this.plainText === editor.getText({blockSeparator:'\n\n'})) return;
      this.plainText = editor.getText({blockSeparator:'\n\n'});
      
      this.paragraphs = [];

      const headingNodes = editor.$doc.querySelectorAll('heading');
      const paragraphNodes = editor.$doc.querySelectorAll('paragraph');
      const ulNodes = editor.$doc.querySelectorAll('bulletList').flatMap((listcontainer)=> listcontainer);
      const olNodes = editor.$doc.querySelectorAll('orderedList').flatMap((listcontainer)=> listcontainer);
      

      const allLists = [...ulNodes,...olNodes];
      const allListItems:NodePos[] = [];
      // console.debug(allListItems.map((val)=>{ return{pos:val.pos,val}}));
      allLists.forEach((list)=>{
        list.node.descendants((item,pos,parent)=>{
          if(item.isText){
            // console.debug(item.toString(),list.pos+pos+1,parent?.nodeSize)
            allListItems.push(editor.$pos(list.pos+pos+1));
          }
        });
      });


      const nodesList = [
        ...headingNodes,
        ...paragraphNodes,
        ...allListItems,
      ];


      nodesList.sort((a,b)=>  a.pos - b.pos);
      this.paragraphs = nodesList.map((node)=>{return {offset:node.pos,text:node.textContent}});

      this.sentencesService.processText();
    }

    getPlainText(): string {
        return this.editor.getText();
    }

    getParagraphs(): Paragraphs[] {
        return this.paragraphs;
    }

    isEnabled = true;
    disableEditor() {
        this.editor.setEditable(false)
        this.isEnabled = false;
    }

    enableEditor() {
        this.editor.setEditable(true);
        this.isEnabled = true;
        this.editor
          .chain()
          .focus('start')
          .command(({editor,tr})=>{
            this.cursorService.cursorUpdate(editor,tr);
            return true;
          })
          .run();

    }

    get isEmpty(): boolean {
        // const text = this.plainText;
        return this.editor.isEmpty;
    }

    get wordCount(): number {
        return this.plainText.split(" ").filter((word) => word.length > 0)
            .length;
    }

    getStartOfDocument():NodePos|null {
        return this.editor.$doc.firstChild;
    }

    getEndOfDocument():NodePos|null {
        return this.editor.$doc.lastChild;
    }

    // Actions
    insertOutline(generatedOutline: DIYStructureJSON) {
        // console.debug(generatedOutline);
        const htmlstring = `
        <h1>${generatedOutline?.title}</h1>
        <p>${generatedOutline?.introduction}</p>
        <p>Materials:</p>
        <ul>
            ${generatedOutline?.materials.map((val) => {
                return `<li>${val}</li>`;
            }).join("")}
        </ul>
        <p>Tools:</p>
        <ul>
            ${generatedOutline?.tools.map((val) => {
                return `<li>${val}</li>`;
            }).join("")}
        </ul>
        <p>Competences:</p>
        <ul>
        ${generatedOutline?.competences.map((val) => {
            return `<li>${val}</li>`;
        }).join("")}
        </ul>
        <p>Safety Instructions </p>
        <ol>
            ${generatedOutline?.safety_instruction.map((val) => {
                return `<li>${val}</li>`;
            }).join("")}
        </ol>
        ${generatedOutline?.steps.map((step) => {
            return `
                <h2>${step.title}</h2>
                <p>Materials used in this step:</p>
                <ul>
                    ${step.materials_in_step.map((val) => {
                        return `<li>${val}</li>`;
                    }).join("")}
                </ul>
                <p>Tools used in this step:</p>
                <ul>
                    ${step.tools_in_step.map((val) => {
                        return `<li>${val}</li>`;
                    }).join("")}
                </ul>
                <p>Instructions:</p>
                
                ${step.instructions.map((val) => {
                    return `<p>${val}</p>`;
                }).join("")}
            `;
        }).join("")}
        <h2>Conclusion</h2>
        <p>${generatedOutline?.conclusion.text}</p>`;

        this.editor.commands.setContent(htmlstring);

    }

    insertLoadingNode(position: { start: number; end: number }) {
        // const selection = this.cursorService.makeSelectionFromSerializedLexicalRange(serializedOperatingPoint);
        // let nodes:LexicalNode[] = []
        // this.editor.update(()=>{
        //     const selection = this.cursorService.offsetView.createSelectionFromOffsets(position.start,position.end);
        //     if (!$isRangeSelection(selection)){
        //         return;
        //     }
        //     const loadingNode = $createLoadingNode();
        //     nodes.push(loadingNode);
        //     selection.insertNodes([loadingNode]);
        // },{discrete:true})
        // return ()=> this.deleteAtPosition(nodes);
    }

    insertChoiceNode(text: string, position: { start: number; end: number }) {
        // const selection = this.cursorService.makeSelectionFromSerializedLexicalRange(serializedOperatingPoint);
        // let nodes:LexicalNode[] = []
        // this.editor.update(()=>{
        //     const selection = this.cursorService.offsetView.createSelectionFromOffsets(position.start,position.end);
        //     if (!$isRangeSelection(selection)){
        //         return;
        //     }
        //     const choiceNode = $createChoiceNode(text);
        //     nodes.push(choiceNode);
        //     selection.insertNodes([choiceNode]);
        // },{discrete:true})
        // return ()=> this.deleteAtPosition(nodes);
    }

    lastGeneratedText: string = "";
    insertGeneratedText(
        text: string,
        position: { start: number; end: number }
    ) {
        // this.lastGeneratedText = text;
        // // const selection = this.cursorService.makeSelectionFromSerializedLexicalRange(serializedOperatingPoint);
        // this.editor.update(()=>{
        //     let generatedNodes:LexicalNode[] = [];
        //     // $convertFromMarkdownString(text,TRANSFORMERS,{append:(...appendNodes)=>{generatedNodes = appendNodes;}}as ElementNode);
        //     const selection = this.cursorService.offsetView.createSelectionFromOffsets(position.start,position.end);
        //     if (!$isRangeSelection(selection)){
        //         return;
        //     }
        //     const textParagraphs = text.split('\n');
        //     textParagraphs.map((lineText)=>{
        //         const paragraph = $createParagraphNode();
        //         const textNode = $createTextNode(lineText);
        //         paragraph.append(textNode);
        //         generatedNodes.push(paragraph);
        //     });
        //     selection.insertNodes(generatedNodes);
        // },{discrete:true})
    }

    deleteAtPosition() {
        // this.editor.update(()=>{
        //     for(let node of nodes){
        //         node.remove();
        //     }
        // },{discrete:true});
    }
}

/**
 * Easier and more ergonomic keyboard shortcuts... just arranged on the right
 * side of the keyboard.
 */
export const commandKeys = ["j", "k", "l", "u", "i", "o", "p", "h", "n", "m"];

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
