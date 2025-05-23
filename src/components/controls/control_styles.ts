import { css } from "lit";

const styles = css`
    :host{
        --md-outlined-button-container-shape: 0px;
    }
    .input-control {
        margin: 0;
        padding: 2px;
    }

    input,
    textarea {
        font-family: inherit;
        font-size: inherit;
        box-sizing: border-box;
        border: 1px solid #ccc;
        border-radius: 2px;
        padding: 0.4em;
        background-color: var(--md-sys-color-surface-container-highest);
        color: var(--md-sys-color-on-surface);
        border-bottom: 1px solid var(--md-sys-color-scrim);
    }

    .text-input-control:focus{
        outline: none;
        border-bottom: 3px solid var(--md-sys-color-primary);
    }

    .text-area-control:focus{
        outline: none;
        border-bottom: 3px solid var(--md-sys-color-primary);
    }

    .text-input-control[type="text"] {
        padding: 6px;
    }

    .input-control[type="text"]::placeholder {
        color: var(--medium-gray);
    }

    .input-control[type="text"]:focus {
        border-width: 2px;
        border-radius: 0.25rem;
        border-color: var(--blue);
    }

    .input-control[type="range"] {
        opacity: 0.5;
    }

    .operation-control-prefix,
    .operation-control-suffix {
        display: flex;
        align-items: center;
        color: var(--dark-gray);
        font-size: smaller;
        width: 100px;
        user-select: none;
    }

    .operation-control-suffix {
        margin-left: 10px;
        width: 200px;
    }

    .operation-control-input {
        display: flex;
        align-items: center;
        width: 280px;
    }

    .operation-control-input > input,
    .operation-control-input > textarea {
        flex: 1;
    }

    .operation-control-input > textarea {
        height: 130px;
        line-height: 1.4;
    }

    .operation-control-input > button {
        flex: 0;
        margin-left: 10px;
        display: flex;
        padding: 2px 5px;
    }

    /* mwc-checkbox {
        --mdc-checkbox-unchecked-color: var(--blue);
        --mdc-theme-secondary: var(--blue);
        margin-left: -12px;
    } */

    .row {
        display: flex;
        flex-direction: row;
        align-items: center;
    }

    .helper-operation-container {
        margin-top: 5px;
        display: flex;
        flex-direction: row;
        align-items: baseline;
        font-size: smaller;
    }

    button.helper-operation {
        border: none;
        text-decoration: underline;
        padding: 0;
    }

    button.helper-operation:hover {
        background-color: inherit;
        color: inherit;
    }
`;

export default styles;
