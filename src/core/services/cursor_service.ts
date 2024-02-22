import { action, makeObservable, observable } from "mobx";
import { Service } from "./service";
import { TextEditorService } from "./text_editor_service";
import { $createRangeSelection, $getSelection, $isRangeSelection, LexicalNode, Point, RangeSelection } from "lexical";

interface ServiceProvider {
    textEditorService:TextEditorService,
}

export class CursorService extends Service {
    constructor(private readonly serviceProvider:ServiceProvider){
        super();
        makeObservable(this,{
            selection:observable,
            selectedText:observable,
            currentNode:observable,
            preText:observable,
            postText:observable,
            cursorUpdate:action,
        });
    }

    get textEditorService(){
        return this.serviceProvider.textEditorService;
    }


    selectedText:string = '';
    preText:string = '';
    postText:string = '';
    /**
     * Stores the node type of the parent. 
     * Since by default the text content is in a child TextNode.
     */
    currentNode:string|null = null;
    selection:RangeSelection|null = null;

    cursorUpdate():void{
        const selection = $getSelection();
        if (!$isRangeSelection(selection)){
                return;
        }
        this.selection = selection;
        console.debug(selection);
        this.selectedText = selection.getTextContent();
        const [head,tail] = selection.getStartEndPoints()!;



        const node:LexicalNode = selection.anchor.getNode();
        const textContent = node.getTextContent();
        const maxLength = node.getTextContentSize();        
        const preTextSelection = textContent.substring(0,head.offset);
        const postTextSelection = textContent.substring(tail.offset,maxLength);
        
        this.preText = preTextSelection;
        this.postText = postTextSelection;
        // Get the parent node type
        this.currentNode = node.getParent().getType()?? '';
        // console.debug(node.getParent());
        
    }

    get isCursorCollapsed(){
        return this.selection!.isCollapsed();
    }

}