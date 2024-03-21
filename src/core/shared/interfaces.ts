import { Operation } from "@core/operations/operation";
import { OperationSite, OperationTrigger, StepLifecycle, TextType } from "@core/shared/types";
import { TemplateResult } from "lit";

export interface OutlinePromptParams {
    description: string;
    outlineDescription?: string;
}

export interface ContinuePromptParams {
    text: string;
}

export interface ElaboratePromptParams {
    text: string;
    toElaborate: string;
}

export interface FirstSentencePromptParams {
    text: string;
}

export interface FreeformPromptParams {
    text: string;
    instruction: string;
}

export interface GenerateWithinSentencePromptParams {
    pre: string;
    post: string;
    beginningOfSentence: string;
    endOfSentence: string;
}

export interface MetaPromptPromptParams {
    text: string;
}

export interface NextSentencePromptParams {
    pre: string;
    post: string;
    previousSentence: string;
}

export interface ReplacePromptParams {
    pre: string;
    post: string;
    nWords: number;
}

export interface RewriteEndOfSentencePromptParams {
    pre: string;
    post: string;
    beginningOfSentence: string;
}

export interface RewriteSelectionPromptParams {
    pre: string;
    post: string;
    toRewrite: string;
    howToRewrite: string;
}

export interface RewriteSentencePromptParams {
    pre: string;
    post: string;
    toRewrite: string;
    howToRewrite: string;
}

export interface SuggestRewritePromptParams {
    text: string;
    toRewrite: string;
    textType: TextType;
}

type UUID = string;

/**
 * Operation Data is used to track the intent of the user to change the text
 * Also allows for easier logging of Prompt Operations.
 */

export interface OperationData {
    id: UUID;
    documentId: UUID;
    timestamp: number;
    text: string;
    cursorStart: number;
    cursorEnd: number;
    preText:string;
    postText:string;
    selectedPlainText:string;
}

export interface OperationControl {
    value: string | number | boolean;
    getPrefix(): string | TemplateResult;
    getDescription(): string | TemplateResult;
}

export interface OperationControls {
    [key: string]: OperationControl;
}

export interface OperationClass {
    new (
        serviceProvider: any,
        trigger: OperationTrigger,
        ...params: any[]
    ): Operation;
    getButtonLabel(...params:any[]):string|TemplateResult;
    getDescription(...params:any[]):string|TemplateResult;

    controls: OperationControls;
    globalControls:OperationControls;
    isAvailable(operationSite:OperationSite,documentSite?:OperationSite): boolean;
    id: string;
}

export type ControlPrefix = string | ((control: OperationControl) => string);

export interface Step {
  state: StepLifecycle;
  resolve: () => void;
  // tslint:disable-next-line:no-any
  reject: (e: any) => void;
  readonly isFinished: boolean;
  setup(): void;
  cleanup(): void;
  pause(): void;
  unpause(): void;
  getPromise(): Promise<void>;
  cancelPromise(): void;
  start(): void;
  onStart(callback: () => void): void;
  cancel(): void;
  onCancel(callback: () => void): void;
  cancelOperation(): void;
  restart(): void;
  onRestart(callback: () => void): void;
  finish(): void;
  onFinish(callback: () => void): void;
}