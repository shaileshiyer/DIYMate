import { MobxLitElement } from "@adobe/lit-mobx";
import { StepSliderControl } from "@core/operations/operation_controls";
import { TemplateResult, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import controlStyles from './control_styles'
import '@material/web/slider/slider'


@customElement('dm-step-slider-control')
export class StepSliderControlComponent extends MobxLitElement {
    @property({type: Object}) control!: StepSliderControl<number>;
    @property({type:Object}) onHover = (isHovered: string| TemplateResult) => {};

    static override get styles(){
        return [controlStyles]
    }

    protected render(): TemplateResult {
        const {control} = this;
        const hoverTooltip = control.getDescription();

        return html`
        <div class="row">
            <div class="operation-control-prefix"
                @mouseenter=${()=> void this.onHover(hoverTooltip)}
                @mouseleave=${()=> void this.onHover('')}
            >${control.getPrefix()}</div>
            <md-slider
            ticks
            min="0"
            max=${control.steps.length - 1}
            value=${control.value}
            @input=${
                (e:any)=> (control.value = e.target.value)
            }
            @mouseenter=${()=> void this.onHover(hoverTooltip)}
            @mouseleave=${()=> void this.onHover('')}
            ></md-slider>
            <div class="operation-control-suffix"
                @mouseenter=${()=> void this.onHover(hoverTooltip)}
                @mouseleave=${()=> void this.onHover('')}
            >${control.getSuffix()}</div>
        </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'dm-step-slider-control': StepSliderControlComponent;
    }
}