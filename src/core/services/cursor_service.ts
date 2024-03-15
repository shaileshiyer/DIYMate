import { action, computed, makeObservable, observable } from "mobx";
import { Service } from "./service";
import { TextEditorService } from "./text_editor_service";
import {
    $applyNodeReplacement,
    $createNodeSelection,
    $createPoint,
    $createRangeSelection,
    $createTextNode,
    $getCharacterOffsets,
    $getNodeByKey,
    $getPreviousSelection,
    $getRoot,
    $getSelection,
    $isElementNode,
    $isRangeSelection,
    $isRootNode,
    $isTextNode,
    $normalizeSelection__EXPERIMENTAL,
    $setSelection,
    COMMAND_PRIORITY_NORMAL,
    DELETE_CHARACTER_COMMAND,
    ElementNode,
    KEY_ENTER_COMMAND,
    LexicalCommand,
    LexicalNode,
    ParagraphNode,
    Point,
    PointType,
    RangeSelection,
    RootNode,
    SELECTION_CHANGE_COMMAND,
    TextNode,
    createCommand,
} from "lexical";
import { $isHeadingNode, HeadingNode } from "@lexical/rich-text";
import { parseSentences } from "@lib/parse_sentences";

import { SentencesService } from "./sentences_service";
import { $getNearestNodeOfType } from "@lexical/utils";
import { $isListItemNode, ListItemNode, ListNode } from "@lexical/list";
import { $createOffsetView, OffsetView } from "@lexical/offset";
import { $convertToMarkdownString, ELEMENT_TRANSFORMERS, HEADING, TEXT_FORMAT_TRANSFORMERS, TRANSFORMERS } from "@lexical/markdown";

interface ServiceProvider {
    textEditorService: TextEditorService;
    sentencesService: SentencesService;
}

export interface SerializedLexicalRange {
    anchor: { key: string; offset: number; type: "text" | "element" };
    focus: { key: string; offset: number; type: "text" | "element" };
    isBackward: boolean;
}

export interface CurrentLexicalNode {
    type: string;
    textContent: string;
    key: string;
    parentKey:string;
    parentOffset:number;

    textContentSize: number;
}

export interface CursorOffset {
    key: string;
    offset: number;
}

const HIGHLIGHT_CURRENT_SENTENCE:LexicalCommand<string> = createCommand();

export class CursorService extends Service {
    constructor(private readonly serviceProvider: ServiceProvider) {
        super();
        makeObservable(this, {
            selection: observable,
            currentNode: observable,
            selectedText: observable,
            selectedNodesMarkdownText:observable,
            selectedNodeKeys: observable,
            preText: observable,
            postText: observable,
            cursorUpdate: action,
            setCursorTextContext:action,
            serializedRange: observable,
            setSerializedRange: action,
            isCursorCollapsed: computed,
            isCursorAtEndOfNode: computed,
            isCursorAtStartOfNode: computed,
            isCursorSelection: computed,
            isCursorInSingleNode: computed,
            isCursorAtStartOfText: computed,
            isCursorAtEndOfText: computed,
            cursorOffset:computed,
        });
    }

    get textEditorService() {
        return this.serviceProvider.textEditorService;
    }

    get sentenceService() {
        return this.serviceProvider.sentencesService;
    }

    // plain text
    selectedText: string = "";
    // Gives the markdown text for the selected Element nodes.
    selectedNodesMarkdownText:string = "";
    // Saves the keys of selectedNodes 
    selectedNodeKeys:string[] = [];
    preText: string = "";
    postText: string = "";
    /**
     * Stores the node type of the parent.
     * Since by default the text content is in a child TextNode.
     */
    currentNode: CurrentLexicalNode = {
        parentKey:"",
        key: "",
        type: "",
        textContent: "",
        parentOffset: 0,
        textContentSize: 0,
    };
    selection: RangeSelection = $createRangeSelection();
    anchorNode: TextNode | null = null;
    focusNode: TextNode | null = null;
    previousHeadingSiblings: HeadingNode[] = []
    nextHeadingSiblings:HeadingNode[] = []

