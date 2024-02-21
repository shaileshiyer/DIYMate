import { LitElement, TemplateResult, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement('test-component')
export class TestComponent extends LitElement{
    protected render(): TemplateResult {
        return html`
            <div>Test Component</div>
        `
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'test-component': TestComponent;
    }
}
