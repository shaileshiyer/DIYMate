import { action, computed, makeObservable, observable } from "mobx";
import { CursorService, SerializedLexicalRange } from "./cursor_service";
import { Service } from "./service";
import { TextEditorService } from "./text_editor_service";
import {
    ParagraphData,
    getSentenceBoundaries,
    getSpanForOffset,
    SentenceSpan,
} from "@lib/sentence_boundaries";
import { $getCharacterOffsets, $getNodeByKey, $getSelection, $isRangeSelection, $setSelection, RangeSelection, TextNode } from "lexical";
import { parseSentences } from "@lib/parse_sentences";
import { $addNodeStyle, $patchStyleText, $sliceSelectedTextNodeContent } from "@lexical/selection";
import {
    $createMarkNode,
    $unwrapMarkNode,
    $wrapSelectionInMarkNode,
    MarkNode,
} from "@lexical/mark";

interface ServiceProvider {
    cursorService: CursorService;
    textEditorService: TextEditorService;
}

export class SentencesService extends Service {
    constructor(private readonly serviceProvider: ServiceProvider) {
        super();
        makeObservable(this, {
            cursorSpan: computed,
            currentSentence: computed,
            currentSentenceIndex: computed,
            currentSentenceSerializedRange: computed,
            nextSentenceOffset: computed,
            paragraphData: observable.shallow,
            processText: action,
        });
    }

    private get cursorService() {
        return this.serviceProvider.cursorService;
    }

    private get textEditorService() {
        return this.serviceProvider.textEditorService;
    }

    paragraphData: ParagraphData[] = [];
    initialized = false;

    get currentSentence(): string {
        if (!this.cursorSpan) return "";
        return this.isCursorWithinSentence ? this.cursorSpan.span.text : "";
    }

    get currentSentenceSerializedRange(): SerializedLexicalRange | null {
        if (!this.isCursorWithinSentence) return null;
        const key = this.cursorService.cursorOffset.key;
        if (!this.cursorSpan) return null;
        const { start, end } = this.cursorSpan.span;
        return {
            anchor: { key, offset: start, type: "element" },
            focus: { key, offset: end, type: "element" },
            isBackward: false,
        };
    }

    get currentSentenceIndex(): number {
        if (!this.isCursorWithinSentence) return -1;
        const paragraphData = this.getParagraphDataAtCursor();
        if (paragraphData === null) return -1;

        let index = 0;
        for (const span of paragraphData.sentenceSpans) {
            if (this.cursorSpan && this.cursorSpan.span === span) {
                return index;
            }
            if (span instanceof SentenceSpan) {
                index += 1;
            }
        }
        return -1;
    }

    getSentenceBeforeCursor(): string {
        const paragraphData = this.getParagraphDataAtCursor();
        if (paragraphData == null) return "";

        let previousSentence = "";
        for (const span of paragraphData.sentenceSpans) {
            if (this.cursorSpan && this.cursorSpan.span === span) {
                return previousSentence;
            }
            if (span instanceof SentenceSpan) {
                previousSentence = span.text;
            }
        }

        return "";
    }

    get cursorSpan() {
        const paragraph = this.getParagraphDataAtCursor();
        if (!paragraph) return null;
        const cursor = this.cursorService.cursorOffset;
        const { sentenceSpans } = paragraph;

        return getSpanForOffset(sentenceSpans, cursor.offset);
    }

    get isLastCursorSpan() {
        const { cursorSpan } = this;
        if (cursorSpan === null) return false;
        const paragraph = this.getParagraphDataAtCursor();
        if (paragraph === null) return false;
        return cursorSpan.index === paragraph.sentenceSpans.length - 1;
    }

    get isFirstCursorSpan() {
        const { cursorSpan } = this;
        if (cursorSpan === null) return false;
        const paragraph = this.getParagraphDataAtCursor();
        if (paragraph === null) return false;
        return cursorSpan.index === 0;
    }

    /**
     * Computes whether or not the cursor is in a position fully inside of a
     * sentence, or whether it's on the boundary.
     */
    get isCursorWithinSentence() {
        const { cursorSpan } = this;
        if (cursorSpan == null) return false;

        return cursorSpan.span instanceof SentenceSpan;
    }

    /**
     * Computes whether the cursor is actually between sentences and not at the
     * beginning or the end of the paragraph.
     */
    get isCursorBetweenSentences() {
        return (
            !this.isCursorWithinSentence &&
            !this.isLastCursorSpan &&
            !this.isFirstCursorSpan
        );
    }

