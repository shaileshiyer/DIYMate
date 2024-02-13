import { MobxLitElement } from "@adobe/lit-mobx";
import { LitElement, PropertyValueMap, TemplateResult, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { HTMLElementEvent } from "../types";

import '@material/web/textfield/filled-text-field'
import '@material/web/button/text-button'
import { diymateCore } from "@core/diymate_core";
import { SessionService } from "@core/services/session_service";
import { LocalStorageService } from "@core/services/local_storage_service";
import { Task } from "@lit/task";
import { ModelService } from "@core/services/model_service";


const defaultOutlinePrompt: string = `Generate a DIY tutorial outline with image suggestions in the following JSON format:
\`\`\`JSON
{
"title": "Title of the DIY Project",
"heroshot_alt_text": "Alternate text for the hero shot",
"introduction": "Introduction to the DIY Project",
"materials":["material 1","material 2"],
"tools":["tool 1","tool 2"],
"competences":["competence 1","competences 2"],
"safety instruction":["safety 1","safety 2","safety 3"],
"steps":[
    {
    "index": 0,
    "title": "step title",
    "image_alt_text":"Alternate text for image for this step.",
    "materials_in_step":["material 1","material 2"],
    "tools_in_step":["tool 1","tool 2"],
    "instructions":["instruction 1","instruction 2"]
    },
    {
    "index": 1,
    "title": "step title",
    "image_alt_text":"Alternate text for image for this step.",
    "materials_in_step":["material 1","material 2"],
    "tools_in_step":["tool 1","tool 2"],
    "instructions":["instruction 1","instruction 2"]
    }],
    "conclusion":{
    "final_image_alt_text":"Alternate text for final image",
    "text":"Summarize the DIY tutorial"
    }
}
\`\`\`
`;


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

    private sessionService = diymateCore.getService(SessionService);
    private localStorageService = diymateCore.getService(LocalStorageService);
    private modelService = diymateCore.getService(ModelService);

    constructor(){
        super();
        this._generateOutlineTask.autoRun = false;
    }
    protected override firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        const currentDIY = this.localStorageService.getCurrentDIY();
        if (currentDIY !== null) {
            this.description = currentDIY.description;
            this.outlinePrompt = currentDIY.outlinePrompt;
        }
    }


    resetValues() {
        this.description = '';
        this.outlinePrompt = defaultOutlinePrompt;
    }

    private _generateOutlineTask = new Task(this, {
        task: async ([], { signal }) => {
            if (this.sessionService.sessionInfo.session_id === ''){
                const sessionInfo = await this.sessionService.startSession(signal);
            }
            // return sessionInfo
            const response = await this.modelService.getModel().outline({description:this.description,outlinePrompt:this.outlinePrompt});
            console.debug(response);
            return response;
        },
        args: ()=>[],
    },)

    protected generateOutline(): void {
        this.isLoading = true;
        const currentDIY = {
            description: this.description,
            outlinePrompt: this.outlinePrompt,
        }
        this.localStorageService.setCurrentDIY(currentDIY);
        // const sessionInfo = this.sessionService.startSession();
        this._generateOutlineTask.run();
        this.isLoading = false;

    }

    protected render():TemplateResult{
        return html`
            <div id="new-diy-wrapper" >
                <div class="new-diy">
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
                <div class="bottom-bar">
                    <md-text-button href="/">Back</md-text-button>
                    <div>
                        <md-text-button @click=${this.resetValues} ?disabled=${this.isLoading}>Reset</md-text-button>
                        <md-filled-button @click=${this.generateOutline} ?disabled=${this.isLoading}>Generate Outline</md-filled-button>
                    </div>
                </div>
                <div>
                    ${this.outlineTask()}
                </div>
                </div>
            </div>
        `
    } 
    protected outlineTask(): TemplateResult {
        return this._generateOutlineTask.render({
            initial: ()=>html``,
            pending:() => html`<p>Generating Outline</p>`,
            complete: (value)=> html`<p> Generated Outline:</p><p>${JSON.stringify(value)}</p>`,
            error:(error)=> html `<p>Something went wrong:${error}</p>`
        })
        
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'diymate-new-diy': NewDIYPage;
    }
}