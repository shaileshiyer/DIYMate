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
    $isRangeSelection,
    $isTextNode,
    $setSelection,
    COMMAND_PRIORITY_NORMAL,
    DELETE_CHARACTER_COMMAND,
    ElementNode,
    KEY_ENTER_COMMAND,
    LexicalNode,
    ParagraphNode,
    Point,
    RangeSelection,
    RootNode,
    SELECTION_CHANGE_COMMAND,
    TextNode,
} from "lexical";
import { $normalizeSelection } from "lexical/LexicalNormalization";
import { $isAtNodeEnd, $patchStyleText } from "@lexical/selection";
import { $isHeadingNode } from "@lexical/rich-text";
import { parseSentences, isWhitespaceOnly } from "@lib/parse_sentences";
import {
    $setBlocksType,
    $wrapNodesImpl,
} from "@lexical/selection/range-selection";
import { $applyTransforms } from "lexical/LexicalUpdates";
import {
    $createMarkNode,
    $getMarkIDs,
    $unwrapMarkNode,
    $wrapSelectionInMarkNode,
    MarkNode,
} from "@lexical/mark";
import { $convertToMarkdownString } from "@lexical/markdown";

interface ServiceProvider {
    textEditorService: TextEditorService;
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
    textContentSize: number;
}

