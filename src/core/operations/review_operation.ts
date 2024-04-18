import { DialogMessage } from "@models/dialog_model";
import { Operation } from ".";
import { ReviewStep } from "./steps";

/**
 * Review Operation
 */
export abstract class ReviewOperation extends Operation {
    
    get shouldReset(){
        return !this.isHelperOperation && !this.isStandaloneOperation;
    }

    isInReview(){
        return this.currentStep instanceof ReviewStep;
    }

    setReview(review:DialogMessage){
        if(this.shouldReset){
            this.resetTextEditor();
        }

        const reviewStep = new ReviewStep(
            this.serviceProvider,
            review,
        );
        this.setCurrentStep(reviewStep);

        this.loggingService.updateCounter(`${this.id}_REVIEW_SET`);
        this.loggingService.addLog(`${this.id}_REVIEW_SET`,{review});

        reviewStep.setOnSaveReviewCallback((currentReview)=>{
            if (this.shouldReset) {
                this.resetTextEditor();
            }
            this.finish(true,currentReview);
        })

        reviewStep.onRestart(()=>{
            this.restart();
        })

        reviewStep.onCancel(()=>{
            this.cancel();
        })

    }
}