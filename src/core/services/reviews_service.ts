import { ModelResult } from "@core/shared/types";
import { LocalStorageService } from "./local_storage_service";
import { OperationsService } from "./operations_service";
import { Service } from "./service";
import { action, computed, makeObservable, observable, reaction } from "mobx";
import { DialogMessage } from "@models/dialog_model";
import { DocumentStoreService } from "./document_store_service";

interface ServiceProvider {
    operationsService:OperationsService,
    localStorageService:LocalStorageService,
    documentStoreService:DocumentStoreService,

}


export type Review = {
    timestamp:number,
    review: string,
}

export type Reviews = Review[]

export class ReviewsService extends Service {
    lastReview:Review|null = null;
    reviews:Reviews = [];
    constructor(
        private readonly serviceProvider:ServiceProvider
    ){
        super();
        makeObservable(this,{
            lastReview:observable,
            reviews:observable,
            addReview:action,
            initializeFromStorage:action,
        });
        reaction(
            ()=> this.reviews,
            (reviews)=>{
                this.syncToLocalStorage(reviews);
            }
        )
    }

    get operationsService(){
        return this.serviceProvider.operationsService;
    }

    get localStorageService(){
        return this.serviceProvider.localStorageService;
    }

    get documentStoreService(){
        return this.serviceProvider.documentStoreService;
    }

    initializeFromStorage(reviews:Reviews){
        this.reviews = reviews;
    }

    private syncToLocalStorage(reviews:Reviews){
        this.localStorageService.setReviews(reviews);
    }

    addReview(response:DialogMessage){
        const newReview:Review = {
            timestamp: Date.now(),
            review:response.content,
        }
        this.lastReview = newReview;
        this.reviews= [...this.reviews,newReview];
        this.documentStoreService.saveDocument();
    }

    

}