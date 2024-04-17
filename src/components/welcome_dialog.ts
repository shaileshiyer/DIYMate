import { MobxLitElement } from "@adobe/lit-mobx";
import { TemplateResult, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@material/web/button/text-button";
import "@material/web/button/outlined-button";

@customElement('dm-welcome-dialog')
export class WelcomeDialog extends MobxLitElement {

    static override get styles(){
        const styles = css`
            .headline{
                font-weight: 400;
                letter-spacing: 0.5px;
                font-size: 19px;
                margin-bottom: 25px;
            }
            .selection{
                background-color:var(--md-sys-color-primary-fixed-dim);    
                color:var(--md-sys-color-on-primary-fixed);
            }
            :host{
                --md-outlined-button-container-shape: 0px;
            }

            .inline {
                display: inline-block;
            }
            .align-content > *{
                vertical-align: middle;
                /* display: inline-flex; */
                /* align-items:center; */
            }
            .get-started {
                display:flex;
                flex-direction: row-reverse;
            }
        `;

        return [styles];

    }

    @property({type:Boolean}) hasbeenWelcomed = false;
    @property({type:Object}) close = ()=>{};

    protected render(): TemplateResult {
        const welcomeMessage = this.hasbeenWelcomed
      ? 'About DIYmate'
      : 'Welcome to DIYmate!';

        return html`

        <div class="headline">
            <h2> ⭐🛠️ ${welcomeMessage}</h2>

        </div>
        <div class="content">
            <p>Diymate is a text editor that empowers collaborative writing with a powerful large language model.
            It provides a suite of built-in controls, allowing you to generate and insert text, or ask the model 
            to review sections of your DIY tutorial in progress.
            </p>
            <p class="align-content">
            The controls are conveniently located on the right side of the editor. They dynamically change based on your cursor position and any selected text.
            For instance, click on <md-outlined-button class="inline">generate sentence</md-outlined-button> to 
            insert the next sentence at your current cursor location.
            </p>
            <p> 
                Selecting <span class="selection">some text</span> unlocks new controls on the right side. Experiment with them to discover their functionalities. 
                You can also chat with the language model about your DIY tutorial, discussing specific aspects in the "Chat" tab.
                Finally, the "Reviews" tab stores reviews of your tutorial, allowing you to revisit and make adjustments accordingly.
            </p>
            <p>❤️ - DIYmate</p>
        </div>
        <div class="get-started">
            <md-text-button @click=${()=> void this.close()}>Get Started</md-text-button>
        </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'dm-welcome-dialog': WelcomeDialog;
    }
}