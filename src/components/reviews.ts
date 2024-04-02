import { MobxLitElement } from "@adobe/lit-mobx";
import { diymateCore } from "@core/diymate_core";
import { ReviewsService } from "@core/services/reviews_service";
import { TemplateResult, css, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement('dm-review-tab')
export class ReviewTabComponent extends MobxLitElement {

    private reviewService = diymateCore.getService(ReviewsService);

    static override get styles(){

        const styles = css`
            :host {
                display: flex;
                flex-direction: column;
                width: 100%;
                height: 100%;
            }

            .review-tab-container{
                display: flex;
                flex-direction: column;
            }

            .review {
                display:flex;
                flex-direction:column;
            }

            .review-title {
                text-transform: uppercase;
                color:var(--md-sys-color-primary);
                font-weight: 600;
            }

            .review-content {
                white-space: pre-line;
            }

        `;
        return [styles];
    }

    protected render(): TemplateResult {

        const reviewsReversed = [...this.reviewService.reviews].reverse();
        const reviewsLength = reviewsReversed.length;
        if (this.isEmpty()){
            return html`
                <div class="review-tab-container">
                    Sorry No reviews are currently stored. To see reviews here please 
                    go back to the controls tab and run the Review DIY or Review DIY 
                    Selection operation. 
                </div>
            `
        }
        return html`
        <div class="review-tab-container">
            ${reviewsReversed.map((review,index)=>{
                const reviewDate = new Date(review.timestamp);
                const options: Intl.DateTimeFormatOptions = {
                    year: "2-digit",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: 'Europe/Berlin', // Set time zone to Germany (Berlin)
                  };
                
                  // Use toLocaleDateString and toLocaleTimeString for formatting
                  const dateString = reviewDate.toLocaleDateString('en-US', options);
                
                return html`
                <div class="review">
                    <div class="review-title">Review ${reviewsLength - index} ${dateString}</div>
                    <div class="review-content">${review.review}</div>
                </div>
                `;
            })}
        </div>
        `;
    }

    isEmpty(){
        const reviews = this.reviewService.reviews;
        return reviews.length === 0;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'dm-review-tab': ReviewTabComponent;
    }
}