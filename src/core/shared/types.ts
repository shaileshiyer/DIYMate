/**
 * Types used for the DIYMate project
 */

/**
 * HTMLElementEvent type for html event typing and to prevent null erros
 */
export type HTMLElementEvent<T extends HTMLElement> = Event & { target: T };


/**
 * Generic wrapper type for constructors, used in the DI system.
 */
export type Constructor<T> = {
  new(...args: any[]): T;
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
  FREEFORM_STEP = 'FREEFORM_STEP',
  GENERATE_WITHIN_SENTENCE = 'GENERATE_WITHIN_SENTENCE',
  META_PROMPT = 'META_PROMPT',
  NEXT_SENTENCE = 'NEXT_SENTENCE',
  REPLACE = 'REPLACE',
  REWRITE_CHOICE = 'REWRITE_CHOICE',
  REWRITE_END_OF_SENTENCE = 'REWRITE_END_OF_SENTENCE',
  REWRITE_SELECTION = 'REWRITE_SELECTION',
  REWRITE_SENTENCE = 'REWRITE_SENTENCE',
  SUGGEST_REWRITE = 'SUGGEST_REWRITE',
  GENERATE_INTRODUCTION = 'GENERATE_INTRODUCTION',
  GENERATE_CONCLUSION = 'GENERATE_CONCLUSION',
  REVIEW_DIY = 'REVIEW_DIY',
  REVIEW_DIY_SELECTION = 'REVIEW_DIY_SELECTION',
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
  // DIY Operation Sites
  DIY_TITLE = 'DIY_TITLE',
  DIY_SECTION_TITLE = 'DIY_SECTION_TITLE',
  DIY_INTRODUCTION = 'DIY_INTRODUCTION',
  // DIY_LIST = 'DIY_LIST',
  // DIY_MATERIALS_LIST = 'DIY_MATERIALS_LIST',
  // DIY_TOOLS_LIST = 'DIY_TOOLS_LIST',
  // DIY_SKILLS_LIST = 'DIY_SKILLS_LIST',
  // SAFETY_INSTRUCTIONS = 'SAFETY_INSTRUCTION',
  DIY_STEP_TITLE = 'DIY_STEP_TITLE',
  DIY_STEP = 'DIY_STEP',
  // DIY_STEP_MATERIALS_LIST = 'DIY_STEP_MATERIALS_LIST',
  // DIY_STEP_TOOLS_LIST = 'DIY_STEP_TOOLS_LIST',
  DIY_CONCLUSION = 'CONCLUSION',
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
  content: string;
  uuid: string;
  data?: any;
};

export type ModelResults = ModelResult[];

export type ModelMessage = { role: 'system', content: string, name?: string } |
{ role: 'user', content: string, name?: string } |
{ role: 'assistant', content: string | null, name?: string };


export interface DIYStep {
  index: number,
  title: string,
  image_alt_text: string,
  materials_in_step: string[],
  tools_in_step: string[],
  instructions: string[]
}
export interface DIYStructureJSON {
  title: string,
  heroshot_alt_text: string,
  introduction: string,
  materials: string[],
  tools: string[],
  competences: string[],
  safety_instruction: string[],
  estimated_time:string,
  steps: DIYStep[],
  conclusion: {
    final_image_alt_text: string,
    text: string,
  }
}


function isDIYStep(obj:Object):obj is DIYStep {
  return obj.hasOwnProperty('index') && 
  obj.hasOwnProperty('title') &&
  obj.hasOwnProperty('image_alt_text') &&
  obj.hasOwnProperty('materials_in_step') &&
  obj.hasOwnProperty('tools_in_step') &&
  obj.hasOwnProperty('instructions');
}

export function isDIYStructureJSON(obj:object):obj is DIYStructureJSON {
  if (!obj.hasOwnProperty('title') || 
  !obj.hasOwnProperty('heroshot_alt_text') ||
  !obj.hasOwnProperty('introduction') ||
  !obj.hasOwnProperty('materials') ||
  !obj.hasOwnProperty('tools') ||
  !obj.hasOwnProperty('competences') ||
  !obj.hasOwnProperty('safety_instruction') ||
  !obj.hasOwnProperty('estimated_time')){
    return false;
  }
  if (obj.hasOwnProperty('steps')){
    // @ts-ignore
    const steps:Array<object> = obj['steps']|| [];
    const areaAllDIYStep = steps.every((val,index,arr)=> isDIYStep(val));
    if (!areaAllDIYStep){
      return false;
    }
  }

  if (obj.hasOwnProperty('conclusion')){
    // @ts-ignore
    const conclusion = obj['conclusion']||{};
    if (!conclusion.hasOwnProperty('final_image_alt_text') || !conclusion.hasOwnProperty('text')){
      return false;
    }
  }
  return true;
}