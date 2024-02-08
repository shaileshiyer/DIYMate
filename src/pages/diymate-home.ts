import { LitElement, PropertyValueMap, TemplateResult, css, html } from "lit";
import { MobxLitElement } from "@adobe/lit-mobx";
import '@material/web/button/filled-button'
import { customElement, property } from "lit/decorators.js";


@customElement('diymate-home')
class DIYMateHome extends LitElement {

    @property({type:Number})
    count = 0;    


    static override get styles() {
        const style = css`
        #home {
            margin:0 auto;
            padding: 1em 8em;
            place-items: center;
            min-height: 100vh;
        }
        h1{
            font-size:5em;
        }
        `;
        return [style]
    }
    protected increment():void{
        this.count++;
    } 




    protected render(): TemplateResult {
        return html`
            <div id="home">
                <h1>DIY-Tutorial-Mate</h1>
                <p>An LLM-powered Text editor to help you write a DIY tutorial</p>
                <md-filled-button @click=${this.increment}>Start DIY Tutorial</md-filled-button>
                <div> Count is ${this.count}</div>
                <hr />
            </div>
        `
    }


}

declare global {
    interface HTMLElementTagNameMap {
        "diymate-home": DIYMateHome;
    }
}