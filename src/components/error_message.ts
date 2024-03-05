import '@material/web/icon/icon';
import { LitElement, TemplateResult, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";


@customElement("diymate-error-message")
export class ErrorMessage extends LitElement {
    @property({ type: Object })
    onClose = () => {};
    @property({ type: Object })
    getMessage: () => TemplateResult|TemplateResult<1> = () => html``;

    static override get styles() {
        const styles = css`
            .error {
                display: flex;
                flex-direction: row;
                align-items: center;
                margin-top: 20px;
                color: red;
                background-color: #fdd;
                font-size: var(--mdc-typography-body2-font-size, 0.875rem);
                -webkit-font-smoothing: antialiased;
                line-height: var(--mdc-typography-body2-line-height, 1.25rem);
                padding: 14px 8px 14px 16px;
                width: 100%;
                flex-grow: 1;
                box-sizing: border-box;
                justify-content: space-between;
                border-radius: var(--mdc-shape-small, 4px);
                box-shadow: 0px 3px 5px -1px rgba(0, 0, 0, 0.2),
                    0px 6px 10px 0px rgba(0, 0, 0, 0.14),
                    0px 1px 18px 0px rgba(0, 0, 0, 0.12);
            }

            mwc-icon {
                cursor: pointer;
            }
        `;

        return [styles];
    }

    protected render(): TemplateResult {
        return html`
            <div class="error">
                <span>${this.getMessage()}</span>
                <md-icon 
                    @click=${()=>{
                        this.onClose();
                    }}
                >
                    <span class="material-symbols-outline">
                        close
                    </span>
                </md-icon>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
      'diymate-error-message': ErrorMessage;
    }
  }
  