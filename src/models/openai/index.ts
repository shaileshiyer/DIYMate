import { ModelMessage, ModelResults } from 'types';
import { Model } from '../model';
import { ContinuePromptParams, OutlinePromptParams } from "@core/shared/interfaces";
import { ModelParams, UserPrompt, callTextModel } from './api';
import {
    createModelResults,
    dedupeResults,
    getTextBetweenDelimiters,
    textContainsSpecialCharacters,
} from '../utils';

import { ContextService, SessionService } from "@services/services";
import { makePromptHandler as outline } from './prompts/outline';
import { makePromptHandler as continuation } from './prompts/continue';


const D0 = '{';
const D1 = '}';
const BLANK = '____';

interface ServiceProvider {
    contextService: ContextService,
    sessionService: SessionService,
}

/**
 * A model representing OpenAI API
 */
export class OpenAIModel extends Model {
    constructor(serviceProvider: ServiceProvider) {
        super(serviceProvider)
    }

    override getBlank() {
        return BLANK;
    }

    override getPrefix(): string {
        return 'DIY: ';
    }

    getPromptPreamble() {
        return 'Hi I am DIY mate, here to help you write and edit your DIY tutorial.\n\n';
    }

    override wrap(text: string): string {
        return `${D0}${text}${D1}`;
    }

    override insertBlank(pre: string, post: string) {
        return `${pre}${BLANK}${post}`;
    }

    addNewlines(...strings: string[]) {
        return strings.join('\n');
    }

    override parseResults(
        results: ModelResults,
        modelInputText = '',
        useDelimiters = true
    ): ModelResults {
        const parsed = results
            .map((result) => {
                if (modelInputText) {
                    result.content = result.content.replace(modelInputText, '');
                }
                if (useDelimiters) {
                    const text = getTextBetweenDelimiters(result.content, D0, D1) || '';
                    return { ...result, text };
                } else {
                    // First, trim any excess spaces
                    let trimmedText = result.content.trim();
                    // Then, remove any leading punctuation
                    // if (startsWithPunctuation(trimmedText)) {
                    //     trimmedText = trimmedText.slice(1);
                    // }

                    return { ...result, text: trimmedText };
                }
            })
            .filter((result) => {
                // We want to ensure that text is present, and make sure there
                // aren't any special delimiters present in the text (usually a
                // sign of a bug)
                const textExists = !!result.content;
                const noSpecialCharacters = !textContainsSpecialCharacters(result.text);
                return textExists && noSpecialCharacters;
            });

        return dedupeResults(parsed);
    }

    override async query(
        userMessages:ModelMessage[],
        params: Partial<ModelParams> = {},
        shouldParse = false,
    ): Promise<ModelResults> {
        const userPrompt:UserPrompt = {
            session_id:this.sessionService.sessionInfo.session_id,
            thread_id:this.sessionService.sessionInfo.thread_id,
            messages:[...userMessages],
        }

        const res= await callTextModel(userPrompt,params);

        const response = await res.json();
        const responseJson = JSON.parse(response.response);
        const choices:string[] = responseJson.choices.map((choice:any) => choice.message.content);

        const results = createModelResults(choices);

        // console.log(results)
        // const output = shouldParse ? this.parseResults(results, promptText) : results;
        const output = results;
        // console.log(output)
        return output;
    }

    override outline:(params:OutlinePromptParams)=>Promise<ModelResults> = this.makePromptHandler(outline);

    override continue:(params:ContinuePromptParams)=>Promise<ModelResults> = this.makePromptHandler(continuation);

}