import { MobxLitElement } from "@adobe/lit-mobx";
import { diymateCore } from "@core/diymate_core";
import { TextEditorService } from "@core/services/text_editor_service";
import { TemplateResult, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@material/web/textfield/outlined-text-field";
import "@material/web/button/filled-button";
import { HTMLElementEvent } from "@core/shared/types";
import { Ref, createRef, ref } from "lit/directives/ref.js";
import { SessionService } from "@core/services/session_service";

@customElement("dm-image-dialog")
export class ImageUploadDialog extends MobxLitElement {
    static override get styles() {
        const styles = css`
            .form-wrapper{
                display:flex;
                flex-direction:column;
                row-gap: 10px;
                
            }
        `;

        return [styles];
    }

    @property({ type: Object }) close = () => {};
    @property({ type: String }) alternateTitle = "";
    @property({ type: String }) imageTitle = "";
    @property({type:Boolean}) isLoading = false;

    private readonly textEditorService = diymateCore.getService(TextEditorService);
    private readonly sessionService = diymateCore.getService(SessionService);

    formElement: Ref<HTMLFormElement> = createRef();

    async formSubmitHandler(e){
        e.preventDefault();
        this.isLoading = true;
        const formData = new FormData(this.formElement.value);

        formData.append('session_id',this.sessionService.sessionInfo.session_id);
        console.debug(formData);
        const response = await fetch(
            `${import.meta.env.VITE_BACKEND_API_URL}/upload`,
                {
                    method: 'POST',
                    body:formData
                },
        );

        if (!response.ok) {
            this.isLoading = false;
            console.error('Something went wrong')
        }
        const json = await response.json();
        if (json.status==="false"){
            this.isLoading = false;
            console.debug(json);
            console.error('Something went wrong');
        }
        console.debug(json);
        const {filepath,status}:{filepath:string,status:boolean} = json
        if(status){
            const filename = filepath.slice(2);
            this.textEditorService.getEditor
            .chain()
            .focus()
            .setImage({
                src:`${import.meta.env.VITE_BACKEND_URL}/${filename}`,
                title:this.imageTitle,
                alt:this.alternateTitle,
            })
            .run();
            this.isLoading = false;
            this.close();
        }


    }

    render(): TemplateResult {
        return html`
            <div class="image-dialog-wrapper">
                <h3>Image Upload</h3>
                <form class="form-wrapper" name="imageForm" enctype="multipart/form-data" ${ref(this.formElement)}>
                    <input type="file" name="file" accept=".jpg,.jpeg,.png"></input>
                    <md-outlined-text-field 
                    label="alt" 
                    @input=${(e: HTMLElementEvent<HTMLInputElement>) =>
                        (this.alternateTitle = e.target.value)}
                    .value=${this.alternateTitle}
                    ?disabled=${this.isLoading}
                    >
                    </md-outlined-text-field>
                    <md-outlined-text-field 
                    label="title"
                    @input=${(e: HTMLElementEvent<HTMLInputElement>) =>
                        (this.imageTitle = e.target.value)}
                    .value=${this.imageTitle}
                    ?disabled=${this.isLoading}
                    >
                </md-outlined-text-field>
                <md-filled-button 
                type="submit"
                @click=${(e)=> this.formSubmitHandler(e)}
                ?disabled=${this.isLoading}
                >
                    Add
                </md-filled-button>
                </form>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "dm-image-dialog": ImageUploadDialog;
    }
}
