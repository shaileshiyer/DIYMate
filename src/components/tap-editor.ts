import { MobxLitElement } from "@adobe/lit-mobx";
import { Editor, NodePos } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { LitElement, PropertyValueMap, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { HighlightMark } from "../lib/tiptap";

@customElement('tap-editor')
export class TapEditor extends MobxLitElement {

    static override get styles(){
        const styles = css`
            .marked {
                background-color:unset;
                color: var(--md-sys-color-primary);
                font-weight: 700;
            }

            .tap-container {
                display: flex;
                flex-direction: column;
                justify-content: start;
                max-width: 700px;
                width: 100%;
                margin: 2em auto;
                padding: 2em auto;
            }
            .tapeditor {                
                background-color: var(--md-sys-color-surface-container-highest);
                width: 100%;
                padding: 0 1em;
                min-height: 500px;
                max-height: 600px;
                border-bottom:1px solid var(--md-sys-color-scrim);
                overflow-y: scroll;
            }


            .tapeditor:focus{
                outline:none;
                border-bottom: 3px solid var(--md-sys-color-primary);
            }

            .disabled {
                opacity: 0.38;
            }

        `
        return [styles];
    }
    editor!:Editor;
    protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        const element = this.shadowRoot?.querySelector('#teditor');
        if (element){
            this.editor = new Editor({
                element: element,
                extensions:[
                    StarterKit.configure({
                        heading:{
                            levels:[1,2,3],
                        },
                        bold:{
                            HTMLAttributes:{
                                class:'marked'
                            }
                        }
                    }),
                    HighlightMark.configure({
                        class:'marked',
                    })
                ],
                content: '<p> Test Content...</p>',
                injectCSS:false,
                onUpdate({editor}){
                    console.debug('onUpdate')
                    console.debug(editor.getHTML());
                    console.debug(editor.getText());
                },
                editorProps:{
                    attributes:{
                        class:'tapeditor'
                    }
                }

            });

            this.editor.on('selectionUpdate',({editor,transaction})=>{
                console.debug('selection-update');
                console.debug(transaction.selection.$anchor,transaction.selection.$from,transaction.selection.$to);

                console.debug(editor.$doc);

                if (editor.state.selection.from === editor.state.selection.to){
                if (transaction.selection.anchor === 20 ){
                    const $myCustomPos = editor.$pos(20);
                    // const $customPosEnd = editor.$pos(30);
                    const $customPosEnd = editor.$pos(30);
                    console.debug($myCustomPos.textContent,$customPosEnd);

                    // const selectedText = $myCustomPos.content.cut(20,30);
                    // const content = "<span class='marked'> this is a new inserted text</span>"
                    // editor.commands.insertContentAt({from:20,to:30},content,{updateSelection:false,parseOptions:{}});

                    editor
                        .chain()
                        .setTextSelection({from:20,to:30})
                        .setMark("bold",{class:'marked'})
                        .setTextSelection(transaction.selection.anchor)
                        .run();
                    // console.debug()   
                } else if (transaction.selection.anchor === 30) {
                    editor
                        .chain()
                        .setTextSelection({from:20,to:30})
                        .unsetMark("bold")
                        .setTextSelection(transaction.selection.anchor)
                        .run();
                }}
            })
        }

    }

    connectedCallback(): void {
        super.connectedCallback();
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        this.editor.destroy();
    }

    render(){
        return html`<div class="outer-container">
            <div id="teditor" class="tapcontainer"></div>
        </div>`
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'tap-editor': TapEditor;
    }
}