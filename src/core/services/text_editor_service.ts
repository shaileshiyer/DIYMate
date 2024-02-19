import { $getRoot, $getSelection, $isTextNode, CreateEditorArgs, LexicalEditor, LexicalNode, ParagraphNode, createEditor } from "lexical";
import { Service } from "./service";
import { HistoryState, createEmptyHistoryState, registerHistory } from "@lexical/history";
import { makeObservable } from "mobx";
import { HeadingNode, registerRichText } from "@lexical/rich-text";
import { DIYStructureJSON } from "types";
import { $generateNodesFromDOM } from "@lexical/html";
import { $isListNode, ListNode } from "@lexical/list";
import { registerPlainText } from "@lexical/plain-text";

export interface LexicalConfig{
    root:HTMLElement|null;
    editorConfig: CreateEditorArgs;
}

interface ServiceProvider {

}

export class TextEditorService extends Service {
    private editor!: LexicalEditor;
    private historyState!:HistoryState;

    private richtextCallback!: ()=>void;
    private historyCallback!: ()=>void;
    private updateListenerCallback!: ()=>void;
    private mutationListenerCallback!: ()=>void;

    constructor(serviceProvider:ServiceProvider){
        super();
        makeObservable(this,{
        });
    }


    initiliaze(config:LexicalConfig){
        console.debug('Register root', config.root);
        this.editor = createEditor(config.editorConfig);
        this.historyState = createEmptyHistoryState();
        
        this.editor.setRootElement(config.root);
        // this.richtextCallback = registerRichText(this.editor);
        this.richtextCallback = registerPlainText(this.editor);
        this.historyCallback = registerHistory(this.editor, this.historyState, 1000);
        this.updateListenerCallback = this.editor.registerUpdateListener(({ editorState }) => {
            editorState.read(() => {
                // console.log($getSelection());

                // console.log(JSON.stringify(this.editor.getEditorState()));
                // const html = $generateHtmlFromNodes(this.editor);
                // output.innerHTML = html;
            });
        });
        this.mutationListenerCallback = this.editor.registerMutationListener(ParagraphNode,(mutatedNodes)=>{
              // mutatedNodes is a Map where each key is the NodeKey, and the value is the state of mutation.
            for (let [nodeKey, mutation] of mutatedNodes) {
                console.debug(nodeKey, mutation)
            }
        });
        console.debug('texteditorservice');
    }


    onDisconnect(){
        this.richtextCallback();
        this.historyCallback();
        this.updateListenerCallback();
        this.mutationListenerCallback();
    }

    updateOutline(generatedOutline:DIYStructureJSON){
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