import { CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { MarkNode } from "@lexical/mark";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { CreateEditorArgs } from "lexical";


export interface LexicalConfig {
    root: HTMLElement | null;
    editorConfig: CreateEditorArgs;
}


export function getLexicalConfig(editorRoot:HTMLElement|null,namespace:string):LexicalConfig{
    return {
        root: editorRoot,
        editorConfig: {
            namespace,
            onError: console.error,
            nodes: [
                HeadingNode,
                QuoteNode,
                LinkNode,
                ListNode,
                ListItemNode,
                CodeNode,
                MarkNode,
            ],
            editable: true,
        },
    };
}