import { MobxLitElement } from "@adobe/lit-mobx";
import { TemplateResult, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import '@material/web/button/text-button'
import { diymateCore } from "@core/diymate_core";
import { AppService, DocumentStoreService, InitializationService } from "@core/services/services";
import {styles as sharedStyles} from './shared.css'

@customElement('diymate-new-diy')
export class NewDIYComponent extends MobxLitElement {
    private readonly appService = diymateCore.getService(AppService);
    private readonly documentStoreService = diymateCore.getService(DocumentStoreService);
    private readonly initializationService = diymateCore.getService(InitializationService);
    
    static override get styles() {
        const elementStyle = css`
        
        #new-diy-wrapper {
            display:flex;
            flex-direction: column;
            justify-content: center;
            min-width: 1280px;
            margin:auto auto;
            place-items: center;
            min-height: 100vh;
        }

        h1 {
            font-size: 3rem;
        }
        ` 
        return [
            elementStyle,
        ];
    }
    
    
    renderBackButton() {
        const goToHome = ()=>{
            this.appService.goToOnboarding()
        }

        return html`
            <div class="back">
                <md-text-button @click=${goToHome}>Back</md-text-button>
            </div>
        `
    }
    
    protected render(): TemplateResult<1> {
        return html`
            <div id="new-diy-wrapper" >
                <h1>Start a new DIY Tutorial</h1>
                <p>Write a short description of your DIY tutorial:</p>
                <textarea
                    name="diy-description"
                    placeholder="Describe your DIY tutorial in 200-250 words..."
                ></textarea>
                <p>Prompt to create a basic outline for the DIY Tutorial:</p>
                <textarea
                    name="diy-outline-prompt"
                    placeholder="Describe your DIY tutorial in 200-250 words..."
                ></textarea>
                ${this.renderBackButton()}
            </div>
        `
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'diymate-new-diy':NewDIYComponent;
    }
}