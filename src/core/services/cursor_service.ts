import { action, computed, makeObservable, observable } from "mobx";
import { Service } from "./service";
import { TextEditorService } from "./text_editor_service";
import {
    $applyNodeReplacement,
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
import { $isListItemNode } from "@lexical/list";
import { $createOffsetView, OffsetView } from "@lexical/offset";

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
            selectedText: observable,
            currentNode: observable,
            preText: observable,
            postText: observable,
            cursorUpdate: action,
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

    selectedText: string = "";
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

        this.selectedText = selection.getTextContent();
        const [head, tail] = $getCharacterOffsets(selection);

        const node: LexicalNode = selection.focus.getNode();
        const textContent = node.getTextContent();
        const maxLength = node.getTextContentSize();

        const previousTextNodes = node.getPreviousSiblings();

        let preTextSelection = "";
        previousTextNodes.map(
            (prevNode) => (preTextSelection += prevNode.getTextContent())
        );

        preTextSelection += textContent.substring(0, head);

        const postTextNodes = node.getNextSiblings();
        let postTextSelection = textContent.substring(tail, maxLength);

        postTextNodes.map(
            (postNode) => (postTextSelection += postNode.getTextContent())
        );

        this.preText = preTextSelection;
        this.postText = postTextSelection;
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
