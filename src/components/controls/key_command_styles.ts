import { css } from "lit";

const style = css`
    .key-command-button {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }

    .key-command-container {
        margin: -4px 10px 0 0;
        /* width: 90px; */
    }

    .key-command-container.fixed {
        display: flex;
        justify-content: space-between;
        /* width: 70px; */
    }

    span.key-command {
        padding: 8px;
        color: black;
        font-weight: 700;
        font-family: "Courier New", Courier, monospace;
        overflow: auto;
        font-size: 85%;
        background-color: var(--light-gray);
        border-radius: 4px;
    }

    .key-command-container-small {
        /* padding: 0px 0 3px 8px; */
    }

    span.key-command-small {
        color: black;
        padding: 4px;
        /* font-size: 70%; */
    }
`;

export default style;