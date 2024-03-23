import { EditorOptions, Extension, Mark, Node, mergeAttributes } from "@tiptap/core";
import ListKeymap from "@tiptap/extension-list-keymap";
import StarterKit from "@tiptap/starter-kit";

import { css } from "lit";
import { CustomHistory } from "./customHistory";

export const tipTapStyles = css`
    .marked {
        background-color:unset;
        color: var(--md-sys-color-primary);
        font-weight: 700;
    }

    .loading-atom{
        background-color:var(--md-sys-color-primary);
        color:var(--md-sys-color-on-primary);
    }
    .choice-atom {
        background-color:var(--md-sys-color-inverse-primary);
        color:var(--md-sys-color-on-primary-fixed);
    }
    .selection-mark{
        
    }
    h1::before{
        content:'# ';
    }

    h2::before{
        content:'## ';
    }
    h3::before{
        content:'### ';
    }
`;


export const HighlightMark = Mark.create({
    name: "highlight-mark",
    group: "basic",

    parseHTML() {
        return [{
            tag: `mark[data-type="${this.name}"]`, 
        }];
    },
    renderHTML({ HTMLAttributes }) {
        HTMLAttributes["class"];
        return [
            "mark",
            mergeAttributes(this.options.HTMLAttributes,
                {
                    'data-type':this.name,
                    'class':'marked'
                }, 
                HTMLAttributes),
            0,
        ];
    },
});

export const LoadingAtom = Node.create({
    name: "loading-atom",
    atom: true,
    group: "inline",
    // content: "empty",
    inline:true,
    draggable: false,
    selectable:false,
    parseHTML() {
        return [
            {
                tag: `span[data-type="${this.name}"]`,
            },
        ];
    },
    renderHTML({HTMLAttributes,node}){
        return[
            'span',
            mergeAttributes({
                'data-type':this.name,
                'class':'loading-atom'
            },
            HTMLAttributes,
            ),
            '  Loading...  '
        ]
    },
});

export const ChoiceAtom = Node.create({
    name: "choice-atom",
    atom: true,
    group: "inline",
    content: "block*",
    inline:true,
    draggable: false,
    addAttributes(){
        return {
            ...this.parent?.(),
            value:{
                default:'<p>Choice Atom</p>',
            }
        }
    },
    parseHTML() {
        return [
            {
                tag: `div[data-type="${this.name}"]`,
            },
        ];
    },
    renderHTML({HTMLAttributes,node}){
        return[
            'div',
            mergeAttributes({
                'data-type':this.name,
                'class':'choice-atom'
            },
            HTMLAttributes,
            ),
            0,
        ]
    },
});

export const ChoiceTextAtom = Node.create({
    name: "choice-text-atom",
    atom: true,
    group: "inline",
    content: "inline*",
    inline:true,
    draggable: false,
    addAttributes(){
        return {
            ...this.parent?.(),
            value:{
                default:'Choice Atom',
            }
        }
    },
    parseHTML() {
        return [
            {
                tag: `span[data-type="${this.name}"]`,
            },
        ];
    },
    renderHTML({HTMLAttributes,node}){
        return[
            'span',
            mergeAttributes({
                'data-type':this.name,
                'class':'choice-atom'
            },
            HTMLAttributes,
            ),
            0,
        ]
    },
});

export const SelectionTextMark = Mark.create({
    name: "selection-mark",
    parseHTML() {
        return [
            {
                tag: `mark[data-type="${this.name}"]`,
            },
        ];
    },
    renderHTML({HTMLAttributes}){
        return[
            'mark',
            mergeAttributes({
                'data-type':this.name,
                'class':'selection-mark'
            },
            HTMLAttributes,
            ),
            0,
        ]
    },
});


export const OperationKeyEvents = Extension.create({
    name:'operationKeyEvents',
    addStorage(){
        return{
            j:()=>{console.warn('default')},
            k:()=>{console.warn('default')},
            l:()=>{console.warn('default')},
            u:()=>{console.warn('default')},
            i:()=>{console.warn('default')},
            o:()=>{console.warn('default')},
            p:()=>{console.warn('default')},
            h:()=>{console.warn('default')},
            n:()=>{console.warn('default')},
            m:()=>{console.warn('default')},
        }
    },
    addKeyboardShortcuts() {
        return{
            'Alt-j': ()=> this.storage.j(),
            'Alt-k': ()=> this.storage.k(),
            'Alt-l': ()=> this.storage.l(),
            'Alt-u': ()=> this.storage.u(),
            'Alt-i': ()=> this.storage.i(),
            'Alt-o': ()=> this.storage.o(),
            'Alt-p': ()=> this.storage.p(),
            'Alt-h': ()=> this.storage.h(),
            'Alt-n': ()=> this.storage.n(),
            'Alt-m': ()=> this.storage.m(),
        };
    },

});



export function getEditorConfig(element:Element|undefined):Partial<EditorOptions>{
    return {
        element: element,
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
                // history:false,
            }),
            // StarterKit.configure({

            // }),
            HighlightMark.configure({
                class: "marked",
            }),
            // CustomHistory,
            ListKeymap,
            LoadingAtom,
            ChoiceAtom,
            ChoiceTextAtom,
            SelectionTextMark,
            OperationKeyEvents,
        ],
        content: "<p> Start writing your DIY...</p>",
        injectCSS: false,
        editorProps: {
            attributes: {
                class: "tap-editor",
            },
        },
    }
}