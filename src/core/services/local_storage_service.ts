import { Service } from "./service";
import { SerializedEditorState } from "lexical";
import { SessionInformation } from "./session_service";
import { SavedDocument } from "./document_store_service";
import { uuid } from "@lib/uuid";


export interface CurrentDIY {
    description: string;
    outlinePrompt: string;
    generatedOutline?:string;
};



export type SavedDocuments = { [key: string]: SavedDocument };

interface LocalStorageState {
    hasBeenWelcomed: boolean;
    currentSession: SessionInformation | null;
    currentDIY: CurrentDIY | null;
    editorState: SerializedEditorState | null;
    savedDocuments: SavedDocuments;
}

const STATE_PREFIX = 'diymate'
const HAS_BEEN_WELCOMED_KEY = STATE_PREFIX + '@has-been-welcomed';
const CURRENT_SESSSION_KEY = STATE_PREFIX + '@current-session';
const CURRENT_DIY_KEY = STATE_PREFIX + '@current-diy';
const EDITOR_STATE_KEY = STATE_PREFIX + '@editor-state';
const DOCUMENT_ID_KEY = STATE_PREFIX + '@document-id';
const SAVED_DOCUMENTS_KEY = STATE_PREFIX + '@saved-documents';
const LOG_KEY = STATE_PREFIX + '@log';


/**
 * Local Storage Service: 
 * Responsible for working with the local storage
 */
export class LocalStorageService extends Service {
    constructor() {
        super();
    }

    private setState(key: string, stateObj: {}) {
        const stateString = JSON.stringify(stateObj);
        window.localStorage.setItem(key, stateString);
    }

    private getData<T>(key: string, defaultValue: T): T {
        const dataString = window.localStorage.getItem(key);
        if (dataString) {
            return JSON.parse(dataString) as T;
        } else {
            return defaultValue;
        }
    }

    clearDocumentState(){
        const keysToRemove = [DOCUMENT_ID_KEY,CURRENT_DIY_KEY,EDITOR_STATE_KEY,CURRENT_SESSSION_KEY];
        for (const key of keysToRemove){
            window.localStorage.removeItem(key);
        }
    }

    clearAll() {
        const keysToRemove = [
            HAS_BEEN_WELCOMED_KEY,
            CURRENT_SESSSION_KEY,
            CURRENT_DIY_KEY,
            EDITOR_STATE_KEY,
            DOCUMENT_ID_KEY,
            // SAVED_DOCUMENTS_KEY,
            LOG_KEY,
        ]
        for (const key of keysToRemove){
            window.localStorage.removeItem(key);
        }
    }

    setHasBeenWelcomed(hasBeenWelcomed = true) {
        this.setState(HAS_BEEN_WELCOMED_KEY, hasBeenWelcomed);
    }

    getHasBeenWelcomed() {
        return this.getData<boolean>(HAS_BEEN_WELCOMED_KEY, false);
    }

    setCurrentSession(sessionInfo: SessionInformation) {
        this.setState(CURRENT_SESSSION_KEY, sessionInfo);
    }

    getCurrentSession(): SessionInformation | null {
        return this.getData<SessionInformation | null>(CURRENT_SESSSION_KEY, null);
    }

    setCurrentDIY(currentDIY: CurrentDIY) {
        this.setState(CURRENT_DIY_KEY, currentDIY);
    }

    getCurrentDIY(): CurrentDIY | null {
        return this.getData<CurrentDIY | null>(CURRENT_DIY_KEY, null);
    }

    setEditorState(editorState:SerializedEditorState){
        this.setState(EDITOR_STATE_KEY,editorState);
    }

    getEditorState():SerializedEditorState|null {
        return this.getData<SerializedEditorState|null>(EDITOR_STATE_KEY,null);
    }

    setDocumentId(documentId: string){
        this.setState(DOCUMENT_ID_KEY,documentId);
    }

    getDocumentId():string|null {
        return this.getData<string|null>(DOCUMENT_ID_KEY,null);
    }


    saveDocument(documentToSave:Omit<SavedDocument,'id'>,maybeId?: string):string {
        const documentId = maybeId? maybeId : uuid();
        (documentToSave as SavedDocument).id = documentId;
        const savedDocuments = this.getData<SavedDocuments>(SAVED_DOCUMENTS_KEY, {});
        savedDocuments[documentId] = documentToSave as SavedDocument;
        this.setState(SAVED_DOCUMENTS_KEY, savedDocuments);
        return documentId;
    }

    
    deleteDocument(documentId:string) {
        const savedDocuments = this.getData<SavedDocuments>(SAVED_DOCUMENTS_KEY, {});
        delete savedDocuments[documentId];
        this.setState(SAVED_DOCUMENTS_KEY,savedDocuments);
        return documentId;
    }
    
    loadDocuments() {
        const savedDocuments = this.getData<SavedDocuments>(SAVED_DOCUMENTS_KEY,{});
        return Object.keys(savedDocuments).map((key)=> savedDocuments[key]);
    }


    setLog(log: string) {
        this.setState(LOG_KEY, log);
    }

    // test count
    setCount(count:number){
        this.setState('count',count);
    }

    getCount(): number{
        return this.getData<number>('count',0);
    }

    getState(): LocalStorageState {
        return {
            hasBeenWelcomed: this.getData<boolean>(HAS_BEEN_WELCOMED_KEY, false),
            currentSession: this.getData<SessionInformation | null>(CURRENT_SESSSION_KEY, null),
            currentDIY: this.getData<CurrentDIY | null>(CURRENT_DIY_KEY, null),
            editorState: this.getData<SerializedEditorState | null>(EDITOR_STATE_KEY, null),
            savedDocuments: this.getData<SavedDocuments>(SAVED_DOCUMENTS_KEY, {}),
        }
    }
}