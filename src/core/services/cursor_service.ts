import { action, computed, makeObservable, observable } from "mobx";
import { Service } from "./service";
import { TextEditorService } from "./text_editor_service";

import { SentencesService } from "./sentences_service";
import { Editor, NodePos } from "@tiptap/core";
import {
    Selection,
    SelectionRange,
    TextSelection,
    Transaction,
} from "@tiptap/pm/state";

interface ServiceProvider {
    textEditorService: TextEditorService;
    sentencesService: SentencesService;
}

export interface CursorOffset {
    key: string;
    offset: number;
}

export interface SerializedCursor {
    from: number;
    to: number;
}

export class CursorService extends Service {
    selectedText: string = "";
    preText: string = "";
    postText: string = "";

    previousHeadingSiblings: NodePos[] = [];
    nextHeadingSiblings: NodePos[] = [];

    constructor(private readonly serviceProvider: ServiceProvider) {
        super();
        makeObservable(this, {
            selectedText: observable,
            serializedRange: observable,
            preText: observable,
            postText: observable,
            cursorUpdate: action,
            setSerializedRange: action,
            isCursorCollapsed: computed,
            isCursorAtEndOfNode: computed,
            isCursorAtStartOfNode: computed,
            isCursorSelection: computed,
            isCursorInSingleNode: computed,
            isCursorAtStartOfText: computed,
            isCursorAtEndOfText: computed,
            cursorOffset: computed,
        });
    }

    get textEditorService() {
        return this.serviceProvider.textEditorService;
    }

    get sentenceService() {
        return this.serviceProvider.sentencesService;
    }

    cursorUpdate(editor: Editor, transaction: Transaction): void {
        const { from, to } = transaction.selection;
        this.serializedRange = this.makeSerializedCursorRangeFromSelection(
            transaction.selection
        );

        const headernodes = editor.$nodes("heading",{level:2});
        if (headernodes !== null) {
            this.previousHeadingSiblings = headernodes.filter(
                (npos) => npos.from < from
            );
            this.nextHeadingSiblings = headernodes.filter(
                (npos) => npos.to > to
            );
        }
        // const doc = editor.state.doc;
        // this.selectedPlainText = doc.textBetween(from, to,'\n');
        this.selectedText = this.textEditorService.getMarkdownFromRange({
            from,
            to,
        });
        // this.preText = doc.textBetween(1,from,'\n');
        this.preText = this.textEditorService.getMarkdownFromRange({
            from: 1,
            to: from,
        });
        const range = this.textEditorService.getEndOfDocument()?.range;
        // console.log(size);
        if (range) {
            // this.postText = doc.textBetween(to,size.to,'\n');
            this.postText = this.textEditorService.getMarkdownFromRange({
                from: to,
                to: range.to,
            });
        }
    }

    serializedRange: SerializedCursor = makeEmptySerializedRange();

    setSerializedRange(serializedRange: SerializedCursor) {
        this.serializedRange = serializedRange;
    }

    getSerializedRange() {
        return this.serializedRange;
    }

    makeSerializedCursorRangeFromSelection(
        selection: Selection
    ): SerializedCursor {
        return {
            from: selection.$from.pos,
            to: selection.$to.pos,
        };
    }

    makeSelectionFromSerializedCursorRange(
        serializedRange: SerializedCursor | null
    ): TextSelection {
        const editor = this.textEditorService.getEditor;
        if (serializedRange === null) return this.blankRange();
        try {
            const { from, to } = serializedRange;
            const $from = editor.state.doc.resolve(from);
            const $to = editor.state.doc.resolve(to);
            const range = new TextSelection($from, $to);
            return range;
        } catch (err: unknown) {
            console.error(err);
        }
        return this.blankRange();
    }

    blankRange(): TextSelection {
        const editor = this.textEditorService.getEditor;
        const $from = editor.state.doc.resolve(0);
        const $to = editor.state.doc.resolve(0);
        return new TextSelection($from, $to);
    }

    // Get cursor offset in parent node
    get cursorOffset() {
        return this.isCursorCollapsed ? this.serializedRange.from : 0;
    }

    getOffsetRange() {
        const start = this.serializedRange.from;
        const end = this.serializedRange.to;
        return { start, end };
    }

    get isCursorCollapsed() {
        return this.serializedRange.from === this.serializedRange.to;
    }

    get isCursorSelection() {
        return !this.isCursorCollapsed;
    }

    get isCursorInSingleNode() {
        const editor = this.textEditorService.getEditor;
        const fromNode = editor.$pos(this.serializedRange.from).node;
        const toNode = editor.$pos(this.serializedRange.to).node;
        return fromNode.eq(toNode);
    }

    get isCursorAtEndOfNode() {
        if (this.isCursorCollapsed) {
            const editor = this.textEditorService.getEditor;
            const pos = editor.$pos(this.serializedRange.from);

            return this.serializedRange.from === pos.range.to - 1;
        }
        return false;
    }

    get isCursorAtStartOfNode() {
        if (this.isCursorCollapsed) {
            const editor = this.textEditorService.getEditor;
            const pos = editor.$pos(this.serializedRange.from);

            return this.serializedRange.from === pos.range.from;
        }
        return false;
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
        const editor = this.textEditorService.getEditor;
        const currentNode = editor.$pos(this.serializedRange.from).node;
        return currentNode.nodeSize === 2;
    }

    get isCursorAtStartOfText() {
        if (this.isCursorCollapsed) {
            const startPos = this.textEditorService.getStartOfDocument();
            if (startPos !== null) {
                const { from } = startPos.range;
                return this.serializedRange.from === from;
            }
        }
        return false;
    }

    get isCursorAtEndOfText() {
        if (this.isCursorCollapsed) {
            const endPos = this.textEditorService.getEndOfDocument();
            if (endPos !== null) {
                const { to } = endPos.range;
                return this.serializedRange.from === to - 1;
            }
        }
        return false;
    }

    get isCursorAtTitle() {
        const node = this.textEditorService.getEditor.$pos(
            this.serializedRange.from
        );
        return (
            node.attributes["level"] === 1 && node.node.type.name === "heading"
        );
    }

    get isCursorAtSectionTitle(){
        const node = this.textEditorService.getEditor.$pos(
            this.serializedRange.from
        );
        return (
            node.attributes["level"] === 2 && node.node.type.name === "heading"
        );
    }

    get isCursorInIntroduction() {
        return (
            !this.isCursorAtTitle &&
            this.previousHeadingSiblings.length <= 1 &&
            !this.isCursorAtStepTitle
        );
    }

    get isCursorAtStepTitle() {
        const node = this.textEditorService.getEditor.$pos(
            this.serializedRange.from
        );
        const isHeading3 =
            node.node.type.name === "heading" && node.attributes["level"] === 3;
        return isHeading3 && this.previousHeadingSiblings.length === 3;
    }
    get isCursorInStep() {
        return (
            this.previousHeadingSiblings.length === 3 &&
            !this.isCursorAtTitle &&
            !this.isCursorInIntroduction &&
            !this.isCursorAtStepTitle &&
            !this.isCursorInConclusion &&
            !this.isCursorAtConclusionTitle
        );
    }

    get isCursorAtConclusionTitle() {
        return (
            this.isCursorAtSectionTitle &&
            this.nextHeadingSiblings.length === 1
        );
    }

    get isCursorInConclusion() {
        return this.nextHeadingSiblings.length === 0;
    }

    getPreAndPostSelectionText(): [string, string] {
        return [this.preText, this.postText];
    }
}

function makeEmptySerializedRange(): SerializedCursor {
    return {
        from: 0,
        to: 0,
    };
}
