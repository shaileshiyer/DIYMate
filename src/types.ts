/**
 * Types used for the DIYMate project
 */

/**
 * HTMLElementEvent type for html event typing and to prevent null erros
 */
export type HTMLElementEvent<T extends HTMLElement> = Event & { target:T};


/**
 * Generic wrapper type for constructors, used in the DI system.
 */
export type Constructor<T> = {
    new (...args: any[]): T;
  };

/**
 * An enum describing all operations in the DIYmate App.
 */
export const enum OperationType {
  OUTLINE = 'OUTLINE',
  CONTINUE = 'CONTINUE',
  ELABORATE = 'ELABORATE',
  FIRST_SENTENCE = 'FIRST_SENTENCE',
  FREEFORM = 'FREEFORM',
  GENERATE_WITHIN_SENTENCE = 'GENERATE_WITHIN_SENTENCE',
  META_PROMPT = 'META_PROMPT',
  NEW_STORY = 'NEW_STORY',
  NEXT_SENTENCE = 'NEXT_SENTENCE',
  REPLACE = 'REPLACE',
  REWRITE_CHOICE = 'REWRITE_CHOICE',
  REWRITE_END_OF_SENTENCE = 'REWRITE_END_OF_SENTENCE',
  REWRITE_SELECTION = 'REWRITE_SELECTION',
  REWRITE_SENTENCE = 'REWRITE_SENTENCE',
  SUGGEST_REWRITE = 'SUGGEST_REWRITE',
  // Default to NONE
  NONE = 'NONE',
}

/**
 * A representation of what the state of the cursor is, in order to determine
 * which operations are available.
 */
export const enum OperationSite {
  SELECTION = 'SELECTION',
  EMPTY_DOCUMENT = 'EMPTY_DOCUMENT',
  EMPTY_SECTION = 'EMPTY_SECTION',
  START_OF_SECTION = 'START_OF_SECTION',
  END_OF_SECTION = 'END_OF_SECTION',
  WITHIN_SENTENCE = 'WITHIN_SENTENCE',
  BETWEEN_SENTENCES = 'BETWEEN_SENTENCES',
  NONE = 'NONE',
}

export const enum OperationTrigger {
  BUTTON = 'BUTTON',
  CONTROL = 'CONTROL',
  KEY_COMMAND = 'KEY_COMMAND',
  OPERATION = 'OPERATION', // Triggered by another operation
  APP = 'APP', // Triggered by the app lifecyle, such as onboarding
}

export const enum StepLifecycle {
  NOT_STARTED = 'NOT_STARTED',
  STARTED = 'STARTED',
  FINISHED = 'FINISHED',
}

export const enum TextType {
  WORD = 'word', // A single word or entity (e.g. cat, city-state)
  PHRASE = 'phrase', // Semantically grouped words (e.g. the big red dog)
  SENTENCE = 'sentence', // A complete sentence
  TEXT = 'text', // Unstructured text
}

export interface ModelResult {
  content:string;
  uuid:string;
  data?:any;
};

export type ModelResults = ModelResult[];

export type ModelMessage = {role:'system',content:string,name?:string}|
{role:'user',content:string,name?:string}|
{role:'assistant',content:string|null,name?:string};