    /**
     * If the cursor is within a sentence, the next position to generate at is at
     * the end of that sentence. Otherwise, it's where the cursor is (either in
     * between or at the start/end) of a sentence.
     */
    get nextSentenceOffset() {
        const { serializedRange } = this.cursorService;
        if (this.isCursorWithinSentence && this.cursorSpan != null) {
            const { span } = this.cursorSpan;
            return span.end;
        } else {
            return serializedRange.anchor.offset;
        }
    }

    getNextSentenceRange(): RangeSelection {
        const offset = this.nextSentenceOffset;
        const key = this.cursorService.cursorOffset.key;
        const serialized: SerializedLexicalRange = {
            anchor: { key, offset, type: "element" },
            focus: { key, offset, type: "element" },
            isBackward: false,
        };
        return this.cursorService.makeSelectionFromSerializedLexicalRange(
            serialized
        );
    }

    getCurrentSentenceRange(): RangeSelection {
        const { currentSentenceSerializedRange } = this;
        const selection =
            this.cursorService.makeSelectionFromSerializedLexicalRange(
                currentSentenceSerializedRange
            );
        return selection;
    }

    private getParagraphDataAtKey(key: string) {
        return this.paragraphData.find((pdata) => pdata.key === key);
    }

    private stringEquals(a: string, b: string) {
        return a.length === b.length && a === b;
    }

    private getParagraphDataAtCursor() {
        const { isCursorCollapsed, cursorOffset } = this.cursorService;
        if (!cursorOffset) return null;
        if (!isCursorCollapsed) return null;
        const paragraphKey = cursorOffset.key;
        const paragraph = this.getParagraphDataAtKey(paragraphKey);
        return paragraph || null;
    }

    getSentencesForElement(key: string): string[] {
        const paragraphs = this.textEditorService.getParagraphs();
        const paragraphText = paragraphs.find((value) => value.key === key);
        if (!paragraphText) {
            return [];
        }
        return parseSentences(paragraphText.text);
    }

    processText() {
        const textParagraphs = this.textEditorService.getParagraphs();
        this.paragraphData = textParagraphs.map((nodeText) => {
            const existing = this.getParagraphDataAtKey(nodeText.key);
            if (!existing || !this.stringEquals(nodeText.text, existing.text)) {
                const sentenceSpans = getSentenceBoundaries(nodeText.text);
                return {
                    key: nodeText.key,
                    text: nodeText.text,
                    sentenceSpans,
                };
            }
            return existing;
        });
    }

    previousSelection: string | null = null;

    highlightCurrentSentence() {
        // const { isCursorCollapsed, serializedRange } = this.cursorService;
        // const { isCursorWithinSentence } = this;

        // const cursorSelection = $getSelection();
        // if (this.previousSelection){
        //     const node:TextNode|null = $getNodeByKey(this.previousSelection);
        //     if(!node) return;
        //     node.setStyle('');
        // }

        // if (isCursorCollapsed && isCursorWithinSentence) {
        //     if (!this.currentSentenceSerializedRange) return;
        //     const currentSentenceRange = this.currentSentenceSerializedRange;

        //     const markupRange = this.cursorService.makeSelectionFromSerializedLexicalRange(currentSentenceRange)
        //     // currentSentenceRange.setStyle('color:blue');
        //     // $patchStyleText(currentSentenceRange,{'color':'blue'});
        //     // $wrapSelectionInMarkNode(
        //     //     currentSentenceRange,
        //     //     currentSentenceRange.isBackward(),
        //     //     "current",
        //     //     (ids) => {
        //     //         const marknode = $createMarkNode(ids);
        //     //         this.previousSelection = marknode.getKey();
        //     //         return marknode;
        //     //     }
        //     // );
        //     // this.previousSelection = currentSentenceRange;
        //     const currentNode:TextNode = markupRange.anchor.getNode();
        //     const textNodes = currentNode.splitText(...$getCharacterOffsets(markupRange));

        //     for (let textNode of textNodes){
        //         textNode.toggleUnmergeable()
        //     }
        //     const selection = $getSelection();
        //     if (!$isRangeSelection(selection)) return;

        //     console.debug(selection.anchor.key)
        //     const textNode:TextNode|null = selection.anchor.getNode();
        //     if (!textNode) return;
        //     textNode.setStyle('color:blue;');
        //     this.previousSelection = textNode.getKey();
        //     // const textNode = textNodes[this.currentSentenceIndex];
        //     // if (textNode !== null){
        //     //     textNode.setStyle('color:blue');
        //     //     this.previousSelection = textNode.getKey();
                
        //     // }


        // }
        // $setSelection(cursorSelection);
    }
}
