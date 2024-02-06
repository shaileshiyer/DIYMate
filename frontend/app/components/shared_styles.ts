import { css } from "lit";

export const styles = css`
button {
  color: var(--blue);
  padding: 0.25rem 1rem 0.4rem;
  font-weight: 500;
  border: 2px solid var(--blue);
  border-radius: 0.25rem;
  background-color: transparent;
  cursor: pointer;
  font-size: 100%;
  line-height: 1.4;
  margin: 0;
  user-select: none;
  transition: background-color 0.05s;
}

button:hover {
  background-color: var(--blue);
  color: var(--white);
}

button:disabled {
  background-color: var(--white);
  color: var(--dark-gray);
  border-color: var(--dark-gray);
  pointer-events: none;
}

.text-editor-font-styles {
  line-height: 2rem;
  font-size: 16px;
  font-family: var(--editor-font-family);
  font-weight: 300;
}

@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.link-button {
  font-size: 14px;
  line-height: 1.5;
  letter-spacing: 0.2px;
  display: inline-block;
  text-decoration: underline;
  cursor: pointer;
}

.link-button.disabled {
  text-decoration: none;
  cursor: default;
  pointer-events: none;
}

.text-editor-font-styles {
  line-height: 2rem;
  font-size: 16px;
  font-family: var(--editor-font-family);
  font-weight: 300;
}

`;