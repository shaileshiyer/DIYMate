import { MobxLitElement } from "@adobe/lit-mobx";
import { diymateCore } from "@core/diymate_core";
import { CursorService } from "@core/services/cursor_service";
import { LitElement, PropertyValueMap, TemplateResult, css, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("diymate-editor-sidebar")
export class DIYMateEditorSidebar extends MobxLitElement {
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

    private cursorService = diymateCore.getService(CursorService);

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
        return html`<div id="editor-sidebar-wrapper">
            <h1>Sidebar Wrapper</h1>
            <p>Selected Text: ${this.cursorService.selectedText}</p>
            <p>Pre Text: ${this.cursorService.preText}</p>
            <p>Post Text: ${this.cursorService.postText}</p>
            <p>Current Node: ${this.cursorService.currentNode}</p>
            </div>`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "diymate-editor-sidebar": DIYMateEditorSidebar;
    }
}
