import { MobxLitElement } from "@adobe/lit-mobx";
import { TemplateResult, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@material/web/textfield/filled-text-field";
import "@material/web/select/filled-select";
import { diymateCore } from "@core/diymate_core";
import { InitializationService, LoggingService, RouterService, SessionService } from "@core/services/services";
import "@material/web/select/select-option";
import "@material/web/button/filled-button";
import { DemographicsForm } from "@core/services/logging_service";
import { Task } from "@lit/task";



@customElement('demographics-page')
export class DemographicsPage extends MobxLitElement {
    static override get styles(){
        const pageStyle = css`
            #demographics-wrapper {
                display: flex;
                flex-direction: column;
                justify-content: start;
                min-width: 1280px;
                margin: 0 auto;
                padding: 2em auto;
                place-items: center;
                min-height: 100vh;
            }

            .space {
                margin-top:1em;
            }

            .bottom-bar {
                display: flex;
                justify-content: space-between;
                margin: 2em 0;
            }
        `;

        return [pageStyle];
    }

    @property({ type: Boolean })
    private isLoading = false;
    
    private readonly sessionService = diymateCore.getService(SessionService);
    private readonly routerService = diymateCore.getService(RouterService);
    private readonly loggingService = diymateCore.getService(LoggingService);

    constructor(){
        super();
        this._formSubmitTask.autoRun = false;
    }

    connectedCallback(): void {
        super.connectedCallback();
        this.loggingService.addLog('PAGE_NAVIGATE',{page:'demographics-form-page'});
    }

    private _formSubmitTask = new Task(this,{
        task:async([],{signal})=>{
            const element = this.shadowRoot?.getElementById('demo-form');
            this.isLoading = true;
            if(element){
                const formElement = element as HTMLFormElement;
                const isFormValid = formElement.checkValidity();
                if (isFormValid){
                        const formObject:any = {};
                        const formData = new FormData(formElement);
                        formData.forEach((val,key)=> {formObject[key]=val;});
                        console.debug(formObject);
                        if (!this.sessionService.isSessionActive) {
                            await this.sessionService.startSession(signal);
                        }
                        // Store Data
                        await this.loggingService.storeFormData(formObject as DemographicsForm);
                        await this.loggingService.addLog('DEMOGRAPHICS_FORM_COMPLETE',{info:'demographics form was submitted.'});
                }
                return isFormValid;
            }
            return false;
        },
        onError:(err)=>{
            this.isLoading = false;
        },
        onComplete:(val)=>{
            this.isLoading = false;
            if (val){
                // Redirect to new Page
                this.loggingService.addLog("TASK_START", {
                    info: "The diy task has started",
                });
                this.routerService.getRouter().render('/new',true);
            }
        },
        args:()=>[],
    });

    private async onSubmitForm(e){
        // e.preventDefault();

        this._formSubmitTask.run();
    }

    protected submitFormTask():TemplateResult {
        return this._formSubmitTask.render({
            initial: () => html``,
            pending: () => html`<p>Submitting Form...</p>`,
            complete: (value) => {
                return html``;
            },
            error: (error) => html`<p>Something went wrong:${error}</p>`,
        });
    }

    protected render(): TemplateResult {
        return html`
        <div id="demographics-wrapper">
            <div class="demo">
                <h1>Demographics - Pre-Task Questionnaire</h1>
                <form id="demo-form" name="demo-form">
                    <div>Age:</div>
                    <md-filled-text-field required autocomplete="off" placeholder="23" name="age" type="text" ?disabled=${this.isLoading}></md-filled-text-field>
                    <div class="space">Gender:</div>
                    <md-filled-text-field required autocomplete="off" placeholder="M/F/D" name="gender" type="text" autocapitalize="characters" maxLength=1 ?disabled=${this.isLoading}></md-filled-text-field>
                    <div class="space">Current Occupation/Field of Study:</div>
                    <md-filled-text-field required autocomplete="off" placeholder="Computer Science/Electrical Engineer/..." name="occupation" type="text" ?disabled=${this.isLoading}></md-filled-text-field>
                    <div class="space">How long have you been in involved in DIY in terms of years?</div>
                    <md-filled-text-field required autocomplete="off" placeholder="2" name="diy_experience" type="text" ?disabled=${this.isLoading}></md-filled-text-field>
                    <div class="space">How often have you carried out a DIY project?</div>
                    <md-filled-select required name="diy_frequency">
                        <md-select-option value="Almost Never">Almost Never</md-select-option>
                        <md-select-option value="Once a week">Once a Week</md-select-option>
                        <md-select-option value="Once a Month">Once a Month</md-select-option>
                        <md-select-option value="Every Couple of Months">Every Couple of Months</md-select-option>
                        <md-select-option value="Once a Year">Once a Year</md-select-option>
                    </md-filled-select>
                    <div class="space">Have you written a DIY Tutorial before?</div>
                    <md-filled-select required name="diy_tut_written_before">
                        <md-select-option value="no">No</md-select-option>
                        <md-select-option value="yes">Yes</md-select-option>
                    </md-filled-select>
                    <div class="space">How often have you written a DIY Tutorial for a DIY project before?</div>
                    <md-filled-select required name="diy_tut_frequency">
                        <md-select-option value="Almost Never">Almost Never</md-select-option>
                        <md-select-option value="Rarely">Rarely</md-select-option>
                        <md-select-option value="Occassionally">Occasionally</md-select-option>
                        <md-select-option value="Often">Often</md-select-option>
                        <md-select-option value="Very Often">Very Often</md-select-option>
                        <md-select-option value="Almost Everytime">Almost Everytime</md-select-option>
                    </md-filled-select>
                    <div>${this.submitFormTask()}</div>
                    <div class="bottom-bar">
                        <md-text-button
                            href="/"
                        >
                        Back
                        </md-text-button>
                        <md-filled-button 
                            type="button"
                            @click=${this.onSubmitForm}
                        >
                            Continue
                        </md-filled-button>
                    </div>
                </form>
            </div>
        </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'demographics-page': DemographicsPage;
    }
}