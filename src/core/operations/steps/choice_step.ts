import { Choices } from "@lib/choices";
import { OperationsService } from "@core/services/operation_service";
import { ModelResult, StepLifecycle } from "@core/shared/types";
import { Step } from "./step";
import { reaction } from "mobx";


export type ChoiceCallback = (choice:ModelResult,index:number)=> void;

export type RemoveChoiceCallback = (
    choice:ModelResult,
    index:number,
    isEmpty:boolean,
) => void;

interface ServiceProvider {
    operationsService:OperationsService;
}


export class ChoiceStep extends Step{


    choices = new Choices<ModelResult>();
    constructor(
        private readonly serviceProvider: ServiceProvider,
        choices: ModelResult[],
        public canRewriteChoice = false,
        public firstChoiceIsOriginal = false,
    ){
        super();
        this.choices.setEntries(choices);
    }

    get operationsService(){
        return this.serviceProvider.operationsService;
    }

    override setup(){
        this.observeChoices();
    }

    override cleanup(): void {
        this.clearChoiceObserver();    
    }

    override pause(): void {}
    override unpause(): void {}

    private clearChoiceObserver = ()=>{};

    observeChoices() {
        // Tie the observable state to the text editor
        const indexReactionDisposer = reaction(
          () => {
            const index = this.choices.getIndex();
            const nChoices = this.choices.getNEntries();
            return {index, nChoices};
          },
          ({index, nChoices}) => {
            if (nChoices) {
              this.setPendingChoiceIndex(index);
            }
          }
        );
    
        this.clearChoiceObserver = () => {
          indexReactionDisposer();
          this.clearChoiceObserver = () => {};
        };
      }
    
      private chooseCallback: ChoiceCallback = () => {};
      onSelectChoice(callback: ChoiceCallback) {
        this.chooseCallback = callback;
      }
    
      private pendingChoiceCallback: ChoiceCallback = () => {};
      onPendingChoice(callback: ChoiceCallback) {
        this.pendingChoiceCallback = callback;
        if (this.choices.getNEntries()) {
          this.setPendingChoiceIndex(this.choices.getIndex());
        }
      }
    
      private removeChoiceCallback: RemoveChoiceCallback = () => {};
      onRemoveChoice(callback: RemoveChoiceCallback) {
        this.removeChoiceCallback = callback;
      }
    
      chooseCurrentIndex() {
        this.chooseIndex(this.choices.getIndex());
      }
    
      chooseIndex(index: number) {
        const choice = this.choices.getEntry(index);
        if (choice != null) {
          this.chooseCallback(choice, index);
        }
      }
    
      removeChoiceIndex(index: number) {
        const choice = this.choices.getEntry(index);
        this.choices.removeAtIndex(index);
        const isEmpty = this.choices.getNEntries() === 0;
        if (choice != null) {
          this.removeChoiceCallback(choice, index, isEmpty);
        }
      }
    
      setPendingChoiceIndex(index: number) {
        const choice = this.choices.getEntry(index);
        if (choice != null) {
          this.pendingChoiceCallback(choice, index);
        }
      }

}