    cursorUpdate(): void {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
            return;
        }

        // Get new selection.
        this.selection = selection.clone();
        this.setSerializedRange(
            this.makeSerializedLexicalRangeFromSelection(selection)
        );

        this.setCursorTextContext(selection);

        const node: LexicalNode = selection.focus.getNode();

        // Get the parent node type
        const parent: ElementNode | null = node.getParent();

        if (!parent) {
            return;
        }
        let elementType = parent?.getType() ?? "";

        let headingParent = node.getTopLevelElement();
        if ($isListItemNode(headingParent)){
            headingParent = parent.getTopLevelElement();
        } else if (headingParent === null){
            headingParent = node;
        }
        
        this.previousHeadingSiblings = headingParent.getPreviousSiblings().filter((node:LexicalNode):node is HeadingNode=>$isHeadingNode(node));
        this.nextHeadingSiblings = headingParent.getNextSiblings().filter((node:LexicalNode):node is HeadingNode=>$isHeadingNode(node));



        if ($isHeadingNode(parent)) {
            elementType = `${parent.getType()}-${parent.getTag()}`;
        }

        // Calculate the current offset from parent
        let parentOffset = this.serializedRange.anchor.offset;
        const previousSiblings = node.getPreviousSiblings();
        for (let sibling of previousSiblings) {
            parentOffset += sibling.getTextContentSize();
        }


        this.currentNode = {
            parentKey: parent.getKey()??"",
            key: node.getKey() ?? "",
            type: elementType,
            textContent: node.getTextContent() ?? "",
            textContentSize: node.getTextContentSize() ?? 0,
            parentOffset,
        };

