import { ElementPart, LitElement, css, html, render } from "lit";
import { customElement, property } from "lit/decorators.js";
import {
    computePosition,
    autoPlacement,
    offset,
    shift,
} from "@floating-ui/dom";
import {
    Directive,
    DirectiveParameters,
    directive,
} from "lit/async-directive.js";

const enterEvents = ["pointerenter", "focus"];
const leaveEvents = ["pointerleave", "blur", "keydown", "click"];

@customElement("dm-tooltip")
export class TooltipComponent extends LitElement {
    static override get styles() {
        const styles = css`
            :host {
                display: inline-block;
                position: fixed;
                padding: 4px;
                border: 1px solid var(--md-sys-outline);
                border-radius: 4px;
                background: var(--md-sys-color-secondary-container);
                color: var(--md-sys-color-on-secondary-container);
                width:fit-content;
                pointer-events: none;
                opacity: 0;
                transform: scale(0.75);
                transition: opacity, transform;
                transition-duration: 0.33s;
            }

            :host([showing]) {
                opacity: 1;
                transform: scale(1);
            }
        `;
        return [styles];
    }

    @property({ type: Number })
    offset = 4;
    @property({ reflect: true, type: Boolean })
    showing = false;

    constructor() {
        super();
        this.addEventListener("transitionend", this.finishHide);
    }

    static lazy(target: Element, callback: (target: TooltipComponent) => void) {
        const createTooltip = () => {
            const tooltip = document.createElement(
                "dm-tooltip"
            ) as TooltipComponent;
            callback(tooltip);
            target.parentNode!.insertBefore(tooltip, target.nextSibling);
            tooltip.show();
            // We only need to create the tooltip once, so ignore all future events.
            enterEvents.forEach((eventName) =>
                target.removeEventListener(eventName, createTooltip)
            );
        };
        enterEvents.forEach((eventName) =>
            target.addEventListener(eventName, createTooltip)
        );
    }

    show = () => {
        this.style.cssText = "";
        // Position the tooltip near the target.
        computePosition(this.target!, this, {
            strategy: "fixed",
            middleware: [
                offset(this.offset),
                shift(),
                autoPlacement({ allowedPlacements: ["top", "bottom"] }),
            ],
        }).then(({ x, y }: { x: number; y: number }) => {
            this.style.left = `${x}px`;
            this.style.top = `${y}px`;
        });
        this.showing = true;
    };

    hide = () => {
        this.showing = false;
    };

    finishHide = () => {
        if (!this.showing) {
            this.style.display = "none";
        }
    };

    _target: Element | null = null;

    get target() {
        return this._target;
    }

    set target(target: Element | null) {
        // Remove events from existing target
        if (this.target) {
            enterEvents.forEach((name) =>
                this.target!.removeEventListener(name, this.show)
            );
            leaveEvents.forEach((name) =>
                this.target!.removeEventListener(name, this.hide)
            );
        }
        // Add events to new target
        if (target) {
            enterEvents.forEach((name) =>
                target!.addEventListener(name, this.show)
            );
            leaveEvents.forEach((name) =>
                target!.addEventListener(name, this.hide)
            );
        }
        this._target = target;
    }

    connectedCallback(): void {
        super.connectedCallback();
        this.hide();
        this.target ??= this.previousElementSibling;
    }

    render() {
        return html`<slot></slot>`;
    }
}

class TooltipDirective extends Directive {
    didSetupLazy = false;
    tooltipContent?: unknown;
    part?: ElementPart;
    tooltip?: TooltipComponent;

    // A directive must define a render method.
    render(tooltipContent: unknown = "") {}

    update(part: ElementPart, [tooltipContent]: DirectiveParameters<this>) {
        this.tooltipContent = tooltipContent;
        this.part = part;
        if (!this.didSetupLazy) {
            this.setupLazy();
        }
        if (this.tooltip) {
            this.renderTooltipContent();
        }
    }

    setupLazy() {
        // Add call to SimpleTooltip.lazy
        this.didSetupLazy = true;
        TooltipComponent.lazy(this.part!.element, (tooltip: TooltipComponent) => {
            this.tooltip = tooltip;
            this.renderTooltipContent();
        });
    }

    renderTooltipContent() {
        // Render tooltip content
        render(this.tooltipContent, this.tooltip!, this.part!.options);
    }
}

export const tooltip = directive(TooltipDirective);

declare global {
    interface HTMLElementTagNameMap {
        "dm-tooltip": TooltipComponent;
    }
}
