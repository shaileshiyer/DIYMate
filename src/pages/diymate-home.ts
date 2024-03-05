import { LitElement, PropertyValueMap, TemplateResult, css, html } from "lit";
import { MobxLitElement } from "@adobe/lit-mobx";
import "@material/web/button/filled-button";
import { customElement, property } from "lit/decorators.js";
import { diymateCore } from "@core/diymate_core";
import { LocalStorageService } from "@core/services/local_storage_service";
import { DocumentStoreService } from "@core/services/document_store_service";
import "@material/web/progress/circular-progress";
import "@material/web/icon/icon";

@customElement("diymate-home")
class DIYMateHome extends MobxLitElement {
    private localStorageService = diymateCore.getService(LocalStorageService);
    private documentStoreService = diymateCore.getService(DocumentStoreService);

    static override get styles() {
        const style = css`
            #home {
                margin: 0 auto;
                padding: 1em 8em;
                place-items: center;
                min-height: 100vh;
            }
            h1 {
                font-size: 5em;
            }

            .diy-tutorials-list {
                display: flex;
                flex-wrap: wrap;
            }

            .diy-preview {
                box-sizing: border-box;
                width: 200px;
                height: 295px;
                margin: 0 20px 20px 0;
                font-size: 12px;
                line-height: 1.75;
                border: 1px solid var(--md-sys-color-on-primary-fixed-variant);
                box-shadow: 3px 3px 3px rgba(0, 0, 0, 0.2);
                background: var(--md-sys-color-primary-fixed);
                color: var(--md-sys-color-on-primary-fixed);
                padding: 15px;
                cursor: pointer;
                position: relative;
                display: -webkit-box;
                -webkit-line-clamp: 13;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .delete-icon {
                position: absolute;
                bottom: 5px;
                right: 5px;
                cursor: pointer;
                color: var(--md-sys-color-outline);
                transition: color 50ms linear;
            }

            .delete-icon:hover {
                color: var(--md-sys-color-on-primary-fixed-variant);
            }
        `;
        return [style];
    }

    connectedCallback(): void {
        super.connectedCallback();
        this.documentStoreService.loadUserDocuments();
    }

    renderSavedTutorials() {
        const { isLoading, userDocuments } = this.documentStoreService;
        let contents = html``;

        if (isLoading) {
            contents = html`
                <md-circular-progress
                    class="four-color"
                    indeterminate
                    fourColor></md-circular-progress>
            `;
        }
        if (userDocuments.length) {
            contents = html`
                <div class="diy-header">
                    Or load an Existing DIY tutorial...
                </div>
                <div class="diy-tutorials-list">
                    ${userDocuments.map((doc) => {
                        const onClick = () => {
                            this.documentStoreService.loadSavedDocument(doc);
                        };

                        return html`
                            <div
                                @click=${onClick}
                                class="diy-preview">
                                ${doc.plainText
                                    .split("\n")
                                    .map((p) => html`<p>${p}</p>`)}
                                <md-icon
                                    class="delete-icon"
                                    @click=${(e:Event) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        this.documentStoreService.deleteDocument(
                                            doc.id
                                        );
                                    }}>
                                    <span class="material-symbols-outline">
                                        delete
                                    </span>
                                </md-icon>
                            </div>
                        `;
                    })}
                </div>
            `;
        }
        return html`<div class="tutorials-container">${contents}</div>`;
    }

    protected render(): TemplateResult {
        return html`
            <div id="home">
                <h1>DIY-Tutorial-Mate</h1>
                <p>
                    An LLM-powered Text editor to help you write a DIY tutorial
                </p>
                <md-filled-button href="/new">
                    Start DIY Tutorial
                </md-filled-button>
                <hr />
                ${this.renderSavedTutorials()}
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "diymate-home": DIYMateHome;
    }
}
