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
import { TextSelection, Transaction } from "@tiptap/pm/state";
import { Editor } from "@tiptap/core";

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
        if (paragraphData === null) return null;
        if (!this.cursorSpan) return null;
        const { start, end } = this.cursorSpan.span;

        return {
            from: paragraphData.startOffset + start,
            to: paragraphData.startOffset + end,
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

        return getSpanForOffset(
            sentenceSpans,
            cursorOffset - paragraph.startOffset
        );
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
            from: cursorOffset + offset,
            to: cursorOffset + offset,
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

    private getParagraphDataAtStartOffset(offset: number) {
        return this.paragraphData.find((pdata) => pdata.startOffset === offset);
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

    processText() {
        const textParagraphs = this.textEditorService.getParagraphs();
        this.paragraphData = textParagraphs.map((nodeText) => {
            const existing = this.getParagraphDataAtStartOffset(
                nodeText.offset
            );
            if (
                !existing ||
                !this.stringEquals(nodeText.text, existing.text) ||
                existing.startOffset !== nodeText.offset
            ) {
                const sentenceSpans = getSentenceBoundaries(nodeText.text);
                const data = {
                    startOffset: nodeText.offset,
                    text: nodeText.text,
                    sentenceSpans,
                };
                // console.debug(data);
                return data;
            }
            return existing;
        });
        // console.debug(this.paragraphData);
    }

    /**It works easily now */
    highlightCurrentSentence(editor: Editor, tr: Transaction) {
        const { isCursorCollapsed } = this.cursorService;
        const { isCursorWithinSentence } = this;
        editor
            .chain()
            .command(({ editor, tr }) => {
                const docRange = editor.$doc.range;

                tr.removeMark(
                    docRange.from + 1,
                    docRange.to - 2,
                    editor.schema.mark("highlight-mark")
                );
                return true;
            })
            .run();
        if (isCursorCollapsed && isCursorWithinSentence) {
            if (!this.currentSentenceSerializedRange) return;
            editor
                .chain()
                .command(({ editor, tr }) => {
                    if (this.currentSentenceSerializedRange !== null) {
                        const { from, to } =
                            this.currentSentenceSerializedRange;
                        tr.addMark(
                            from,
                            to,
                            editor.schema.mark("highlight-mark")
                        );
                    }
                    return true;
                })
                .run();

        }
    }
}
