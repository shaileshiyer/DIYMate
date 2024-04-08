import { ModelResult } from "@core/shared/types";
import { Operation } from "./operation";
import { ChoiceStep } from "./steps/choice_step";

/**
 * Multiple Choice Operation
 */
export abstract class ChoiceOperation extends Operation {
    abstract onSelectChoice(choice: ModelResult, index: number): void;
    abstract onPendingChoice(choice: ModelResult, index: number): void;

    canRewriteChoice = true;
    canStarChoice = true;

    get shouldReset() {
        return !this.isHelperOperation && !this.isStandaloneOperation;
    }

    isChoosing() {
        return this.currentStep instanceof ChoiceStep;
    }

    setChoices(choices: ModelResult[], originalChoice?: ModelResult) {
        if (this.shouldReset) {
            this.resetTextEditor();
        }
        let firstChoiceIsOriginal = false;
        if (originalChoice) {
            choices.unshift(originalChoice);
            firstChoiceIsOriginal = true;
        }

        const choiceStep = new ChoiceStep(
            this.serviceProvider,
            choices,
            this.canRewriteChoice,
            firstChoiceIsOriginal
        );
        this.setCurrentStep(choiceStep);
        // this.textEditorService.getEditor.setOptions({editorProps:{attributes:{class:"tap-editor"}}})

        this.loggingService.updateCounter(`${this.id}_CHOICES_SET`);
        this.loggingService.addLog(`${this.id}_CHOICES_SET`,{choices});

        choiceStep.onPendingChoice((choice, index) => {
            if (this.shouldReset) {
                this.resetTextEditor();
            }
            this.loggingService.updateCounter(`${this.id}_PENDING_CHOICE`);
            this.loggingService.addLog(`${this.id}_PENDING_CHOICE`,{choice});
            this.onPendingChoice(choice, index);
        });

        choiceStep.onSelectChoice((choice, index) => {
            if (this.shouldReset) {
                this.resetTextEditor();
            }
            this.onSelectChoice(choice, index);
            this.finish(true, choice);
        });

        choiceStep.onRemoveChoice((choice, index) => {
            this.loggingService.updateCounter(`${this.id}_REMOVE_CHOICE`);
            this.loggingService.addLog(`${this.id}_REMOVE_CHOICE`,{choice});
            this.onRemoveChoice(choice, index);
        });

        choiceStep.onRestart(() => {
            this.restart();
        });

        choiceStep.onCancel(() => {
            this.cancel();
        });
    }

    setChoice(choice: ModelResult) {
        if (this.shouldReset) {
          this.resetTextEditor();
        }
        this.onSelectChoice(choice, 0);
        this.finish(true /** success */, choice);
      }
    
      getPendingChoice() {
        if (this.currentStep instanceof ChoiceStep) {
          return this.currentStep.choices.getCurrentEntry();
        }
        return null;
      }
    
      onRemoveChoice(choice: ModelResult, index: number) {
        // pass
      }
}
