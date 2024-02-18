import { ModelMessage } from "types";

export interface ModelParams {
  response_format:{type:'json_object'|'text'};
  max_tokens:number;
  n:number;
  top_p:number;
  temperature:number;
  frequency_penalty:number;
  presence_penalty:number;
  stop_sequence:string;
}

const DEFAULT_PARAMS: ModelParams = {
  n: 5,
  temperature: 1,
  top_p: 1,
  presence_penalty: 0,
  frequency_penalty: 0,
  stop_sequence: '.',
  max_tokens:100,
  response_format:{type:"text"},
};

const DEFAULT_TEXT_PARAMS: ModelParams = {
  ...DEFAULT_PARAMS,
  max_tokens: 200,
  temperature:1,
}

const DEFAULT_DIALOG_PARAMS:ModelParams = {
  ...DEFAULT_PARAMS,
  max_tokens: 100,
  temperature:0.7
}




export interface UserPrompt {
  session_id:string;
  thread_id:string;
  messages:ModelMessage[];
}

export type BackendAPIParams = UserPrompt & ModelParams;

export interface AssistantParams {
  session_id:string;
  thread_id:string;
  message_content:string;
  instruction:string;
}

export async function callTextModel(userPrompt:UserPrompt,modelParams?:Partial<ModelParams>) {
  const params: BackendAPIParams = {
    ...userPrompt,
    ...DEFAULT_TEXT_PARAMS,
    ...modelParams,
  }
  return callApi(params);
}



export async function callDialogModel(params: AssistantParams) {
  // const params: AssitantAPIParams = {
    
  // }
  return callAssitant(params);
}



export async function callApi(params:BackendAPIParams) {
  return fetch(`${import.meta.env.VITE_BACKEND_API_URL}/query`,{ 
    method: 'POST',
    headers:{
        "Content-Type":"application/json",
    },
    body:JSON.stringify(params),
 });
}

export async function callAssitant(params:AssistantParams) {
  return fetch(`${import.meta.env.VITE_BACKEND_API_URL}/chat`,{ 
    method: 'POST',
    headers:{
        "Content-Type":"application/json",
    },
    body:JSON.stringify(params),
 })
}
