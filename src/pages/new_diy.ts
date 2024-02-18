import { MobxLitElement } from "@adobe/lit-mobx";
import { LitElement, PropertyValueMap, TemplateResult, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { DIYStructureJSON, HTMLElementEvent } from "../types";

import '@material/web/textfield/filled-text-field';
import '@material/web/button/text-button';
import '@material/web/progress/circular-progress';
import '@material/web/button/outlined-button';
import '@material/web/button/filled-tonal-button';
import { diymateCore } from "@core/diymate_core";
import { SessionService } from "@core/services/session_service";
import { LocalStorageService } from "@core/services/local_storage_service";
import { Task } from "@lit/task";
import { ModelService } from "@core/services/model_service";
import { defaultOutlinePrompt } from "@models/openai/prompts/outline";
import { $getRoot, $insertNodes, $isTextNode, LexicalEditor, LexicalNode, createEditor } from "lexical";
import { registerRichText, HeadingNode, $createHeadingNode, } from "@lexical/rich-text";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { $isListNode, ListItemNode, ListNode } from "@lexical/list";
import { LinkNode } from "@lexical/link";
import { TRANSFORMERS, registerMarkdownShortcuts } from "@lexical/markdown";
import { createEmptyHistoryState, registerHistory } from "@lexical/history";

const config = {
    namespace: 'OutineEditor',
    themes:{

    },
    nodes: [
        HeadingNode,
        ListItemNode,
        ListNode,
        LinkNode,
    ],
    onError: (error: any) => console.error(error),
};


@customElement('diymate-new-diy')
export class NewDIYPage extends MobxLitElement {

    static override get styles() {
        const elementStyle = css`
        
        #new-diy-wrapper {
            display:flex;
            flex-direction: column;
            justify-content: center;
            min-width: 1280px;
            margin:0 auto;
            padding: 2em auto;
            place-items: center;
            min-height: 100vh;
        }

        .outline {
            display:flex;
            flex-direction: column;
            justify-content: center;
            max-width: 600px;
            margin:0 auto;
            padding: 2em auto;
            place-items: center;
        }

        .outline-container {
            display:flex;
            flex-direction: column;
            justify-content: center;
            max-width: 600px;
            margin:0 auto;
            padding: 2em auto;
            place-items: center;
        }

        #outline-editable {
            padding:5px;
            border:var(--md-sys-color-primary);
            border-radius:20px;
        }

        #outline-editable:focus {
            outline:var(--md-sys-color-surface-tint);
        }
        h1 {
            font-size: 3rem;
        }

        .diy-textarea {
            /* max-width:100%; */
            width:100%;
            resize:vertical;
            min-height: 5rem;
            height:fit-content;
        }

        .bottom-bar {
            display:flex;
            justify-content: space-between;
            margin:1em 0;
        }

        `
        return [
            elementStyle,
        ];
    }

    @property({ type: String })
    private description = '';

    @property({ type: String })
    private outlinePrompt = defaultOutlinePrompt;

    @property({ type: Boolean })
    private isLoading = false;

    @property({ type: Boolean, attribute: false })
    private showOutline = false;

    @property({ type: Object, attribute: false })
    private generatedOutline: DIYStructureJSON | null = null;


    private sessionService = diymateCore.getService(SessionService);
    private localStorageService = diymateCore.getService(LocalStorageService);
    private modelService = diymateCore.getService(ModelService);

    private editor: LexicalEditor = createEditor(config);
    constructor() {
        super();
        this._generateOutlineTask.autoRun = false;

    }
    protected override firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        const currentDIY = this.localStorageService.getCurrentDIY();
        if (currentDIY !== null) {
            this.description = currentDIY.description;
            this.outlinePrompt = currentDIY.outlinePrompt;
        }
        const editorRoot = this.shadowRoot?.querySelector('#outline-editable') as HTMLElement;
        if (!!editorRoot) {
            this.editor.setRootElement(editorRoot);
            const historystate = createEmptyHistoryState();
            registerRichText(this.editor);
            registerHistory(this.editor,historystate,1000);
            this.editor.registerUpdateListener((listener)=>{
                console.debug('DATA',listener.editorState.toJSON());
            })
        }
    }


    resetValues() {
        this.description = '';
        this.outlinePrompt = defaultOutlinePrompt;
    }

    private _generateOutlineTask = new Task(this, {
        task: async ([], { signal }) => {
            this.isLoading = true;
            if (!this.sessionService.isSessionActive) {
                await this.sessionService.startSession(signal);
            }
            // return sessionInfo
            const response = await this.modelService.getModel().outline({ description: this.description, outlinePrompt: this.outlinePrompt });
            console.debug(response);
            return response;
        },
        onError: (err) => {
            this.isLoading = false;
        },
        onComplete: (val) => {
            this.isLoading = false;
            this.showOutline=true;
            this.generatedOutline = JSON.parse(val[0].content);
            console.debug(this.generatedOutline);
            const htmlstring = `
                <h1>${this.generatedOutline?.title}</h1>
                <p>${this.generatedOutline?.introduction}</p>
                <p>Materials:</p>
                <ul>
                    ${this.generatedOutline?.materials.map((val) => { return `<li>${val}</li>` })}
                </ul>
                <p>Tools:</p>
                <ul>
                    ${this.generatedOutline?.tools.map((val) => { return `<li>${val}</li>` })}
                </ul>
                <p>Competences:</p>
                <ul>
                ${this.generatedOutline?.competences.map((val) => { return `<li>${val}</li>` })}
                </ul>
                <p>Safety Instructions </p>
                <ol>
                    ${this.generatedOutline?.safety_instruction.map((val) => { return `<li>${val}</li>` })}
                </ol>
                ${this.generatedOutline?.steps.map((step) => {
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
                <p>${this.generatedOutline?.conclusion.text}</p>`;

            const dom = new DOMParser().parseFromString(htmlstring, 'text/html');
            this.editor.update(() => {
                const nodes:LexicalNode[] = $generateNodesFromDOM(this.editor, dom);
                const root = $getRoot();
                root.clear();
                const filteredNodes = nodes.filter((node)=> {
                    if (!$isTextNode(node)){
                        if ($isListNode(node)){
                            const list = node as ListNode;
                            list.getChildren().filter((child)=>{
                                if (child.getTextContent() === ','){
                                    child.remove();
                                }
                            })
                        }
                        return true;
                    }
                });
               
                root.select();
                $insertNodes(filteredNodes);

            });



        },
        args: () => [],
    },)



    protected generateOutline(): void {
        this.isLoading = true;
        const currentDIY = {
            description: this.description,
            outlinePrompt: this.outlinePrompt,
        }
        this.localStorageService.setCurrentDIY(currentDIY);
        this._generateOutlineTask.run();

    }


    protected renderDescriptionAndPrompt(): TemplateResult {
        return html`
        <div>
        <h1>Start a new DIY Tutorial</h1>
        <p>Write a short description of your DIY tutorial:</p>
        <md-filled-text-field
            type="textarea"
            name="diy-description"
            class="diy-textarea"
            rows="5"
            placeholder="Describe your DIY tutorial in 200-250 words..."
            @input=${(e: HTMLElementEvent<HTMLTextAreaElement>) => (this.description = e.target.value)}
            .value=${this.description}
            ?disabled=${this.isLoading}
        ></md-filled-text-field>
        <p>Prompt to create a basic outline for the DIY Tutorial:</p>
        <md-filled-text-field
            type="textarea"
            class="diy-textarea"
            name="diy-outline-prompt"
            placeholder="Outline"
            @input=${(e: HTMLElementEvent<HTMLTextAreaElement>) => (this.outlinePrompt = e.target.value)}
            .value=${this.outlinePrompt}
            rows="20"
            ?disabled=${this.isLoading}
        ></md-filled-text-field>
        </div>
        `
    }

    protected renderOutlineContent() {
        return html`
    <h1>${this.generatedOutline?.title}</h1>
                    <p>${this.generatedOutline?.introduction}</p>
                    <p>Materials:</p>
                    <ul>${this.generatedOutline?.materials.map((val) => html`<li>${val}</li>`)}</ul>
                    <p>Tools:</p>
                    <ul>${this.generatedOutline?.tools.map((val) => html`<li>${val}</li>`)}</ul>
                    <p>Competences:</p>
                    <ul>${this.generatedOutline?.competences.map((val) => html`<li>${val}</li>`)}</ul>
                    <p>Safety Instructions </p>
                    <ol>
                        ${this.generatedOutline?.safety_instruction.map((val) => html`<li>${val}</li>`)}
                    </ol>
                    ${this.generatedOutline?.steps.map((step) => {
            return html`
                            <h2>${step.title}</h2>
                            <p>Materials used in this step:</p>
                            <ul>${step.materials_in_step.map((val) => html`<li>${val}</li>`)}</ul>
                            <p>Tools used in this step:</p>
                            <ul>${step.tools_in_step.map((val) => html`<li>${val}</li>`)}</ul>
                            <ul>${step.instructions.map((val) => html`<li>${val}</li>`)}</ul>
                        `
        })}
                    <h2>Conclusion</h2>
                    <p>${this.generatedOutline?.conclusion.text}</p>`
    }

    protected renderResetOrLoader(): TemplateResult {
        if (this.isLoading) {
            return html`<md-circular-progress fourColor indeterminate></md-circular-progress>`;
        }
        return html`<md-text-button @click=${this.resetValues} ?disabled=${this.isLoading}>Reset</md-text-button>`;
    }
    protected outlineTask(): TemplateResult {
        return this._generateOutlineTask.render({
            initial: () => html``,
            pending: () => html`<p>Generating Outline</p>`,
            complete: (value) => {
                return html``
            },
            error: (error) => html`<p>Something went wrong:${error}</p>`
        })

    }

    protected renderButtons():TemplateResult {
        return !this.showOutline?
        html`<md-filled-button @click=${this.generateOutline} ?disabled=${this.isLoading}>Generate Outline</md-filled-button>`:
        html`
        <md-filled-tonal-button @click=${this.generateOutline} ?disabled=${this.isLoading}>Regenerate Outline</md-filled-tonal-button>
        <md-filled-button ?disabled=${this.isLoading}>Confirm Outline</md-filled-button>`
    }

    protected render(): TemplateResult {
        return html`
            <div id="new-diy-wrapper" >
                <div class="new-diy">
                    ${this.renderDescriptionAndPrompt()}
                    <div class="outline-container">
                        <div id="outline-editable" contenteditable></div>
                    </div>
                    ${this.outlineTask()}
                <div class="bottom-bar">
                    <md-text-button href="/">Back</md-text-button>
                    <div>
                        ${this.renderResetOrLoader()}
                        ${this.renderButtons()}
                    </div>
                </div>
                </div>
            </div>
        `
    }


}

declare global {
    interface HTMLElementTagNameMap {
        'diymate-new-diy': NewDIYPage;
    }
}