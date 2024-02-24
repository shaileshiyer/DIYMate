import { action, computed, makeObservable, observable } from "mobx";
import { Service } from "./service";
import { TextEditorService } from "./text_editor_service";
import {
    $applyNodeReplacement,
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

interface SerializedLexicalRange {
    anchor: { key: string; offset: number; type: string };
    focus: { key: string; offset: number; type: string };
    isBackward: boolean;
}

interface CurrentLexicalNode {
    type: string;
    textContent: string;
    key: string;
    textContentSize: number;
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

        let elementType = parent?.getType() ?? "";

        if ($isHeadingNode(parent)) {
            elementType = `${parent.getType()}-${parent.getTag()}`;
        }
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
                TextNode,
                (mutatedNodes) => {
                    for (let [nodeKey, mutation] of mutatedNodes) {
                        console.log(nodeKey, mutation);
                        this.textEditorService.getEditor.update(()=>{
                            const textnode: TextNode = $getNodeByKey(nodeKey)!;
                            if (!textnode){
                                return;
                            }
                            const textString = textnode.getTextContent();
                            const sentences = parseSentences(textString);
                            console.debug(sentences);
    
                            if (
                                (mutation === "created" ||
                                    mutation === "updated") &&
                                sentences.length > 1

                            ) {
                                textnode.toggleUnmergeable();
                                let val = 0;
                                const charOffsets = sentences.map((sentence) => {
                                    val += sentence.length;
                                    return val;
                                });
                                textnode.setStyle('');
                                textnode.splitText(...charOffsets);
                            }
                        })

                    }
                }
            ),

            this.textEditorService.getEditor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                ()=>{
                    const prevSelection = $getPreviousSelection();
                    const selection = $getSelection();
                    if (!$isRangeSelection(selection)|| !$isRangeSelection(prevSelection)){
                        return false;
                    }
                    const currentNode:LexicalNode = selection.anchor.getNode();
                    if (!selection.isCollapsed()){
                        if ($isTextNode(currentNode)){
                            currentNode.setStyle('');
                        }
                    }
                    if (selection.isCollapsed()){
                        const style = 'color:var(--md-sys-color-primary);font-weight:600;';
                        if ($isTextNode(currentNode) && currentNode.getStyle() === ''){
                            currentNode.setStyle(style);
                        }
                    }
                    if (prevSelection!== null){
                        const prevNode:LexicalNode = prevSelection.anchor.getNode();
                        if ($isTextNode(prevNode) && !prevNode.is(currentNode) && prevNode.getStyle() !== ''){
                            prevNode.setStyle('');
                        }
                    }
                    return false;
                },
                COMMAND_PRIORITY_NORMAL,
            ),
            this.textEditorService.getEditor.registerCommand(KEY_ENTER_COMMAND,()=>{
                const selection = $getPreviousSelection();
                if (selection === null || !$isRangeSelection(selection) || !selection.isCollapsed() ){
                    return false;
                }
                const currentNode:LexicalNode = selection.anchor.getNode();
                if ($isTextNode(currentNode) && currentNode.getStyle() !== ''){
                    currentNode.setStyle('');
                }
                return false;
            },COMMAND_PRIORITY_NORMAL),
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