export interface CursorOffset{
    key:string;
    offset:number;
}

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
        });
    }

    get textEditorService() {
        return this.serviceProvider.textEditorService;
    }

    selectedText: string = "";
    preText: string = "";
    postText: string = "";
    /**
     * Stores the node type of the parent.
     * Since by default the text content is in a child TextNode.
     */
    currentNode: CurrentLexicalNode = {
        key: "",
        type: "",
        textContent: "",
        textContentSize: 0,
    };
    selection: RangeSelection = $createRangeSelection();
    anchorNode: TextNode | null = null;
    focusNode: TextNode | null = null;

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

        const node: LexicalNode = selection.anchor.getNode();
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

        if ($isHeadingNode(parent)) {
            elementType = `${parent.getType()}-${parent.getTag()}`;
        }
        // console.debug(parseSentences(parent.getTextContent()));
        // const elementType = parent?.getType() === 'heading'? `${parent.getType()}-${parent.getTag()?? ''}`:parent?.getType();
        this.currentNode = {
            key: node.getKey() ?? "",
            type: elementType,
            textContent: node.getTextContent() ?? "",
            textContentSize: node.getTextContentSize() ?? 0,
        };

        // console.debug(node.getParent());
    }

    previousSelection: RangeSelection = $createRangeSelection();
    registerCursorListeners(): (() => void)[] {
        return [
            this.textEditorService.getEditor.registerMutationListener(
                ParagraphNode,
                (mutatedNodes) => {
                    for (let [nodeKey, mutation] of mutatedNodes) {
                        console.log('paragraph',nodeKey, mutation);
                    }
                }
            ),
            this.textEditorService.getEditor.registerMutationListener(
                TextNode,
                (mutatedNodes) => {
                    for (let [nodeKey, mutation] of mutatedNodes) {
                        console.log(nodeKey, mutation);
                        this.textEditorService.getEditor.update(() => {
                            const textNode: TextNode = $getNodeByKey(nodeKey)!;
                            if (!textNode) {
                                return;
                            }

                            const textString = textNode.getTextContent();
                            const sentences = parseSentences(textString);
                            console.debug(sentences);
                            if (
                                (mutation === "created" ||
                                    mutation === "updated") &&
                                sentences.length > 1
                            ) {
                                textNode.toggleUnmergeable();
                                let val = 0;
                                const charOffsets = sentences.map(
                                    (sentence) => {
                                        val += sentence.length;
                                        return val;
                                    }
                                );
                                textNode.setStyle("");
                                textNode.splitText(...charOffsets);
                            }
                        });
                    }
                }
            ),
            this.textEditorService.getEditor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                () => {
                    const prevSelection = $getPreviousSelection();
                    const selection = $getSelection();
                    if (
                        !$isRangeSelection(selection) ||
                        !$isRangeSelection(prevSelection)
                    ) {
                        return false;
                    }
                    const currentNode: LexicalNode = selection.anchor.getNode();
                    if (!selection.isCollapsed()) {
                        if ($isTextNode(currentNode)) {
                            currentNode.setStyle("");
                        }
                    }
                    if (selection.isCollapsed()) {
                        const style =
                            "color:var(--md-sys-color-primary);font-weight:600;";
                        if (
                            $isTextNode(currentNode) &&
                            currentNode.getStyle() === ""
                        ) {
                            currentNode.setStyle(style);
                        }
                    }
                    if (prevSelection !== null) {
                        const prevNode: LexicalNode =
                            prevSelection.anchor.getNode();
                        if (
                            $isTextNode(prevNode) &&
                            !prevNode.is(currentNode) &&
                            prevNode.getStyle() !== ""
                        ) {
                            prevNode.setStyle("");
                        }
                    }
                    return false;
                },
                COMMAND_PRIORITY_NORMAL
            ),
            this.textEditorService.getEditor.registerCommand(
                KEY_ENTER_COMMAND,
                () => {
                    const selection = $getPreviousSelection();
                    if (
                        selection === null ||
                        !$isRangeSelection(selection) ||
                        !selection.isCollapsed()
                    ) {
                        return false;
                    }
                    const currentNode: LexicalNode = selection.anchor.getNode();
                    if (
                        $isTextNode(currentNode) &&
                        currentNode.getStyle() !== ""
                    ) {
                        currentNode.setStyle("");
                    }
                    return false;
                },
                COMMAND_PRIORITY_NORMAL
            ),
            this.textEditorService.getEditor.registerCommand(
                DELETE_CHARACTER_COMMAND,
                (isBackward) => {
                    const selection = $getSelection();
                    if (
                        selection === null ||
                        !$isRangeSelection(selection) ||
                        !selection.isCollapsed()
                    ) {
                        return false;
                    }
                    const originalSelection = selection.clone();
                    selection.modify("extend", isBackward, "character");
                    let character = selection.getTextContent();
                    character = character.trimStart().trimEnd();
                    console.debug(character);
                    if (
                        character === "." ||
                        character === "?" ||
                        character === "!"
                    ) {
                        const anchorNode: LexicalNode =
                            selection.anchor.getNode();

                        const focusNode = anchorNode.getNextSibling();
                        if (
                            $isTextNode(anchorNode) &&
                            $isTextNode(focusNode) &&
                            !anchorNode.is(focusNode)
                        ) {
                            anchorNode.mergeWithSibling(focusNode);
                            anchorNode.setStyle("");
                        }
                    }
                    return false;
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

    makeSelectionFromSerializedLexicalRange(
        serializedRange: SerializedLexicalRange|null
    ) {
        if (serializedRange === null) return $createRangeSelection();
        const { anchor, focus } = serializedRange;
        const selection = $createRangeSelection();
        const anchorNode = $getNodeByKey(anchor.key);
        
        const focusNode = $getNodeByKey(focus.key);
        if ($isTextNode(anchorNode) && $isTextNode(focusNode)) {
            selection.setTextNodeRange(
                anchorNode,
                anchor.offset,
                focusNode,
                focus.offset
            );
        }
        return selection;
    }

    // Get cursor offset in parent node
    get cursorOffset():CursorOffset{
        if (this.isCursorCollapsed){
            let cursorOffset:CursorOffset = {key:this.serializedRange.anchor.key,offset:this.serializedRange.anchor.offset};
            this.textEditorService.getEditor.getEditorState().read(()=>{
                const selection = $getSelection();
                if (!$isRangeSelection(selection)){
                    return;
                }
                const node:LexicalNode|null = selection.anchor.getNode();
                if (!node){
                    return;
                }
                const parent:LexicalNode|null = node.getParent();
                const previousSiblings = node.getPreviousSiblings();
                for (let sibling of previousSiblings){
                    cursorOffset.offset +=sibling.getTextContentSize();
                }
                cursorOffset.key = parent?.getKey()?? this.serializedRange.anchor.key;
                
            })
            return cursorOffset;    
        }
        return {key:this.serializedRange.anchor.key,offset:0};
    }

    get isCursorCollapsed() {
        return (
            this.serializedRange.anchor.offset ===
            this.serializedRange.focus.offset
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
        if (this.isCursorCollapsed) {
            return (
                this.serializedRange.anchor.key === this.currentNode.key &&
                this.serializedRange.anchor.offset ===
                    this.currentNode.textContentSize
            );
        }
        return false;
    }

    get isCursorAtStartOfNode() {
        if (this.isCursorCollapsed) {
            return (
                this.serializedRange.anchor.key === this.currentNode.key &&
                this.serializedRange.anchor.offset === 0
            );
        }
        return false;
    }

    get isCursorinMiddle(){
        const {
            isCursorCollapsed,
            isCurrentNodeEmpty,
            isCursorAtEndOfNode,
            isCursorAtStartOfNode,
        } = this;
        if (!isCursorCollapsed || isCurrentNodeEmpty){
            return false;
        }
        return !isCursorAtStartOfNode && !isCursorAtEndOfNode;
    }

    get isCurrentNodeEmpty(){
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
