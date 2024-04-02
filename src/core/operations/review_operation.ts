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

        reviewStep.onRestart(()=>{
            this.restart();
        })

        reviewStep.onCancel(()=>{
            this.cancel();
        })

    }
}