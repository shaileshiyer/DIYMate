import { ModelResults } from '@core/shared/types';
import { Model } from '../model';
import { callTextModel } from './api';
import {
    createModelResults,
    dedupeResults,
    getTextBetweenDelimiters,
    textContainsSpecialCharacters,
} from '../utils';
import { startsWithPunctuation } from '@lib/parse_sentences/utils';

import { ContextService, StatusService } from "@services/services";
import { ChatCompletion, ChatCompletionCreateParams, ChatCompletionUserMessageParam } from 'openai/resources';

import { makePromptHandler as continuation } from './prompts/continue';

const D0 = '{';
const D1 = '}';
const BLANK = '____';

interface ServiceProvider {
    contextService: ContextService,
    statusService: StatusService,
}

/**
 * A model representing OpenAI API
 */
export class OpenAIModel extends Model {
    constructor(serviceProvider: ServiceProvider) {
        // TODO: Maybe start session with the backend here for logging
        super(serviceProvider)
    }

    override getBlank() {
        return BLANK;
    }

    override getStoryPrefix(): string {
        return 'Story: ';
    }

    getPromptPreamble() {
        return 'I am a expert writing assisstant, and can expertly help you write and edit your DIY tutorial.\n\n';
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
                    result.text = result.text.replace(modelInputText, '');
                }
                if (useDelimiters) {
                    const text = getTextBetweenDelimiters(result.text, D0, D1) || '';
                    return { ...result, text };
                } else {
                    // First, trim any excess spaces
                    let trimmedText = result.text.trim();
                    // Then, remove any leading punctuation
                    if (startsWithPunctuation(trimmedText)) {
                        trimmedText = trimmedText.slice(1);
                    }

                    return { ...result, text: trimmedText };
                }
            })
            .filter((result) => {
                // We want to ensure that text is present, and make sure there
                // aren't any special delimiters present in the text (usually a
                // sign of a bug)
                const textExists = !!result.text;
                const noSpecialCharacters = !textContainsSpecialCharacters(result.text);
                return textExists && noSpecialCharacters;
            });

        return dedupeResults(parsed);
    }

    override async query(
        promptText: string,
        params: Partial<ChatCompletionCreateParams> = {},
        shouldParse = true,
    ): Promise<ModelResults> {

        const userMessage: ChatCompletionUserMessageParam[] = [{ role: "user", content: promptText }];

        console.log('🚀 prompt text: ', promptText);

        const res: ChatCompletion = await callTextModel(userMessage) as ChatCompletion;
        const responseText = res.choices?.length ? res.choices.map((choice) => choice.message.content) : [];

        const results = createModelResults(responseText);

        console.log(results)
        // const output = shouldParse ? this.parseResults(results, promptText) : results;
        const output = results;
        console.log(output)
        return output;
    }

    override continue = this.makePromptHandler(continuation);

}