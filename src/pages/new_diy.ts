import { MobxLitElement } from "@adobe/lit-mobx";
import { LitElement, PropertyValueMap, TemplateResult, css, html } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { DIYStructureJSON, HTMLElementEvent } from "../core/shared/types.ts";

import "@material/web/textfield/filled-text-field";
import "@material/web/button/text-button";
import "@material/web/progress/circular-progress";
import "@material/web/button/outlined-button";
import "@material/web/button/filled-tonal-button";
import { diymateCore } from "@core/diymate_core";
import { SessionService } from "@core/services/session_service";
import {
    CurrentDIY,
    LocalStorageService,
} from "@core/services/local_storage_service";
import { Task } from "@lit/task";
import { ModelService } from "@core/services/model_service";
import { defaultOutlineDescription } from "@models/openai/prompts/outline";
import "../components/outline-editor.ts";
import { TextEditorService } from "@core/services/text_editor_service.ts";
import { InitializationService } from "@core/services/initialization_service.ts";

@customElement("diymate-new-diy")
export class NewDIYPage extends MobxLitElement {
    static override get styles() {
        const elementStyle = css`
            #new-diy-wrapper {
                display: flex;
                flex-direction: column;
                justify-content: center;
                min-width: 1280px;
                margin: 0 auto;
                padding: 2em auto;
                place-items: center;
                min-height: 100vh;
            }

            h1 {
                font-size: 3rem;
            }

            .diy-textarea {
                /* max-width:100%; */
                width: 100%;
                resize: vertical;
                min-height: 5rem;
                height: fit-content;
            }

            .input-container {
                display: flex;
                flex-direction: column;
                justify-content: start;
                max-width: 700px;
                width: 100%;
                margin: 2em auto;
                padding: 2em auto;
            }

            .bottom-bar {
                display: flex;
                justify-content: space-between;
                margin: 1em 0;
            }
        `;
        return [elementStyle];
    }

    @property({ type: String })
    private description = "";

    @property({ type: String })
    private outlinePrompt = defaultOutlineDescription;

    @property({ type: Boolean })
    private isLoading = false;

    @property({ type: Boolean, attribute: false })
    private showOutline = false;

    @property({ type: Object, attribute: false })
    private generatedOutline!: DIYStructureJSON;

    private sessionService = diymateCore.getService(SessionService);
    private textEditorService = diymateCore.getService(TextEditorService);

    private localStorageService = diymateCore.getService(LocalStorageService);
    private modelService = diymateCore.getService(ModelService);
    private initializationService = diymateCore.getService(
        InitializationService
    );

    constructor() {
        super();
        this._generateOutlineTask.autoRun = false;
    }

    override connectedCallback(): void {
        super.connectedCallback();
        const currentDIY = this.localStorageService.getCurrentDIY();
        if (currentDIY !== null) {
            this.description = currentDIY.description;
            this.outlinePrompt = currentDIY.outlinePrompt;
        }
    }

    resetValues() {
        this.description = "";
        this.outlinePrompt = defaultOutlineDescription;
    }

    private _generateOutlineTask = new Task(this, {
        task: async ([], { signal }) => {
            this.isLoading = true;
            if (!this.sessionService.isSessionActive) {
                await this.sessionService.startSession(signal);
            }
            // return sessionInfo
            const response = await this.modelService.getModel().outline({
                description: this.description,
                outlineDescription: this.outlinePrompt,
            });
            return response;
        },
        onError: (err) => {
            this.isLoading = false;
        },
        onComplete: (val) => {
            this.generatedOutline = JSON.parse(val[0].content);
            this.isLoading = false;
            this.showOutline = true;
        },
        args: () => [],
    });

    protected generateOutline(): void {
        this.isLoading = true;
        const currentDIY = {
            description: this.description,
            outlinePrompt: this.outlinePrompt,
        };
        this.localStorageService.setCurrentDIY(currentDIY);
        this._generateOutlineTask.run();
    }

