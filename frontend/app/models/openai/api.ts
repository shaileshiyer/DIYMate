import OpenAI from "openai";
import { ChatCompletionCreateParams, ChatCompletionMessageParam } from "openai/resources";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY,dangerouslyAllowBrowser:true });

export interface data {
  session_id: string;
  domain: string;
  example: string;
  example_text: string;
  doc: string;

  engine: string;
  suggestions: string;
};

const DEFAULT_PARAMS: Partial<ChatCompletionCreateParams> = {
  n: 5,
  temperature: 0.95,
  top_p: 1,
  presence_penalty: 0.5,
  frequency_penalty: 0.5,
  stop: '.',
  stream: false,
};

const DEFAULT_TEXT_PARAMS: Partial<ChatCompletionCreateParams> = {
  ...DEFAULT_PARAMS,
  max_tokens: 50,
  temperature:1,
}

const DEFAULT_DIALOG_PARAMS: Partial<ChatCompletionCreateParams> = {
  ...DEFAULT_PARAMS,
  max_tokens: 100,
  temperature:0.7
}

const MODEL_ID = 'gpt-3.5-turbo'

export async function callTextModel(userMessages:ChatCompletionMessageParam[]) {
  const params: ChatCompletionCreateParams = {
    ...DEFAULT_TEXT_PARAMS,
    messages:[
      {role:'system', content:'You are suggesting text to the user'},
      ...userMessages
    ],
    model:MODEL_ID,
    stream:false
  }
  return callApi(params);
}

export async function callDialogModel(userMessages:ChatCompletionMessageParam[]) {
  const params: ChatCompletionCreateParams = {
    ...DEFAULT_TEXT_PARAMS,
    messages:[
      {role:'system', content:'You are chatting with the user. This is the history so far'},
      ...userMessages
    ],
    model:MODEL_ID,
    stream:false
  }
  return callApi(params);
}


export async function callApi(params:ChatCompletionCreateParams) {
  const completions = await openai.chat.completions.create(params)
  return completions;
}

// TODO: Start the session with the backend
export async function startSession(accessCode) {
  const domain = 'demo'
}