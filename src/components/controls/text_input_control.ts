import '@material/web/icon/icon';
import '@material/web/textfield/filled-text-field'
import '@material/web/button/outlined-button'
import {MobxLitElement} from '@adobe/lit-mobx';
import {html, TemplateResult} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';

import {TextInputControl} from '@core/operations/operation_controls';
import controlStyles from './control_styles';
/**
 * A component that displays an input text control for an operation
 */
@customElement('dm-text-input-control')
export class TextInputControlComponent extends MobxLitElement {
  @property({type: Object}) control!: TextInputControl;
  @property({type: Object}) onEnter = () => {};
  @property({type: Object}) onClickHelper = () => {};
  @property({type: Object}) onHover = (
    isHovered: string | TemplateResult
  ) => {};
  @property({type: Boolean}) override autofocus = false;

  static override get styles(){
    return [controlStyles]
}

  override firstUpdated() {
    const input = this.shadowRoot!.querySelector('md-filled-text-field.autofocus');
    if (input instanceof HTMLInputElement) {
      input.focus();

      // Reset the value to the current value in order to make the cursor appear
      // at the end of the input
      const val = input.value;
      input.value = '';
      input.value = val;
    }
  }

  override render() {
    const inputClasses = classMap({
      autofocus: this.autofocus,
      'text-input-control': true,
    });

    const {control} = this;
    const hoverTooltip = control.getDescription();

    // clang-format off
    return html`
      <div class="row">
        <div class="operation-control-prefix"
          @mouseenter=${() => void this.onHover(hoverTooltip)}
          @mouseleave=${() => void this.onHover('')}
        >${control.getPrefix()} :</div>
        <div class="operation-control-input">
          <md-filled-text-field
            type='text'
            class=${inputClasses}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopImmediatePropagation();
                this.onEnter();
                return false;
              }
              return true;
            }}
            @input=${
              // tslint:disable-next-line:no-any
              (e: any) => (control.value = e.target.value)
            }
            value='${control.value}'
            placeholder='${control.placeholder}'
            @mouseenter=${() => void this.onHover(hoverTooltip)}
            @mouseleave=${() => void this.onHover('')}
            ></md-filled-text-field>
          </div>
      </div>
      ${this.renderHelperOperationButton()}
    `;
    // clang-format on
  }

  renderHelperOperationButton() {
    const {control} = this;

    if (!control.hasHelperOperation()) return '';
    const hoverTooltip = control.helperOperation!.getDescription();

    // clang-format off
    return html`
      <div class="row">
        <div class="operation-control-prefix"></div>
        <span class="helper-operation-container">
          or...
          <md-outlined-button
            type="button"
            class="helper-operation"
            @click=${() => {
              this.onClickHelper();
            }}
            @mouseenter=${() => void this.onHover(hoverTooltip)}
            @mouseleave=${() => void this.onHover('')}
          >
            ${control.helperOperation!.getButtonLabel()}
        </md-outlined-button>
        </span>
      </div>
    `;
    // clang-format on
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'dm-text-input-control': TextInputControlComponent;
  }
}
