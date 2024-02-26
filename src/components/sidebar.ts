import { MobxLitElement } from "@adobe/lit-mobx";
import { diymateCore } from "@core/diymate_core";
import { CursorService } from "@core/services/cursor_service";
import { SentencesService } from "@core/services/sentences_service";
import { TextEditorService } from "@core/services/text_editor_service";
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
    private textEditorService = diymateCore.getService(TextEditorService);
    private sentencesService = diymateCore.getService(SentencesService);

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
            <!-- <p>Pre Text: ${this.cursorService.preText}</p>
            <p>Post Text: ${this.cursorService.postText}</p> -->
            <p>Current Node: ${JSON.stringify(this.cursorService.currentNode)}</p>
            <p>serializedRange: ${JSON.stringify(this.cursorService.serializedRange)}</p>
            <p>cursorOffset:${JSON.stringify(this.cursorService.cursorOffset)}</p>
            <!-- <p>isCursorCollapsed: ${this.cursorService.isCursorCollapsed}</p>
            <p>isCursorSelection: ${this.cursorService.isCursorSelection}</p>
            <p>isCursorinSameNode: ${this.cursorService.isCursorInSingleNode}</p>
            <p>isCursorAtStartOfNode: ${this.cursorService.isCursorAtStartOfNode}</p>
            <p>isCursorAtEndOfNode: ${this.cursorService.isCursorAtEndOfNode}</p>
            <p>isCursorinMiddle: <b>${this.cursorService.isCursorinMiddle}</b></p>
            <p>isCursorAtStartOfDocument: ${this.cursorService.isCursorAtStartOfText}</p>
            <p>isCursorAtEndOfDocument: ${this.cursorService.isCursorAtEndOfText}</p>
            <p>Plain Text:</p> 
            <md-filled-text-field
                    style="width:100%;"
                    type="textarea"
                    name="plain-text"
                    placeholder="PlainText"
                    .value=${this.textEditorService.plainText}
                    rows="20"
                    spellcheck="false"></md-filled-text-field>
            
            </div> -->
            <p>currentSentence: ${this.sentencesService.currentSentence} </p>
            <p>cursorSpan: ${JSON.stringify(this.sentencesService.cursorSpan)} </p>
            <p>currentSentenceIndex: ${this.sentencesService.currentSentenceIndex} </p>
            <p>currentSentenceSerializedRange: ${JSON.stringify(this.sentencesService.currentSentenceSerializedRange)} </p>
            <p>nextSentenceOffset: ${this.sentencesService.nextSentenceOffset} </p>
            <p>isCursorBetweenSentences: ${this.sentencesService.isCursorBetweenSentences} </p>
            <p>isCursorinMiddleOfSentence: ${this.sentencesService.isCursorWithinSentence} </p>
            <p>isCursorAtParagraphStart: ${this.cursorService.isCursorAtStartOfNode} </p>
            <p>isCursorAtParagraphEnd: ${this.cursorService.isCursorAtEndOfNode} </p>
            
            `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "diymate-editor-sidebar": DIYMateEditorSidebar;
    }
}
