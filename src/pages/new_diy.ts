import { MobxLitElement } from "@adobe/lit-mobx";
import { LitElement, PropertyValueMap, TemplateResult, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { HTMLElementEvent } from "../types";

import '@material/web/textfield/filled-text-field'
import '@material/web/button/text-button'


@customElement('diymate-new-diy')
export class NewDIYPage extends LitElement {

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
    
    @property({type:String})
    private description='';

    @property({type:String})
    private outlinePrompt=`Generate a DIY tutorial outline with image suggestions in the following JSON format:
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

    protected override firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        const localStorageValue:string|null = window.localStorage.getItem('NEW_DIY_OUTLINE');
        if (localStorageValue !== null){
            const diyOutline:{description:string,outlinePrompt:string} = JSON.parse(localStorageValue);
            this.description = diyOutline.description;
            this.outlinePrompt = diyOutline.outlinePrompt;
            window.localStorage.removeItem('NEW_DIY_OUTLINE');
        }
    }
    // renderBackButton() {

    //     return html`
    //         <div class="back">
    //             <md-text-button href="/">Back</md-text-button>
    //         </div>
    //     `
    // }
    
    protected generateOutline():void{
        console.debug(this.description);
        console.debug(this.outlinePrompt);
        const newDIYOutline = {
            description: this.description,
            outlinePrompt: this.outlinePrompt,
        }
        window.localStorage.setItem('NEW_DIY_OUTLINE',JSON.stringify(newDIYOutline));
    }

    protected render(): TemplateResult<1> {
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
                    @input=${(e:HTMLElementEvent<HTMLTextAreaElement>)=> (this.description = e.target.value )}
                    value=${this.description}
                ></md-filled-text-field>
                <p>Prompt to create a basic outline for the DIY Tutorial:</p>
                <md-filled-text-field
                    type="textarea"
                    class="diy-textarea"
                    name="diy-outline-prompt"
                    placeholder="Outline"
                    @input=${(e:HTMLElementEvent<HTMLTextAreaElement>)=> (this.outlinePrompt = e.target.value )}
                    value=${this.outlinePrompt}
                    rows="20"
                ></md-filled-text-field>
                <div class="bottom-bar">
                    <md-text-button href="/">Back</md-text-button>
                    <md-filled-button @click=${this.generateOutline}>Generate Outline</md-filled-button>
                </div>
                </div>
            </div>
        `
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'diymate-new-diy':NewDIYPage;
    }
}