import { MobxLitElement } from "@adobe/lit-mobx";
import { LitElement, TemplateResult, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import "@material/web/textfield/outlined-text-field";
import "@material/web/iconbutton/filled-tonal-icon-button";
import "@material/web/iconbutton/filled-icon-button";
import "@material/web/iconbutton/outlined-icon-button";
import "@material/web/icon/icon";
import { HTMLElementEvent } from "@core/shared/types";
import { classMap } from "lit/directives/class-map.js";
import { diymateCore } from "@core/diymate_core";
import { ChatService } from "@core/services/chat_service";

@customElement("diymate-chat")
export class Chat extends MobxLitElement {
    static override get styles() {
        const styles = css`
            :host {
                display: flex;
                flex-direction: column;
                height: calc(95vh - 50px);
            }

            .messages-container {
                flex: 1;
                overflow: auto;
                padding: 35px;
            }

            .input-container {
                flex: 0;
                border-top: 1px solid var(--medium-gray);
                padding: 20px 15px;
                display: flex;
                flex-direction: column;
                align-items: flex-start;
            }

            .input-container.disabled {
                opacity: 0.7;
                pointer-events: none;
            }

            .left-side-msg,
            .right-side-msg {
                overflow: hidden;
                flex-direction: row;
                width: 100%;
                display: flex;
            }

            .left-side-msg {
                justify-content: flex-start;
            }

            .right-side-msg {
                justify-content: flex-end;
            }

            .usr-msg {
                --text-bubble-text_-_background-color: var(--md-sys-color-primary-container);
                --text-bubble-text_-_border-radius: 24px 24px 0 24px;
                --text-bubble-text_-_color: var(--md-sys-color-on-primary-container);
                --text-bubble-text_-_white-space: pre-wrap;
                --text-bubble-text_-_border-style: initial;
                --text-bubble-text_-_border-width: initial;
                --text-bubble-text_-_border-color: initial;
                --text-bubble-text_-_font-weight: initial;
                --text-bubble-text_-_font-style: initial;
            }

            .agent-msg {
                --text-bubble-text_-_background-color: var(--md-sys-color-secondary-container);
                --text-bubble-text_-_border-radius: 24px 24px 24px 0;
                --text-bubble-text_-_border-style: solid;
                --text-bubble-text_-_border-width: thin;
                --text-bubble-text_-_border-color: lightgray;
                --text-bubble-text_-_color: var(--md-sys-color-on-secondary-container);
                --text-bubble-text_-_white-space: pre-wrap;
            }

            .bubble-text {
                display: flex;
                color: black;
                margin-bottom: 8px;
                padding: 12px 16px;
                outline: none;
                background-color: var(--text-bubble-text_-_background-color);
                border-radius: var(--text-bubble-text_-_border-radius);
                color: var(--text-bubble-text_-_color, black);
                white-space: var(--text-bubble-text_-_white-space);
                font-family: var(--text-bubble-text_-_font-family);
                border-style: var(--text-bubble-text_-_border-style);
                border-width: var(--text-bubble-text_-_border-width);
                border-color: var(--text-bubble-text_-_border-color);
                font-weight: var(--text-bubble-text_-_font-weight);
                font-style: var(--text-bubble-text_-_font-style);
            }

            .row {
                display: flex;
                flex-direction: row;
                align-items: flex-start;
                width: 100%;
            }

            .row.centered {
                align-items: center;
            }

            .text-input {
                padding: 6px;
                padding: 0.4em;
                width: 100%;
                height: 100px;
                resize: none;
            }

            mwc-checkbox {
                --mdc-checkbox-unchecked-color: var(--blue);
                --mdc-theme-secondary: var(--blue);
                margin-left: -12px;
            }

            .buttons-container md-filled-tonal-icon-button {
                /* flex: 0 1 0%;
                margin-left: 10px;
                display: flex;
                padding: 2px 5px; */
                margin-bottom: 10px;
            }

            .buttons-container {
                margin-left: 1em;
                display: flex;
                flex-direction: column;
            }

            .loading-wrapper {
                display: flex;
                width: 100%;
                align-items: center;
                justify-content: center;
                margin: 5px 30px;
            }

            .dot-flashing {
                position: relative;
                width: 10px;
                height: 10px;
                border-radius: 5px;
                background-color: var(--blue);
                color: var(--blue);
                animation: dotFlashing 1s infinite linear alternate;
                animation-delay: 0.5s;
            }

            .dot-flashing::before,
            .dot-flashing::after {
                content: "";
                display: inline-block;
                position: absolute;
                top: 0;
            }

            .dot-flashing::before {
                left: -15px;
                width: 10px;
                height: 10px;
                border-radius: 5px;
                background-color: var(--blue);
                color: var(--blue);
                animation: dotFlashing 1s infinite alternate;
                animation-delay: 0s;
            }

            .dot-flashing::after {
                left: 15px;
                width: 10px;
                height: 10px;
                border-radius: 5px;
                background-color: var(--blue);
                color: var(--blue);
                animation: dotFlashing 1s infinite alternate;
                animation-delay: 1s;
            }

            @keyframes dotFlashing {
                0% {
                    opacity: 1;
                }
                50%,
                100% {
                    opacity: 0.3;
                }
            }
        `;

        return [styles];
    }

    private chatService = diymateCore.getService(ChatService);
    private nMessages = 0;

    private readonly onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            e.stopImmediatePropagation();
            this.chatService.sendMessage();
            return false;
        }
        return true;
    };

    private renderMessages() {
        const messages = this.chatService.messagesToDisplay.map(
            (message, index) => {
                const isModelMessage = message.role === "assistant";
                const sideClass = isModelMessage
                    ? "left-side-msg"
                    : "right-side-msg";
                const bubbleClass = isModelMessage ? "agent-msg" : "usr-msg";
                return html`
                    <div class=${sideClass}>
                        <div class="bubble-text ${bubbleClass}">
                            ${message.content}
                        </div>
                    </div>
                `;
            }
        );

        if (this.chatService.isLoading) {
            const loadingBubble = html`
                <div class="left-side-msg">
                    <div class="bubble-text agent-msg">
                        <div class="loading-wrapper">
                            <div class="dot-flashing"></div>
                        </div>
                    </div>
                </div>
            `;
            messages.push(loadingBubble);
        }

        return messages;
    }

    override updated() {
        if (this.chatService.messages.length !== this.nMessages) {
          const messagesContainer = this.shadowRoot!.querySelector(
            '.messages-container'
          )!;
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
          this.nMessages = this.chatService.messages.length;
        }
      }

    protected render(): TemplateResult {
        const { isLoading, currentMessage } = this.chatService;

        const inputContainerClasses = classMap({
            "input-container": true,
            disabled: isLoading,
        });

        const isSendButtonDisabled = isLoading || currentMessage.length === 0;

        return html`
            <div class="messages-container">${this.renderMessages()}</div>
            <div class=${inputContainerClasses}>
                <div class="row">
                    <md-outlined-text-field
                        ?disabled=${isLoading}
                        spellcheck="false"
                        class="text-input"
                        label="Message"
                        type="textarea"
                        .value=${this.chatService.currentMessage}
                        @keydown=${this.onKeyDown}
                        @input=${(e: HTMLElementEvent<HTMLTextAreaElement>) => {
                            this.chatService.setCurrentMessage(e.target.value);
                        }}
                        placeholder="Say something to DIYMate..."></md-outlined-text-field>
                    <div class="buttons-container">
                        <md-filled-tonal-icon-button
                        @click=${()=>{this.chatService.sendMessage()}}
                        ?disabled=${isSendButtonDisabled}
                        >
                            <md-icon>
                                <span class="material-symbols-outline">
                                    send
                                </span>
                            </md-icon>
                        </md-filled-tonal-icon-button>
                        <md-filled-tonal-icon-button
                        ?disabled=${isLoading}
                        @click=${()=>{this.chatService.sendCurrentDIYTutorial()}}
                        >
                            <md-icon>
                                <span class="material-symbols-outline">
                                    upload
                                </span>
                            </md-icon>
                        </md-filled-tonal-icon-button>
                    </div>
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "diymate-chat": Chat;
    }
}
