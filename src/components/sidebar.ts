import { MobxLitElement } from "@adobe/lit-mobx";
import { diymateCore } from "@core/diymate_core";
import { CursorService } from "@core/services/cursor_service";
import { SentencesService } from "@core/services/sentences_service";
import { TextEditorService } from "@core/services/text_editor_service";
import { LitElement, PropertyValueMap, TemplateResult, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import '@material/web/tabs/primary-tab';
import '@material/web/tabs/secondary-tab';
import '@material/web/tabs/tabs';
import '@material/web/icon/icon';

import './chat';


@customElement("diymate-editor-sidebar")
export class DIYMateEditorSidebar extends MobxLitElement {

    private cursorService = diymateCore.getService(CursorService);
    private textEditorService = diymateCore.getService(TextEditorService);
    private sentencesService = diymateCore.getService(SentencesService);

    @property({type:Number})
    private activeTab:number = 1;

    protected firstUpdated(
        _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
    ): void {}
    connectedCallback(): void {
        super.connectedCallback();
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
    }

    protected renderDebug(){
        return html`<div id="debug-wrappper">
        <h1>Sidebar Wrapper</h1>
        <p>Selected Text: ${this.cursorService.selectedText}</p>
        <!-- <p>Pre Text: ${this.cursorService.preText}</p>
        <p>Post Text: ${this.cursorService.postText}</p> -->
        <p>Current Node: ${JSON.stringify(this.cursorService.currentNode)}</p>
        <p>serializedRange: ${JSON.stringify(this.cursorService.serializedRange)}</p>
        <p>cursorOffset:${JSON.stringify(this.cursorService.cursorOffset)}</p>
        <p>isCursorCollapsed: ${this.cursorService.isCursorCollapsed}</p>
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
        
        </div>
        <p>currentSentence: ${this.sentencesService.currentSentence} </p>
        <p>cursorSpan: ${JSON.stringify(this.sentencesService.cursorSpan)} </p>
        <p>currentSentenceIndex: ${this.sentencesService.currentSentenceIndex} </p>
        <p>currentSentenceSerializedRange: ${JSON.stringify(this.sentencesService.currentSentenceSerializedRange)} </p>
        <p>currentSentenceRange: ${this.sentencesService.getCurrentSentenceRange()} </p>
        <p>nextSentenceOffset: ${this.sentencesService.nextSentenceOffset} </p>
        <p>isCursorBetweenSentences: ${this.sentencesService.isCursorBetweenSentences} </p>
        <p>isCursorinMiddleOfSentence: ${this.sentencesService.isCursorWithinSentence} </p>
        <p>isCursorAtParagraphStart: ${this.cursorService.isCursorAtStartOfNode} </p>
        <p>isCursorAtParagraphEnd: ${this.cursorService.isCursorAtEndOfNode} </p>
        </div>
        `;
    }

    static override get styles() {
        const styles = css`
            #editor-sidebar-wrapper {
                width:100%;
                height:100%;
                display:flex;
                flex-direction:column;
                padding:3px;
                margin:2px;
            }

            #sidebar-content{
                justify-content: space-around;
                height:55em;
                overflow:auto;
                /* overflow-y: scroll; */
                /* min-height:100%; */
            }

            #sidebar-content::-webkit-scrollbar{
                display:none;
            }

        `;

        return [styles];
    }

    private setActiveIndex(index:number){
        this.activeTab = index;
    }

    private renderSidebarContent(): TemplateResult {
        
        switch(this.activeTab){
            case 0: return html`Controls`;
            case 1: return html`<diymate-chat></diymate-chat>`;
            case 2: return html`${this.renderDebug()}`;
        }
        
        return html``;
    }

    protected render(): TemplateResult {
        return html`
        <div id="editor-sidebar-wrapper">
            <div id="sidebar">
                <md-tabs active-tab-index=${this.activeTab} @change=${(event)=> this.setActiveIndex(event.target.activeTabIndex)}>
                    <md-secondary-tab> Controls</md-secondary-tab>
                    <md-secondary-tab> Chat </md-secondary-tab>
                    <md-secondary-tab> Debug </md-secondary-tab>
                </md-tabs>
                <div id="sidebar-content">
                    
                        ${this.renderSidebarContent()}
                    
                </div>
            </div>

        </div>
        `
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "diymate-editor-sidebar": DIYMateEditorSidebar;
    }
}
