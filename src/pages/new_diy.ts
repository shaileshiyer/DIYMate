import { MobxLitElement } from "@adobe/lit-mobx";
import { LitElement, PropertyValueMap, TemplateResult, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { DIYStructureJSON, HTMLElementEvent } from "../types";

import '@material/web/textfield/filled-text-field'
import '@material/web/button/text-button'
import '@material/web/progress/circular-progress'
import { diymateCore } from "@core/diymate_core";
import { SessionService } from "@core/services/session_service";
import { LocalStorageService } from "@core/services/local_storage_service";
import { Task } from "@lit/task";
import { ModelService } from "@core/services/model_service";
import { defaultOutlinePrompt } from "@models/openai/prompts/outline";




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

    @property({type:Object,attribute:false })
    private generatedOutline:DIYStructureJSON|null = null;


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
            this.isLoading = true;
            if (!this.sessionService.isSessionActive){
                const sessionInfo = await this.sessionService.startSession(signal);
            }
            // return sessionInfo
            const response = await this.modelService.getModel().outline({description:this.description,outlinePrompt:this.outlinePrompt});
            console.debug(response);
            return response;
        },
        onError:(err)=>{
            this.isLoading = false;
        },
        onComplete:(val)=>{
            this.isLoading = false;
            this.generatedOutline = JSON.parse(val[0].content);
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
        this._generateOutlineTask.run();

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
                        ${this.renderResetOrLoader()}
                        <md-filled-button @click=${this.generateOutline} ?disabled=${this.isLoading}>Generate Outline</md-filled-button>
                    </div>
                </div>
                <div class="outline">
                    ${this.outlineTask()}
                </div>
                </div>
            </div>
        `
    } 

    protected renderResetOrLoader():TemplateResult {
        if (this.isLoading){
            return html`<md-circular-progress fourColor indeterminate></md-circular-progress>`;
        }
        return html`<md-text-button @click=${this.resetValues} ?disabled=${this.isLoading}>Reset</md-text-button>`;
    }
    protected outlineTask(): TemplateResult {
        return this._generateOutlineTask.render({
            initial: ()=>html``,
            pending:() => html`<p>Generating Outline</p>`,
            complete: (value)=> {
                return html`
                <div>
                    <h1>${this.generatedOutline?.title}</h1>
                    <p>${this.generatedOutline?.introduction}</p>
                    <p>Materials:</p>
                    <ul>${this.generatedOutline?.materials.map((val)=> html`<li>${val}</li>`)}</ul>
                    <p>Tools:</p>
                    <ul>${this.generatedOutline?.tools.map((val)=> html`<li>${val}</li>`)}</ul>
                    <p>Competences:</p>
                    <ul>${this.generatedOutline?.competences.map((val)=> html`<li>${val}</li>`)}</ul>
                    <p>Safety Instructions </p>
                    <ol>
                        ${this.generatedOutline?.safety_instruction.map((val)=>html`<li>${val}</li>`)}
                    </ol>
                    ${this.generatedOutline?.steps.map((step)=>{
                        return html`
                            <h2>${step.title}</h2>
                            <p>Materials used in this step:</p>
                            <ul>${step.materials_in_step.map((val)=> html`<li>${val}</li>`)}</ul>
                            <p>Tools used in this step:</p>
                            <ul>${step.tools_in_step.map((val)=> html`<li>${val}</li>`)}</ul>
                            <ul>${step.instructions.map((val)=> html`<li>${val}</li>`)}</ul>
                        `
                    })}
                    <h2>Conclusion</h2>
                    <p>${this.generatedOutline?.conclusion.text}</p>
                </div>
                `},
            error:(error)=> html `<p>Something went wrong:${error}</p>`
        })
        
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'diymate-new-diy': NewDIYPage;
    }
}