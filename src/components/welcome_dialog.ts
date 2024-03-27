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
                --md-elevated-button-container-shape: 0px;
            }

            .inline {
                display: inline-block;
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
            <p>Diymate is a text editor that enables collaborative writing with an powerful large language model.
            with a suite of built-in controls: from generating and inserting text, to asking it to review portions of
            DIY tutorial you are writing. 
            </p>
            <p>
                The controls are present on the right hand side of editor. The controls change depending on where your cursor
                is, and whether you have selected any text. try clicking on <md-outlined-button class="inline">generate text</md-outlined-button> to insert text where the cursor is. 
            </p>
            <p>
                If you select <span class="selection">some text</span> new controls appear on the right hand side. try them and see what happens. You can also,
                chat with the language model about your DIY tutorial and discuss it with it. Lastly, there is the reviews tab where
                reviews that are taken of the DIY tutorial are stored incase you need to see them again and make changes to 
                your DIY tutorial accordingly.
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