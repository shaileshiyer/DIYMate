import { CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { MarkNode } from "@lexical/mark";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { CreateEditorArgs, EditorConfig, LexicalEditor, LexicalNode, TextNode } from "lexical";


export interface LexicalConfig {
    root: HTMLElement | null;
    editorConfig: CreateEditorArgs;
}

export class LoadingNode extends TextNode{
    __background:string = 'var(--md-sys-color-primary)';
    __color:string = 'var(--md-sys-color-on-primary)';

    static getType(): string {
        return 'loading';    
    }

    static clone(node: LoadingNode): LoadingNode {
        return new LoadingNode(node.__key);
    }

    createDOM(config: EditorConfig, editor?: LexicalEditor | undefined): HTMLElement {
        const element = super.createDOM(config);
        element.style.background = this.__background ;
        element.style.color = this.__color ;
        return element;
    }

    updateDOM(
        prevNode: LoadingNode,
        dom: HTMLElement,
        config: EditorConfig,
      ): boolean {
        const isUpdated = super.updateDOM(prevNode, dom, config);
        if (prevNode.__background !== this.__background) {
          dom.style.background = this.__background;
        }
        return isUpdated;
      }

    
}

export function $createLoadingNode():LoadingNode{
    return new LoadingNode('Loading...');
}

export function $isLoadingNode(node:LexicalNode | null | undefined): node is LoadingNode{
    return node instanceof LoadingNode
}


export class ChoiceNode extends TextNode{
    static getType(): string {
        return 'choice';    
    }

    static clone(node: ChoiceNode): ChoiceNode {
        return new ChoiceNode(node.__key);
    }

    createDOM(config: EditorConfig, editor?: LexicalEditor | undefined): HTMLElement {
        const element = super.createDOM(config);
        return element;
    }

    updateDOM(
        prevNode: ChoiceNode,
        dom: HTMLElement,
        config: EditorConfig,
      ): boolean {
        return super.updateDOM(prevNode,dom,config);
      }
}

export function $createChoiceNode(text:string):ChoiceNode{
    return new ChoiceNode(text);
}

export function $isChoiceNode(node:LexicalNode | null | undefined): node is ChoiceNode{
    return node instanceof ChoiceNode
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
                LoadingNode,
                ChoiceNode,
            ],
            editable: true,
        },
    };
}