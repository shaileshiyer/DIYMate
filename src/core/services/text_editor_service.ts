import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { Editor, JSONContent, EditorEvents, NodePos } from "@tiptap/core";
import { EditorState, TextSelection, Transaction } from "@tiptap/pm/state";
import {
    Fragment,
    DOMParser as TiptapParser,
    DOMSerializer as TiptapSerializer,
} from "@tiptap/pm/model";

import { Service } from "./service";

import { DIYStructureJSON } from "@core/shared/types";
import { Converter } from "showdown";

import { LocalStorageService } from "./local_storage_service";
import { CursorService, SerializedCursor } from "./cursor_service";
import { SentencesService } from "./sentences_service";
import { getEditorConfig } from "@lib/tiptap";
import { OperationsService } from "./operations_service";

interface ServiceProvider {
    localStorageService: LocalStorageService;
    cursorService: CursorService;
    sentencesService: SentencesService;
    operationsService: OperationsService;
}

interface Paragraphs {
    offset: number;
    text: string;
}

export class TextEditorService extends Service {
    private editor!: Editor;
    converter = new Converter();

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

    private get operationsService() {
        return this.serviceProvider.operationsService;
    }

    get getEditor() {
        return this.editor;
    }

    private editorListeners: (() => void)[] = [];

    private updateHandler: ((props: EditorEvents["update"]) => void) | null =
        null;
    private selectionUpdateHandler:
        | ((props: EditorEvents["selectionUpdate"]) => void)
        | null = null;

    initiliaze(element: Element | undefined) {
        /**
         * Setup the editor here.
         */

        const editorConf = getEditorConfig(element);
        this.editor = new Editor(editorConf);
        /** Can set content to an empty editor here */

        if (this.editorStateForInitialization !== null) {
            /**
             * Set parsed editor content.
             */
            this.editor.commands.setContent(this.editorStateForInitialization);
            this.editorStateForInitialization = null;
            // To prevent completely removing all content on undo.
            const newEditorState = EditorState.create({
                doc:this.editor.state.doc,
                plugins:this.editor.state.plugins,
                schema:this.editor.state.schema,
            });
            this.editor.view.updateState(newEditorState);
        }

        /**Setup listeners here. */
        this.editorListeners = [];
        this.editor.commands.command(({editor,tr})=>{
          this.onTextUpdate(editor,tr);
          return false;
        })

        this.updateHandler = ({ editor, transaction }): void => {
            console.debug('docChanged',transaction.docChanged,transaction.steps);
            const checkSteps = transaction.steps.filter((step)=> console.debug(step));
            if (!this.operationsService.isInOperation){
              this.onTextUpdate(editor, transaction);
            }
        };

        this.selectionUpdateHandler = ({ editor, transaction }) => {
            console.debug("selection");
            // console.debug(editor.getHTML());
            console.debug('docChanged',transaction.docChanged,transaction.steps);
            // console.debug('extensionStorage',editor.extensionStorage.operationKeyEvents);
            if (!this.operationsService.isInOperation){
              this.cursorService.cursorUpdate(editor, transaction);
              if (!transaction.docChanged) {
                  this.sentencesService.highlightCurrentSentence(
                      editor,
                      transaction
                  );
              }
            }
        };

        this.editor.on("update", this.updateHandler);
        this.editor.on("selectionUpdate", this.selectionUpdateHandler);

        this.editor.commands.focus("start");
    }

    onTextUpdate(editor: Editor, transaction: Transaction) {
        console.debug("onRead");
        // if (!this.operationsService.isInOperation){
        console.debug("processtext");
        this.updatePlainText(editor, transaction);
        // }
    }

