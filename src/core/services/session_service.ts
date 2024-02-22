import { flow, makeObservable, observable } from "mobx";
import { Service } from "./service";
import { LocalStorageService } from "./local_storage_service";

export interface SessionInformation {
    session_id: string;
    thread_id: string;
    created_at: number;
}

interface SessionResponse extends Partial<SessionInformation> {
    status: string;
    path?:string;
    message?: string;
    verification_code?: string;
}

interface ServiceProvider {
    localStorageService:LocalStorageService;
}


const defaultSession:SessionInformation = {
    session_id:'',
    thread_id:'',
    created_at:-1,
}

/**
 * Session Service: 
 * Responsible for managing the current session
 */
export class SessionService extends Service {

    sessionInfo: SessionInformation = defaultSession;

    isSessionActive:boolean = false;

    constructor(private readonly serviceProvider:ServiceProvider) {
        super();
        makeObservable(this,{
            sessionInfo:observable,
            isSessionActive:observable,
            startSession:flow,
            endSession:flow,
        })
        const sessionInfo = this.localStorageService.getCurrentSession();
        if (sessionInfo!== null){
            this.sessionInfo = sessionInfo;
            this.isSessionActive = true;
        }
    }


    private get localStorageService():LocalStorageService{
        return this.serviceProvider.localStorageService;
    }

    *startSession(signal?:AbortSignal) {
        try {
            const response: Response = yield fetch(`${import.meta.env.VITE_BACKEND_API_URL}/start_session`, { 
                method: 'POST',
                headers:{
                    "Content-Type":"application/json",
                },
                body:JSON.stringify(""),
                signal,
             });
            if (!response.ok) {
                throw Error('Start Session Response was not ok.')
            }
            const json: SessionResponse = yield response.json();
            this.sessionInfo = json as SessionInformation;
            this.localStorageService.setCurrentSession(this.sessionInfo);
            this.isSessionActive = true;
            return this.sessionInfo;
        } catch (error) {
            console.error('Something went wrong with the api call', error);
            throw error;
        }
    }

    *endSession(logs:string="",signal?:AbortSignal) {
        try {
            const response: Response = yield fetch(
                `${import.meta.env.VITE_BACKEND_API_URL}/end_session`,
                {
                    method: 'POST',
                    headers:{
                        "Content-Type":"application/json",
                    },
                    body:JSON.stringify({
                        sessionId:this.sessionInfo?.session_id,
                        logs,
                    })
                },
            );
            if (!response.ok) {
                throw Error('End Session Response was not ok.')
            }
            const json: SessionResponse = yield response.json();
            if (json.status==="false"){
                console.debug(json);
                throw Error('End session failed');
            }
            this.isSessionActive = false;
            return true;
        } catch (error) {
            console.error('Something went wrong with the api call', error);
            throw error;
        }
    }

}