        this.textEditorService.getEditor.dispatchCommand(HIGHLIGHT_CURRENT_SENTENCE,this.currentNode.key);
        // console.debug(node.getParent());
    }

    
    setCursorTextContext(selection:RangeSelection):void{
        // Get start and end points
        const points = selection.getStartEndPoints();
        if (points !== null ) {
            const [startPoint, endPoint ] = points;


                const [head, tail] = $getCharacterOffsets(selection);
    
                const startNode: LexicalNode = startPoint.getNode();
                const startTopLevelNode:LexicalNode = startNode.getTopLevelElement();
                const endNode: LexicalNode = endPoint.getNode();
                const endTopLevelNode:LexicalNode = endNode.getTopLevelElement();
                
                const startTextContent = startNode.getTextContent();
                const endTextContent = endNode.getTextContent();
                const maxLength = endNode.getTextContentSize();
    

                // Get Previous and Next Text in the current Node
                let textBeforeSelection = "";
                const startNodeParent = startNode.getParent();
                if (!$isRootNode(startNodeParent)){
                    const previousTextNodes = startNode.getPreviousSiblings();
    
                    previousTextNodes.map(
                        (prevNode) => (textBeforeSelection += prevNode.getTextContent())
                    );
        
                    textBeforeSelection += startTextContent.substring(0, head);    
                }

                if ($isListItemNode(startNodeParent)){
                    let listTextBeforeSelection = "";
                    const listNode:ListNode|null  = startNodeParent.getParent();
                    const currentItemIndex = startNodeParent.getIndexWithinParent();
                    if (listNode!==null){
                        const listTextItems = listNode.getTextContent().split('\n').filter((value)=> value!=='');
                        const listBeforeSelection = listTextItems.slice(0,currentItemIndex);
                        if (listNode.getListType()==="bullet"){
                            // listTextBeforeSelection = '- ' + listTextBeforeSelection;
                            listBeforeSelection.map(
                                (lnode)=> {listTextBeforeSelection +='- '+ lnode+'\n';}
                            )
                            textBeforeSelection = `${listTextBeforeSelection}- ${textBeforeSelection.trimStart()}`;
                        } else if (listNode.getListType()=== "number"){
                            // listTextBeforeSelection = `${currentItemIndex+1}. ` + listTextBeforeSelection;
                            listBeforeSelection.map(
                                (lnode,index)=> {listTextBeforeSelection += `${index+1}. `+lnode+'\n';}
                            );
                            textBeforeSelection = `${listTextBeforeSelection}${currentItemIndex+1}. ${textBeforeSelection.trimStart()}`;
                        }
                        console.debug('textBeforeSelection:',textBeforeSelection);
                    }

                }
    
                let textAfterSelection = "";
                const endNodeParent = endNode.getParent();
                if (!$isRootNode(endNodeParent)){
                    textAfterSelection = endTextContent.substring(tail, maxLength);
                    const nextTextNodes = endNode.getNextSiblings();
        
                    nextTextNodes.map(
                        (postNode) => (textAfterSelection += postNode.getTextContent())
                    );
                }

                if ($isListItemNode(endNodeParent)){
                    let listTextAfterSelection = "";
                    const listNode:ListNode|null = endNodeParent.getParent();
                    const currentItemIndex = endNodeParent.getIndexWithinParent();
                    if (listNode!==null){
                        const listTextItems = listNode.getTextContent().split('\n').filter((value)=> value!=='');
                        const listAfterSelection = listTextItems.slice(currentItemIndex+1);
                        if (listNode.getListType()==="bullet"){
                            listTextAfterSelection += '\n';
                            listAfterSelection.map(
                                (lnode)=> {listTextAfterSelection += '- '+lnode+'\n';}
                            )
                        } else if (listNode.getListType()=== "number"){
                            listTextAfterSelection +='\n';
                            listAfterSelection.map(
                                (lnode,index)=> {listTextAfterSelection += `${currentItemIndex+index+2}. `+lnode+'\n';}
                            );
                        }

                        textAfterSelection+= listTextAfterSelection.trimEnd();
                        console.debug('textAfterSelection:',textAfterSelection);
                    }
                }
                
                let selectedText = "";
                this.selectedNodesMarkdownText = "";
                this.selectedNodeKeys = [];
                if(!selection.isCollapsed()){
                    let selectionNodes = selection.getNodes().filter((n)=> { return !$isTextNode(n) && !$isListItemNode(n);});
                    // Check to see if the selection focus is at the start of the last node
                    if (selection.focus.offset === 0){
                        selectionNodes = selectionNodes.slice(0,selectionNodes.length-1);
                    }
                    let selectionNodeText = "";
                    for (let selectionNode of selectionNodes){
                        if (selectionNode.isSelected(selection) && !$isTextNode(selectionNode)){
                            selectionNodeText += $convertToMarkdownString(TRANSFORMERS,{getChildren:()=> [selectionNode]} as ElementNode);
                            this.selectedNodeKeys.push(selectionNode.getKey());
                        }
                    }
                    if (selectionNodes.length > 0){
                        // Commenting this out since it is making the selection messy in terms of experience
                        
                        // if (!selection.isBackward()) {
                        //     const lastNode = selectionNodes[selectionNodes.length-1];
                        //     if ($isElementNode(lastNode)){
                        //         const lastDescendant = lastNode.getLastDescendant();
                        //         if (lastDescendant !== null){
                        //             selection.setTextNodeRange(startNode,startPoint.offset,lastDescendant,lastDescendant.getTextContentSize());
                        //             console.debug('lastChildRange',lastDescendant);
                        //         }
                        //     }
                        // } else {
                        //     const firstNode = selectionNodes[0];
                        //     if($isElementNode(firstNode)){
                        //         const firstDescendant = firstNode.getFirstDescendant();
                        //         if (firstDescendant !== null){
                        //             selection.setTextNodeRange(startNode,startPoint.offset,firstDescendant,0);
                        //             console.debug('firstChildRange',firstDescendant);
                        //         }
                        //     }
                        // }
                    }
                    console.debug('selectionNodeText');
                    console.debug(selectionNodeText);
                    this.selectedNodesMarkdownText = selectionNodeText;
                }
                
                // Get Previous and next Content from top Level Node
                // Get Previous Top Level Nodes
                if (startTopLevelNode!== null && endTopLevelNode!== null){
                    let prevMarkDownText = "";
                    let nextMarkdownText = "";
                    

                    const markdownText = $convertToMarkdownString(TRANSFORMERS);
                    const markdownNodes = markdownText.split('\n\n');
                    const startNodeIndex= startTopLevelNode.getIndexWithinParent();
                    const endNodeIndex = endTopLevelNode.getIndexWithinParent();
                    let preNodes = markdownNodes.slice(0,startNodeIndex);
                    let postNodes = markdownNodes.slice(endNodeIndex+1);
                    let selectedNodes = markdownNodes.slice(startNodeIndex,endNodeIndex);
                    
                    preNodes.map((node)=>{ prevMarkDownText+= node+'\n\n';});
                    postNodes.map((node)=>{ nextMarkdownText+= node+'\n\n';});
                    selectedNodes.map(node=>{selectedText += node + '\n\n';})


                    textBeforeSelection = prevMarkDownText + textBeforeSelection;
                    textAfterSelection = textAfterSelection +"\n\n"+ nextMarkdownText;
                }

                this.preText = textBeforeSelection;
                this.postText = textAfterSelection;
                this.selectedText = selection.getTextContent();

        }
    }


    previousSelection: RangeSelection = $createRangeSelection();
    registerCursorListeners(): (() => void)[] {
        return [
             this.textEditorService.getEditor.registerCommand(
                HIGHLIGHT_CURRENT_SENTENCE,
                (currentNodeKey) => {
                    // console.log(currentNodeKey);
                    this.sentenceService.highlightCurrentSentence();
                    return true;
                },
                COMMAND_PRIORITY_NORMAL
            ),

            this.textEditorService.getEditor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                () => {
                    this.cursorUpdate();
                    return true;
                },
                COMMAND_PRIORITY_NORMAL
            ),
        ];
    }

    serializedRange: SerializedLexicalRange = makeEmptyLexicalSerializedRange();

    setSerializedRange(serializedRange: SerializedLexicalRange) {
        this.serializedRange = serializedRange;
    }

    getSerializedRange() {
        return this.serializedRange;
    }

    makeSerializedLexicalRangeFromSelection(selection: RangeSelection) {
        const { anchor, focus } = selection;
        return {
            anchor: {
                key: anchor.key,
                offset: anchor.offset,
                type: anchor.type,
            },
            focus: { key: focus.key, offset: focus.offset, type: focus.type },
            isBackward: selection.isBackward(),
        };
    }


    convertPointtoTextPoint(point:PointType):void{
        try{
            const node:ElementNode = point.getNode();
            const textChildren = node.getChildren();
            let prevOffset = 0;
            for (let textChild of textChildren){
                const childsize = textChild.getTextContentSize();
                if (prevOffset <= point.offset && point.offset<= (prevOffset+childsize)){
                    const calcoffset = point.offset - prevOffset;
                    point.set(textChild.getKey(),calcoffset,'text');
                    break;
                }
                prevOffset+= childsize;
            }
        } catch(err){
            console.error(err);
            console.debug(point);
        }

    }

    makeSelectionFromSerializedLexicalRange(
        serializedRange: SerializedLexicalRange | null
    ) {
        if (serializedRange === null) return $createRangeSelection();
        const { anchor, focus } = serializedRange;

        let selection = $createRangeSelection();

        this.textEditorService.getEditor.getEditorState().read(() => {
            selection.anchor = $createPoint(
                anchor.key,
                anchor.offset,
                anchor.type
            );
            selection.focus = $createPoint(focus.key, focus.offset, focus.type);

            this.convertPointtoTextPoint(selection.anchor);
            this.convertPointtoTextPoint(selection.focus);
            selection = $normalizeSelection__EXPERIMENTAL(selection);
        });
        return selection;
        // const focusNode = $getNodeByKey(focus.key);
        // if ($isTextNode(anchorNode) && $isTextNode(focusNode)) {
        //     selection.setTextNodeRange(
        //         anchorNode,
        //         anchor.offset,
        //         focusNode,
        //         focus.offset
        //     );
        // }
        // return selection;
    }

    // Get cursor offset in parent node
    get cursorOffset(): CursorOffset {
        if (this.isCursorCollapsed) {
            let cursorOffset: CursorOffset = {
                key: this.currentNode.parentKey,
                offset: this.currentNode.parentOffset,
            };
            // this.textEditorService.getEditor.getEditorState().read(() => {
            //     const selection = $getSelection();
            //     if (!$isRangeSelection(selection)) {
            //         return;
            //     }
            //     const node: LexicalNode | null = selection.anchor.getNode();
            //     if (!node) {
            //         return;
            //     }
            //     const parent: LexicalNode | null = node.getParent();
            //     const previousSiblings = node.getPreviousSiblings();
            //     for (let sibling of previousSiblings) {
            //         cursorOffset.offset += sibling.getTextContentSize();
            //     }
            //     // cursorOffset.key =
            //     //     parent?.getKey() ?? this.serializedRange.anchor.key;
            // });
            return cursorOffset;
        }
        return { key: this.currentNode.parentKey, offset: 0 };
    }

    offsetView!: OffsetView; 
    getOffsetRange(){
        let start = 0;
        let end = 0;
        this.textEditorService.getEditor.getEditorState().read(()=>{
            const selection = $getSelection();
            if (!$isRangeSelection(selection)){
                return;
            }
            this.offsetView = $createOffsetView(this.textEditorService.getEditor);
            [start,end] = this.offsetView.getOffsetsFromSelection(selection);
        });
        return {start,end};
    }

    get isCursorCollapsed() {
        return (
            this.serializedRange.anchor.key === this.serializedRange.focus.key &&
            this.serializedRange.anchor.offset === this.serializedRange.focus.offset
        );
    }

    get isCursorSelection() {
        return !this.isCursorCollapsed;
    }

    get isCursorInSingleNode() {
        return (
            this.serializedRange.anchor.key === this.serializedRange.focus.key
        );
    }

    get isCursorAtEndOfNode() {
        return this.isCursorCollapsed && this.sentenceService.isLastCursorSpan;
    }

    get isCursorAtStartOfNode() {
        return this.isCursorCollapsed && this.sentenceService.isFirstCursorSpan;
    }

    get isCursorinMiddle() {
        const {
            isCursorCollapsed,
            isCurrentNodeEmpty,
            isCursorAtEndOfNode,
            isCursorAtStartOfNode,
        } = this;
        if (!isCursorCollapsed || isCurrentNodeEmpty) {
            return false;
        }
        return !isCursorAtStartOfNode && !isCursorAtEndOfNode;
    }

    get isCurrentNodeEmpty() {
        return this.currentNode.textContentSize === 0;
    }

    get isCursorAtStartOfText() {
        if (this.isCursorCollapsed) {
            const firstChild = this.textEditorService.getStartOfDocument();
            if (firstChild !== null) {
                return (
                    this.serializedRange.anchor.key === firstChild.getKey() &&
                    this.isCursorAtStartOfNode
                );
            }
        }
        return false;
    }

    get isCursorAtEndOfText() {
        if (this.isCursorCollapsed) {
            const firstChild = this.textEditorService.getEndOfDocument();
            if (firstChild !== null) {
                return (
                    this.serializedRange.anchor.key === firstChild.getKey() &&
                    this.isCursorAtEndOfNode
                );
            }
        }
        return false;
    }

    get isCursorAtTitle(){
        return this.currentNode.type === 'heading-h1'
    }

    get isCursorInIntroduction(){
        return this.previousHeadingSiblings.length <= 1 && this.currentNode.type !== 'heading-h2';
    }

    get isCursorInConclusion(){
        return this.nextHeadingSiblings.length === 0;
    }

    get isCursorInStep(){
        return (!this.isCursorInIntroduction || this.currentNode.type === 'heading-h2' )&& !this.isCursorInConclusion;
    }

    getPreAndPostSelectionText(): [string, string] {
        return [this.preText, this.postText];
    }
}

function makeEmptyLexicalSerializedRange(): SerializedLexicalRange {
    return {
        anchor: { key: "", offset: 0, type: "text" },
        focus: { key: "", offset: 0, type: "text" },
        isBackward: false,
    };
}