    onDisconnect() {
        if (this.updateHandler !== null && this.selectionUpdateHandler) {
            this.editor.off("update", this.updateHandler);
            this.editor.off("selectionUpdate", this.selectionUpdateHandler);
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
    private updatePlainText(editor: Editor, tr: Transaction) {
        // Adding the condition where i check for changes actually makes the highlight selection lag.
        // if(this.plainText === editor.getText({blockSeparator:'\n\n'})) return;
        this.plainText = editor.getText({ blockSeparator: "\n" });
        // console.debug(this.editor.getJSON());
        this.paragraphs = [];

        const headingNodes = editor.$doc.querySelectorAll("heading");
        const paragraphNodes = editor.$doc.querySelectorAll("paragraph");
        // const ulNodes = editor.$doc
        //     .querySelectorAll("bulletList")
        //     .flatMap((listcontainer) => listcontainer);
        // const olNodes = editor.$doc
        //     .querySelectorAll("orderedList")
        //     .flatMap((listcontainer) => listcontainer);

        // const allLists = [...ulNodes, ...olNodes];
        // const allListItems: NodePos[] = [];
        // const listNodes = ulNodes[0].querySelectorAll("paragraph");
        // console.debug('listNodes',listNodes);
        // // console.debug(allListItems.map((val)=>{ return{pos:val.pos,val}}));
        // allLists.forEach((list) => {
        //     list.node.descendants((item, pos, parent) => {
        //         if (item.isText) {
        //             // console.debug(item.toString(),list.pos+pos+1,parent?.nodeSize)
        //             allListItems.push(editor.$pos(list.pos + pos + 1));
        //         }
        //     });
        // });

        // const nodesList = [...headingNodes, ...paragraphNodes, ...allListItems];
        const nodesList = [...headingNodes, ...paragraphNodes];

        nodesList.sort((a, b) => a.pos - b.pos);
        this.paragraphs = nodesList.map((node) => {
            return { offset: node.pos, text: node.textContent };
        });

        this.sentencesService.processText();
    }

    getPlainText(): string {
        return this.plainText;
    }

    getMarkdownText(){
      const docRange = this.editor.$doc.range;
      return this.getMarkdownFromRange({from:docRange.from+1,to:docRange.to-2});
    }

    getParagraphs(): Paragraphs[] {
        return this.paragraphs;
    }

    isEnabled = true;
    disableEditor() {
        this.editor.setEditable(false);
        this.editor.setOptions({editorProps:{attributes:{class:"tap-editor disabled"}}})
        runInAction(()=>{
            this.isEnabled = false;
        })
        // this.editor.commands.blur();
    }

    enableEditor() {
        this.editor.setEditable(true);
        this.editor.setOptions({editorProps:{attributes:{class:"tap-editor"}}})
        runInAction(()=>{
            this.isEnabled = true;
        })
        this.editor
            .chain()
            // .focus('start')
            .command(({ editor, tr }) => {
                this.cursorService.cursorUpdate(editor, tr);
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

    getStartOfDocument(): NodePos | null {
        return this.editor.$doc.firstChild;
    }

    getEndOfDocument(): NodePos | null {
        return this.editor.$doc.lastChild;
    }

    getEndOfCurrentSection(cursorPosition:SerializedCursor):SerializedCursor{
      const $nodePos = this.editor.$pos(cursorPosition.to);
      return {
        from:$nodePos.to-1,
        to:$nodePos.to-1,
      }
    }

    // Actions
    insertOutline(generatedOutline: DIYStructureJSON) {
        // console.debug(generatedOutline);
        const htmlstring = `
        <h1>${generatedOutline?.title}</h1>
        <h2>Introduction</h2>
        <p>${generatedOutline?.introduction}</p>
        <h2>Supplies</h2>
        <p>Materials:</p>
        <ul>
            ${generatedOutline?.materials
                .map((val) => {
                    return `<li>${val}</li>`;
                })
                .join("")}
        </ul>
        <p>Tools:</p>
        <ul>
            ${generatedOutline?.tools
                .map((val) => {
                    return `<li>${val}</li>`;
                })
                .join("")}
        </ul>
        <p>Competences:</p>
        <ul>
        ${generatedOutline?.competences
            .map((val) => {
                return `<li>${val}</li>`;
            })
            .join("")}
        </ul>
        <p>Safety Instructions </p>
        <ol>
            ${generatedOutline?.safety_instruction
                .map((val) => {
                    return `<li>${val}</li>`;
                })
                .join("")}
        </ol>
        <h2>Steps</h2>
        ${generatedOutline?.steps
            .map((step) => {
                return `
                <h3>${step.title}</h3>
                <p>Materials used in this step:</p>
                <ul>
                    ${step.materials_in_step
                        .map((val) => {
                            return `<li>${val}</li>`;
                        })
                        .join("")}
                </ul>
                <p>Tools used in this step:</p>
                <ul>
                    ${step.tools_in_step
                        .map((val) => {
                            return `<li>${val}</li>`;
                        })
                        .join("")}
                </ul>
                <p>Instructions:</p>
                
                ${step.instructions
                    .map((val) => {
                        return `<p>${val}</p>`;
                    })
                    .join("")}
            `;
            })
            .join("")}
        <h2>Conclusion</h2>
        <p>${generatedOutline?.conclusion.text}</p>`;

        this.editor.commands.setContent(htmlstring);
    }

    parseHTMLToNodes(htmlString: string): Fragment {
        const parsedHTML = new DOMParser().parseFromString(
            htmlString,
            "text/html"
        );
        const container = document.createElement("div");
        container.append(parsedHTML.childNodes.item(0));
        const parsedNodes = TiptapParser.fromSchema(this.editor.schema).parse(
            container
        ).content;
        // console.debug(parsedHTML);
        // console.debug(parsedNodes);
        return parsedNodes;
    }

    getHTMLFromRange(range: SerializedCursor) {
        const selection =
            this.cursorService.makeSelectionFromSerializedCursorRange(range);
        const slice = selection.content();
        const serializer = TiptapSerializer.fromSchema(this.editor.schema);
        const fragment = serializer.serializeFragment(slice.content);
        const div = document.createElement("div");
        div.appendChild(fragment);

        return div.innerHTML;
    }

    getMarkdownFromRange(range: SerializedCursor) {
        let htmlString = this.getHTMLFromRange(range);
        // const regex = /ab+c/;
        const regex = /<mark .*>(.*)?<\/mark>/g;
        htmlString = htmlString.replace(regex, "$1");
        const markdownString = this.converter
            .makeMarkdown(htmlString)
            .replace(/<!-- -->/g, "");
        return markdownString;
    }

    insertLoadingNode(position: SerializedCursor) {
        const loadingNode = this.editor.schema.node("loading-atom").toJSON();
        this.editor
            .chain()
            .setMeta("addToHistory",false)
            .insertContentAt(position, loadingNode, { updateSelection: true })
            .run();
        return () => this.deleteAtPosition(position);
    }

    insertChoiceNode(text: string, position: SerializedCursor) {
        const content = this.parseHTMLToNodes(text);

        const choiceNode = this.editor.schema.node("choice-atom", {}, content);
        console.debug("choiceNode", choiceNode);

        this.editor
            .chain()
            .setMeta("addToHistory",false)
            .insertContentAt(position, choiceNode.toJSON(), {
                parseOptions: {
                    preserveWhitespace: "full",
                },
                updateSelection: true,
            })
            .run();
        return () => this.deleteAtPosition(position);
    }

    insertChoiceInline(text: string, position: SerializedCursor) {
      // const content = this.parseHTMLToNodes(text);

      const choiceNode = this.editor.schema.node("choice-text-atom", {},this.editor.schema.text(text));
      console.debug("choiceNode", choiceNode);

      this.editor
          .chain()
          .setMeta("addToHistory",false)
          .insertContentAt(position, choiceNode.toJSON(), {
              parseOptions: {
                  preserveWhitespace: "full",
              },
              updateSelection: true,
          })
          .run();
      return () => this.deleteAtPosition(position);
  }

    lastGeneratedText: string = "";
    insertGeneratedText(text: string, position: SerializedCursor) {
        this.lastGeneratedText = text;
        const content = this.parseHTMLToNodes(text);
        console.debug("insertGenerated Content");
        console.debug(content.toJSON());
        this.editor
            .chain()
            .insertContentAt(position, content.toJSON(), {
                updateSelection: true,
            })
            .focus()
            .run();

    }

    insertGeneratedTextInline(text: string, position: SerializedCursor) {
      this.lastGeneratedText = text;
      this.editor
          .chain()
          .insertContentAt(position, text, {
              updateSelection: true,
          })
          .focus()
          .run();

  }

  insertSelectionMark(position:SerializedCursor){
    this.editor
        .chain()
        .setMeta('addToHistory',false)
        .setMark('selection-mark')
        .run();
  }

    deleteAtPosition(position: SerializedCursor) {
        // const nodePos = this.editor.$pos(position.from);
        // const nodeAfterthis = nodePos.after;
        // console.debug("deleteAtPosition Called");
        // this.editor.commands.deleteSelection();
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
