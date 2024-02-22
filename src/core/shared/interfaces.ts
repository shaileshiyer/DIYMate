import { TextType } from "@core/shared/types";

export interface OutlinePromptParams {
    description:string;
    outlinePrompt?:string;
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
