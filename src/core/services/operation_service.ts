import { makeObservable, observable } from "mobx";
import { CursorService } from "./cursor_service";
import { SentencesService } from "./sentences_service";
import { Service } from "./service";
import { TextEditorService } from "./text_editor_service";
import { OperationSite } from "@core/shared/types";

export interface ServiceProvider {
    cursorService: CursorService;
    sentencesService: SentencesService;
    textEditorService: TextEditorService;
}

/**
 * Responsible for showing which operations are available. managing the current operations stack.
 * - What opeartions are currently available.
 * - What operations are currently running.
 */
export class OperationsService extends Service {
    isError = false;
    constructor(private readonly serviceProvider: ServiceProvider) {
        super();
        makeObservable(this, {
            isError: observable,
        });
    }

    private get cursorService() {
        return this.serviceProvider.cursorService;
    }

    private get sentencesService() {
        return this.serviceProvider.sentencesService;
    }

    private get textEditorService() {
        return this.serviceProvider.textEditorService;
    }

    getOperationsSite(): OperationSite{
        const {
            isCursorSelection,
            isCursorAtStartOfNode,
            isCursorAtEndOfNode,
            isCurrentNodeEmpty,
        } = this.cursorService;
        const {
            isCursorWithinSentence,
            isCursorBetweenSentences,
        } = this.sentencesService;

        const isDocumentEmpty = this.textEditorService.isEmpty;

        if (isDocumentEmpty) {
            return OperationSite.EMPTY_DOCUMENT;
          } else if (isCursorSelection) {
            return OperationSite.SELECTION;
          } else if (isCurrentNodeEmpty) {
            return OperationSite.EMPTY_SECTION;
          } else if (isCursorAtStartOfNode) {
            return OperationSite.START_OF_SECTION;
          } else if (isCursorAtEndOfNode) {
            return OperationSite.END_OF_SECTION;
          } else if (isCursorWithinSentence) {
            return OperationSite.WITHIN_SENTENCE;
          } else if (isCursorBetweenSentences) {
            return OperationSite.BETWEEN_SENTENCES;
          } else {
            return OperationSite.NONE;
          }
    }

    getLocationInDocumentStructure(): OperationSite{
        const {
            isCursorAtTitle,
            isCursorInIntroduction,
            isCursorInStep,
            isCursorInConclusion,
        } = this.cursorService;

        if (isCursorAtTitle){
            return OperationSite.DIY_TITLE;
        } else if (isCursorInIntroduction){
            return OperationSite.DIY_INTRODUCTION;
        } else if (isCursorInStep){
            return OperationSite.DIY_STEP;
        } else if (isCursorInConclusion){
            return OperationSite.DIY_CONCLUSION;
        } else {
            return OperationSite.NONE;
        }
    }
}
