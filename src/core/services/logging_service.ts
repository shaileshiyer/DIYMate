import { DBSchema, IDBPDatabase, openDB } from "idb";
import { Service } from "./service";
import { SessionService } from "./session_service";
import { LocalStorageService } from "./local_storage_service";

interface ServiceProvider {
    sessionService:SessionService,
    localStorageService:LocalStorageService,
}

const DATABASE_NAME = "diymate-database"
const CURRENT_VERSION = 1;
const LOG_STORE = "diymate-log-store"
const FORM_STORE = "diymate-form-store"
const COUNT_STORE = "diymate-count-store"


export interface DemographicsForm {
    age :string;
    gender:string;
    occupation:string;
    diy_experience:string;
    diy_frequency:string;
    diy_tut_written_before:string;
    diy_tut_frequency:string;
}

interface LogRecord {
    id:number;
    session_id:string;
    timestamp:number;
    created:string;
    operation:string;
    data:any;
}

interface DIYMateDB extends DBSchema {
    'diymate-form-store':{
        value:{
            session_id:string,
            age :string,
            gender:string,
            occupation:string,
            diy_experience:string,
            diy_frequency:string,
            diy_tut_written_before:string,
            diy_tut_frequency:string,
        }
        key: string;
        indexes:{'session_id':string};
    };
    'diymate-log-store':{
        value:{
            id:number,
            session_id:string,
            timestamp:number,
            created:string,
            operation:string,
            data:any,
        };
        key:number;
        indexes:{'session_id':string};
    };
    'diymate-count-store':{
        value:{
            session_id:string,
            counters: {
                [key:string]:number,
            }
        };
        key:string;
        indexes:{'session_id':string};
    };
}; 

export class LoggingService extends Service {


    constructor(private readonly serviceProvider:ServiceProvider){
        super();


        // Init the Database
        this.databaseInit();

    }

    get sessionService(){
        return this.serviceProvider.sessionService;
    }
    
    get localStorageService(){
        return this.serviceProvider.localStorageService;
    }

    async databaseInit(){

        // Request persistent storage for site
        if (navigator.storage && navigator.storage.persist) {
            const storageEstimate = await navigator.storage.estimate();
            const isPersisted = await navigator.storage.persist();
            const storageUsed = storageEstimate.usage/storageEstimate.quota*100;
            console.debug(`Persisted storage: ${isPersisted}\nStorage Use estimated: ${storageUsed}%`);
        }
        

        const dbPromise = await openDB<DIYMateDB>(DATABASE_NAME,CURRENT_VERSION,{
            upgrade(database, oldVersion, newVersion, transaction, event) {
                switch(oldVersion){
                    case 0:{
                        console.debug(database.objectStoreNames);
                        if(!database.objectStoreNames.contains(FORM_STORE)){
                            const formStore = database.createObjectStore(FORM_STORE,{keyPath:'session_id'});
                        }
        
                        if(!database.objectStoreNames.contains(LOG_STORE)){
                            const logStore = database.createObjectStore(LOG_STORE,{keyPath:'id',autoIncrement:true});
                            logStore.createIndex('session_id','session_id',{unique:false})
                        }
        
                        if(!database.objectStoreNames.contains(COUNT_STORE)){
                            const countStore = database.createObjectStore(COUNT_STORE,{keyPath:'session_id'});
                        }
                    }
                }

            },
        });
        return dbPromise;
    }

    /**
     * Stores the demographic form data for the current session user.
     * @param formData - Demographics form data.
     */
    async storeFormData(formData:DemographicsForm){
        try{
            const db = await openDB<DIYMateDB>(DATABASE_NAME,CURRENT_VERSION);
        
            const session_id = this.sessionService.sessionInfo.session_id;
            const tx = db.transaction(FORM_STORE,'readwrite');
            const store = tx.objectStore(FORM_STORE);
            const newVal = {
                session_id:session_id,
                ...formData,
            }
            const val = (await store.get(session_id))|| newVal;
    
            await Promise.all([
                store.put(val),
                tx.done,
            ]) 
    
        } catch(err){
            console.error(err);
        }
    }

    /**
     * Adds a log record of the operation with associated data.
     * For the current session user.
     * @param logOperation - Name of the operation
     * @param data - Data associated with the operation to be stored.
     */
    async addLog(logOperation:string,data:any){
        try{
            const db = await openDB<DIYMateDB>(DATABASE_NAME,CURRENT_VERSION);
        
            const session_id = this.sessionService.sessionInfo.session_id;
            const tx = db.transaction(LOG_STORE,'readwrite');
            const store = tx.objectStore(LOG_STORE);
            const newVal = {
                session_id:session_id,
                timestamp: Date.now(),
                created: new Date().toString(),
                operation: logOperation,
                data:data,
            }
            const val = newVal;
    
            await Promise.all([
                //@ts-ignore
                store.add(val),
                tx.done,
            ]) 
    
        } catch(err){
            console.error(err);
        }
    }

    /**
     * Updates the counter in the data collected.
     * For the current session user.
     * @param counter_string: Name of the counter to update.
     */
    async updateCounter(counter_string:string){
        try{
            const db = await openDB<DIYMateDB>(DATABASE_NAME,CURRENT_VERSION);
        
            const session_id = this.sessionService.sessionInfo.session_id;
            const tx = db.transaction(COUNT_STORE,'readwrite');
            const store = tx.objectStore(COUNT_STORE);
            const newVal = {
                session_id:session_id,
                counters:{

                } as {[key:string]:number}
            }
            const val = (await store.get(session_id))|| newVal;

            val.counters[counter_string] = val.counters[counter_string] || 0;
            val.counters[counter_string]+=1;
            await Promise.all([
                store.put(val),
                tx.done,
            ]) 
    
        } catch(err){
            console.error(err);
        }
    }

    async getParticipantFormData(){
        try{
            const db = await openDB<DIYMateDB>(DATABASE_NAME,CURRENT_VERSION);
            const session_id = this.sessionService.sessionInfo.session_id;

            const formValue = await db.get(FORM_STORE,session_id);
            return formValue;
        } catch(err){
            console.error(err);
        }
    }

    async getParticipantCounters(){
        try{
            const db = await openDB<DIYMateDB>(DATABASE_NAME,CURRENT_VERSION);
            const session_id = this.sessionService.sessionInfo.session_id;

            const counters = await db.get(COUNT_STORE,session_id);
            return counters;
        } catch(err){
            console.error(err);
        }
    }

    async getParticipantLogs(){
        try{
            const db = await openDB<DIYMateDB>(DATABASE_NAME,CURRENT_VERSION);
            const session_id = this.sessionService.sessionInfo.session_id;

            const tx = await db.transaction(LOG_STORE,'readonly');
            const index = tx.store.index('session_id');
            let cursor = await index.openCursor(session_id);
            const logs:LogRecord[] = [];
            if (!cursor){
                return logs;
            }
            while (cursor){
                logs.push(cursor.value);
                cursor = await cursor.continue();
            }
            return logs;
        } catch(err){
            console.error(err);
        }
    }

    async exportParticipantData():Promise<string>{
        const documentId = this.localStorageService.getDocumentId();
        try {
            if (documentId!== null){
                const document = this.localStorageService.loadDocument(documentId);
                const preTaskForm = await this.getParticipantFormData();
                const counters = await this.getParticipantCounters();
                const logs = await this.getParticipantLogs();
    
                const participantData = {
                    document,
                    preTaskForm,
                    counters,
                    logs,
                };
    
                const exportData = JSON.stringify(participantData);
                return exportData;
            }
        } catch(err){
            console.error(err);
        }
        return "";
    }
   
}