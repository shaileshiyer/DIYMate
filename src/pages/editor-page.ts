import { MobxLitElement } from "@adobe/lit-mobx";
import { LitElement, PropertyValueMap, TemplateResult, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import "../components/diymate-editor";
import "../components/sidebar";

@customElement("editor-page")
export class EditorPage extends LitElement {
    static override get styles() {
        const styles = css`
            #editor-page-wrapper {
                display: flex;
                flex-direction: row;
                height:100%;
                /* height: 80vh; */
                /* margin: 2em auto; */
                /* padding: 2em auto; */
            }

            .left {
                flex:1;
            }

            .right {
                /* margin-left:2em; */
                width:var(--sidebar-right-width);
            }
        `;

        return [styles];
    }

    protected firstUpdated(
        _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
    ): void {}
    connectedCallback(): void {
        super.connectedCallback();
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
    }
    protected render(): TemplateResult {
        return html`
            <div id="editor-page-wrapper">
                <div class="left"><diymate-editor></diymate-editor></div>
                <div class="right"><diymate-editor-sidebar></diymate-editor-sidebar></div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "editor-page": EditorPage;
    }
}
