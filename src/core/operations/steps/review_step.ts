import { Step } from ".";
import { makeObservable, observable, reaction } from "mobx";
import { DialogMessage } from "@models/dialog_model";
import { ReviewsService } from "@core/services/reviews_service";

interface ServiceProvider {
    reviewsService:ReviewsService;
}

export class ReviewStep extends Step {
    
    review:DialogMessage|null = null;

    constructor(
        private readonly serviceProvider: ServiceProvider,
        review: DialogMessage,
    ){
        super();
        makeObservable(this,{
            review:observable,
        })
        this.review = review;
    }


    get reviewsService(){
        return this.serviceProvider.reviewsService;
    }

    override setup(){
        this.setReview();
    }

    override cleanup(){

    }

    override pause(): void { }
    override unpause(): void { }

    private exitReview = ()=>{ }

    setReview(){
        if (this.review){
            this.reviewsService.addReview(this.review);
        }
    }
}