    protected renderDescriptionAndPrompt(): TemplateResult {
        return html`
            <div class="input-container">
                <p>Write a short description of your DIY tutorial:</p>
                <md-filled-text-field
                    type="textarea"
                    name="diy-description"
                    class="diy-textarea"
                    rows="5"
                    placeholder="Describe your DIY tutorial in 200-250 words..."
                    @input=${(e: HTMLElementEvent<HTMLTextAreaElement>) =>
                        (this.description = e.target.value)}
                    .value=${this.description}
                    ?disabled=${this.isLoading}></md-filled-text-field>
                <p>Give a description of your outline.</p>
                <p>
                    Example: It should be brief and have short sentences. It
                    should be divided into 5 steps. In the introduction
                    emphasise on the cuteness of the animal shapes.
                </p>
                <ul>
                    <li>Talk about the tone of the outline.</li>
                    <li>How many steps it should have?</li>
                    <li>What to emphasize and not emphasize.</li>
                    <li>...</li>
                </ul>

                <md-filled-text-field
                    type="textarea"
                    class="diy-textarea"
                    name="diy-outline-prompt"
                    placeholder="It should be brief and have short sentences. It should be divided into 5 steps. In the introduction emphasise on the cuteness of the animal shapes."
                    @input=${(e: HTMLElementEvent<HTMLTextAreaElement>) =>
                        (this.outlinePrompt = e.target.value)}
                    .value=${this.outlinePrompt}
                    rows="5"
                    ?disabled=${this.isLoading}
                    spellcheck="false"></md-filled-text-field>
            </div>
        `;
    }

    protected renderResetOrLoader(): TemplateResult {
        if (this.isLoading) {
            return html`<md-circular-progress
                fourColor
                indeterminate>
            </md-circular-progress>`;
        }
        return html`<md-text-button
            @click=${this.resetValues}
            ?disabled=${this.isLoading}>
            Reset
        </md-text-button>`;
    }
    protected outlineTask(): TemplateResult {
        return this._generateOutlineTask.render({
            initial: () => html``,
            pending: () => html`<p>Generating Outline</p>`,
            complete: (value) => {
                return html``;
            },
            error: (error) => html`<p>Something went wrong:${error}</p>`,
        });
    }

    private saveNewDIYInfo() {
        const currentDIY: CurrentDIY = {
            description: this.description,
            outlinePrompt: this.outlinePrompt,
            generatedOutline: this.textEditorService.getPlainText(),
        };
        this.localStorageService.setCurrentDIY(currentDIY);
    }

    protected renderActionButtons(): TemplateResult {
        return !this.showOutline
            ? html`<md-filled-button
                  @click=${this.generateOutline}
                  ?disabled=${this.isLoading}>
                  Generate Outline
              </md-filled-button>`
            : html`<md-filled-tonal-button
                      @click=${this.generateOutline}
                      ?disabled=${this.isLoading}>
                      Regenerate Outline
                  </md-filled-tonal-button>
                  <md-filled-button
                      ?disabled=${this.isLoading}
                      @click=${this.saveNewDIYInfo}
                      href="/loading">
                      Confirm Outline
                  </md-filled-button>`;
    }

    private hideOutlineEditor() {
        this.showOutline = false;
    }

    protected renderBackButton(): TemplateResult {
        const onBackClick = () => {
            this.initializationService.reset(false);
        };

        return !this.showOutline
            ? html` <md-text-button
                  @click=${onBackClick}
                  href="/"
                  >Back</md-text-button
              >`
            : html`<md-text-button @click=${this.hideOutlineEditor}>
                  Back
              </md-text-button>`;
    }

    protected renderButtonBar(): TemplateResult {
        return html`
            <div class="bottom-bar">
                ${this.renderBackButton()}
                <div>
                    ${this.renderResetOrLoader()} ${this.renderActionButtons()}
                </div>
            </div>
        `;
    }

    protected renderOutlineEditor() {
        return !this.showOutline
            ? html``
            : html`<outline-editor
                  .outline=${this.generatedOutline}
                  ?disabled=${this.isLoading}></outline-editor>`;
    }
    protected render(): TemplateResult {
        return html`
            <div id="new-diy-wrapper">
                <div class="new-diy">
                    <h1>Start a new DIY Tutorial</h1>
                    ${this.renderDescriptionAndPrompt()}
                    ${this.renderOutlineEditor()} ${this.outlineTask()}
                    ${this.renderButtonBar()}
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "diymate-new-diy": NewDIYPage;
    }
}
