import { MobxLitElement } from "@adobe/lit-mobx";
import { LitElement, PropertyValueMap, TemplateResult, css, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("diymate-editor-sidebar")
export class DIYMateEditorSidebar extends LitElement {
    static override get styles() {
        const styles = css`
            #editor-sidebar-wrapper {
                width:100%;
                /* margin: 2em auto; */
                /* padding: 2em auto; */
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
        return html`<div id="editor-sidebar-wrapper">Sidebar Wrapper</div>`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "diymate-editor-sidebar": DIYMateEditorSidebar;
    }
}
