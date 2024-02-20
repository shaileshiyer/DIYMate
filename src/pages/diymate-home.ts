import { LitElement, PropertyValueMap, TemplateResult, css, html } from "lit";
import { MobxLitElement } from "@adobe/lit-mobx";
import '@material/web/button/filled-button'
import { customElement, property } from "lit/decorators.js";
import { diymateCore } from "@core/diymate_core";
import { LocalStorageService } from "@core/services/local_storage_service";
import '../components/base-editor';


@customElement('diymate-home')
class DIYMateHome extends LitElement {

    @property({type:Number})
    private count = 0;    

    private localStorageService = diymateCore.getService(LocalStorageService);
    

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


    // protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    //     this.count = this.localStorageService.getCount();
    // }

    connectedCallback(): void {
        super.connectedCallback();
        this.count = this.localStorageService.getCount();
    }
    protected storeCount(){
        this.localStorageService.setCount(this.count);
    }

    protected render(): TemplateResult {
        return html`
            <div id="home">
                <h1>DIY-Tutorial-Mate</h1>
                <p>An LLM-powered Text editor to help you write a DIY tutorial</p>
                <md-filled-button @click=${this.storeCount} href="/new">Start DIY Tutorial</md-filled-button>
                <md-filled-button @click=${this.increment}>Increase count</md-filled-button>
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