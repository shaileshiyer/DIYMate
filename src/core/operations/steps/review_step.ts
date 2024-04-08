import { Step } from ".";
import { makeObservable, observable, reaction } from "mobx";
import { DialogMessage } from "@models/dialog_model";
import { ReviewsService } from "@core/services/reviews_service";

interface ServiceProvider {
    reviewsService:ReviewsService;
}

type ReviewCallback = (review:DialogMessage|null)=> void;

export class ReviewStep extends Step {
    
    review:DialogMessage|null = null;

    constructor(
        private readonly serviceProvider: ServiceProvider,
        review: DialogMessage,
    ){
        super();
        makeObservable(this,{
            review:observable.ref,
        })
        this.review = review;
    }


    get reviewsService(){
        return this.serviceProvider.reviewsService;
    }

    override setup(){

    }

    override cleanup(){

    }

    override pause(): void { }
    override unpause(): void { }

    private exitReview = ()=>{ }

    private onSaveReviewCallback:ReviewCallback= ()=>{ };
    setOnSaveReviewCallback(callback:ReviewCallback){
        this.onSaveReviewCallback = callback;
    }
    
    saveReview(){
        if (this.review){
            this.reviewsService.addReview(this.review);
        }
        this.onSaveReviewCallback(this.review);
    }
}