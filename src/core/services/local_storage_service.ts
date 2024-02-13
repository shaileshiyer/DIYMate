import { Service } from "./service";
import { SerializedEditorState } from "lexical";
import { SessionInformation } from "./session_service";

export interface CurrentDIY {
    description: string;
    outlinePrompt: string;
};

export interface SavedDocument {
    sessionInfo: SessionInformation;
    document: SerializedEditorState;
    description: string;
    initialOutline: string;
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

    clearAll() {
        const keysToRemove = [
            HAS_BEEN_WELCOMED_KEY,
            CURRENT_SESSSION_KEY,
            CURRENT_DIY_KEY,
            EDITOR_STATE_KEY,
            SAVED_DOCUMENTS_KEY,
            LOG_KEY,
        ]
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

    // TODO: saveDocument
    saveDocument() {
        return new Error('has not been implemented yet.')
    }

    
    // TODO: clearDocuments
    deleteDocument() {
        return new Error('has not been implemented yet.')
    }
    
    // TODO: loadDocuments
    loadDocuments() {
        return new Error('has not been implemented yet.')
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