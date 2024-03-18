import { action, computed, makeObservable, observable } from "mobx";
import { CursorService, SerializedCursor } from "./cursor_service";
import { Service } from "./service";
import { TextEditorService } from "./text_editor_service";
import {
    ParagraphData,
    getSentenceBoundaries,
    getSpanForOffset,
    SentenceSpan,
} from "@lib/sentence_boundaries";
import { parseSentences } from "@lib/parse_sentences";
import { TextSelection, Transaction } from "@tiptap/pm/state";
import { Editor } from "@tiptap/core";
import { Schema } from "@tiptap/pm/model";

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
            paragraphData: observable.ref,
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

    get currentSentenceSerializedRange(): SerializedCursor | null {
        if (!this.isCursorWithinSentence) return null;
        const paragraphData = this.getParagraphDataAtCursor();
        if(paragraphData===null) return null;
        const offset = this.cursorService.cursorOffset;
        if (!this.cursorSpan) return null;
        const { start, end } = this.cursorSpan.span;
        
        return {
            from: paragraphData.startOffset+start,
            to: paragraphData.startOffset+end,
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
        const cursorOffset = this.cursorService.cursorOffset;
        const { sentenceSpans } = paragraph;

        return getSpanForOffset(sentenceSpans, cursorOffset-paragraph.startOffset);
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
            return serializedRange.from;
        }
    }

    getNextSentenceRange(): TextSelection {
        const offset = this.nextSentenceOffset;
        const cursorOffset = this.cursorService.cursorOffset;
        const serialized: SerializedCursor = {
            from:cursorOffset+offset,
            to:cursorOffset+offset,
        };
        return this.cursorService.makeSelectionFromSerializedCursorRange(
            serialized
        );
    }

    getCurrentSentenceRange(): TextSelection {
        const { currentSentenceSerializedRange } = this;
        const selection =
            this.cursorService.makeSelectionFromSerializedCursorRange(
                currentSentenceSerializedRange
            );
        return selection;
    }

    // Helps eliminate mobx out-of-bounds read errors on the observable
    // paragraph.
    private getParagraphDataAtIndex(i: number) {
        return i <= this.paragraphData.length - 1
        ? this.paragraphData[i]
        : undefined;
    }

    private getParagraphDataAtStartOffset(offset:number){
        return this.paragraphData.find((pdata)=> pdata.startOffset === offset);
    }

    private stringEquals(a: string, b: string) {
        return a.length === b.length && a === b;
    }

    private getParagraphDataAtCursor() {
        const { isCursorCollapsed, cursorOffset } = this.cursorService;
        if (!cursorOffset) return null;
        if (!isCursorCollapsed) return null;
        const nodePos = this.textEditorService.getEditor.$pos(cursorOffset);
        const paragraphOffset = nodePos.from;
        const paragraph = this.getParagraphDataAtStartOffset(paragraphOffset);
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
        this.paragraphData = textParagraphs.map((nodeText,index) => {
            const existing = this.getParagraphDataAtStartOffset(nodeText.offset);
            if (!existing || !this.stringEquals(nodeText.text, existing.text) || existing.startOffset !== nodeText.offset) {
                const sentenceSpans = getSentenceBoundaries(nodeText.text);
                const data = {
                    startOffset: nodeText.offset,
                    text: nodeText.text,
                    sentenceSpans,
                };
                console.debug(data);
                return data;
            }
            return existing;
        });
        // console.debug(this.paragraphData);
    }

    /**Forget about this for now The current solution works and is good enough for most cases */
    // Turns out it is getting a stale value from the computed stuff.
    previousRange:SerializedCursor|null = null;
    highlightCurrentSentence(editor:Editor,tr:Transaction) {
        const { isCursorCollapsed, serializedRange } = this.cursorService;
        const { isCursorWithinSentence } = this;

        if (this.previousRange!==null){
            // tr.removeMark(this.previousRange.from,this.previousRange.to,editor.schema.mark('bold'));
            editor
                .chain()
                .setTextSelection(this.previousRange)
                .unsetAllMarks()
                .setTextSelection(serializedRange)
                .run();
        }

        if (isCursorCollapsed && isCursorWithinSentence) {
            if (!this.currentSentenceSerializedRange) return;
            const {from,to} = this.currentSentenceSerializedRange;

            editor
                .chain()
                .setTextSelection(this.currentSentenceSerializedRange)
                .setMark('bold',{class:'marked'})
                .setTextSelection(serializedRange)
                .run();

            // tr.addMark(from,to,editor.schema.mark('bold',{class:'marked'}));
            this.previousRange = this.currentSentenceSerializedRange;
        }
    }
}
