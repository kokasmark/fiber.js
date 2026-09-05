import { FiberFlags, type FiberNode } from "./types";
import { getFiberFlags, getFiberModes, getFiberName, getFiberPath, getFiberTag } from "./fiber";

let selected: FiberNodeElement | undefined;

export class FiberNodeElement {
    private element: HTMLElement;
    private node: FiberNode;

    private badge: HTMLDivElement;
    private panel: HTMLDivElement;

    private tag: HTMLDivElement;
    private flags: HTMLDivElement;
    private subTreeFlags: HTMLDivElement;
    private mode: HTMLDivElement;
    private time: HTMLDivElement;
    private rerenders: HTMLDivElement;
    private tree: HTMLDivElement;

    private timer?: number;
    private hovered = false;
    private active = false;

    public color: [number, number, number] = [
        Math.random() * 255,
        Math.random() * 255,
        Math.random() * 255,
    ];

    private previousStyles: string;

    constructor(element: HTMLElement, node: FiberNode) {
        this.element = element;
        this.node = node;
        this.previousStyles = element.style.cssText;

        this.badge = this.createBadge();

        this.panel = this.createPanel();

        this.tag = this.createSection();
        this.flags = this.createSection();
        this.subTreeFlags = this.createSection();
        this.mode = this.createSection();
        this.time = this.createSection();
        this.rerenders = this.createSection();
        this.tree = this.createSection();

        this.panel.append(
            this.tag,
            this.flags,
            this.subTreeFlags,
            this.mode,
            this.time,
            this.rerenders,
            this.tree
        );

        document.body.appendChild(this.panel);
        element.appendChild(this.badge);

        element.addEventListener("mouseenter", this.onEnter);
        element.addEventListener("mouseleave", this.onLeave);

        this.hide(true);
    }

    onUpdate(node?: FiberNode) {
        if (node) {
            this.node = node;
        }

        this.active = true;
        this.show();

        if (!this.hovered) {
            this.scheduleHide();
        }
    }

    // Events

    public show() {
        clearTimeout(this.timer);

        const [r, g, b] = this.color;

        Object.assign(this.element.style, {
            outline: `2px solid rgba(${r}, ${g}, ${b}, .8)`,
            outlineOffset: "2px",
            borderRadius: "4px",
            background: `rgba(${r}, ${g}, ${b}, .15)`,
            cursor: "pointer",
            transition: "background .2s, outline .2s",
        });

        if (getComputedStyle(this.element).position === "static") {
            this.element.style.position = "relative";
        }

        this.badge.textContent =
            `${getFiberName(this.node.fiber)} (${this.node.fiber?.return?.actualDuration.toFixed(2) ?? 0.00} ms)`;

        this.badge.style.background = `rgba(${r}, ${g}, ${b}, .9)`;

        this.badge.style.display = "block";
        this.badge.style.opacity = "1";
    }

    public showPanel() {
        this.renderValue(
            this.tag,
            "tag",
            getFiberTag(this.node.fiber)
        );

        this.renderFlags();

        this.renderList(
            this.mode,
            "mode",
            getFiberModes(this.node.fiber.mode)
        );

        this.renderValue(
            this.time,
            "time",
            `${this.node.fiber.return?.actualDuration.toFixed(2)} ms (${this.node.totalTime.toFixed(2)} ms)`
        );
        
        this.renderValue(
            this.rerenders,
            "rerenders",
            this.node.rerenders
        );

        this.renderTree();

        const rect = this.element.getBoundingClientRect();

        this.positionPanel(rect)
    }

    private positionPanel(rect:DOMRect) {
        const gap = 8;
        const padding = 8;

        this.panel.style.display = "flex";
        this.panel.style.opacity = "0";

        Object.assign(this.panel.style, {
            left: "0px",
            top: "0px",
        });

        const panelRect = this.panel.getBoundingClientRect();

        let left = rect.left;
        let top = rect.bottom + gap;

        if (top + panelRect.height > window.innerHeight - padding) {
            top = rect.top - panelRect.height - gap;
        }

        left = Math.max(
            padding,
            Math.min(left, window.innerWidth - panelRect.width - padding)
        );

        top = Math.max(
            padding,
            Math.min(top, window.innerHeight - panelRect.height - padding)
        );

        Object.assign(this.panel.style, {
            left: `${left}px`,
            top: `${top}px`,
            opacity: "1",
        });
    }

    public hide(immediate = false) {
        clearTimeout(this.timer);

        this.badge.style.opacity = "0";
        this.panel.style.opacity = "0";

        if (immediate) {
            this.badge.style.display = "none";
            this.panel.style.display = "none";

            this.element.style.cssText = this.previousStyles;
            return;
        }

        this.timer = window.setTimeout(() => {
            if (this.hovered) return;

            this.badge.style.display = "none";
            this.panel.style.display = "none";

            this.element.style.cssText = this.previousStyles;
        }, 200);
    }

    private scheduleHide() {
        clearTimeout(this.timer);

        this.timer = window.setTimeout(() => {
            if (!this.hovered) {
                this.hide();
            }
        }, 1000);
    }

    private onEnter = () => {
        if (!this.active) return;

        if (selected && selected !== this) {
            selected.leave();
        }

        selected = this;
        this.hovered = true;

        this.show();
        this.showPanel();
    };

    private onLeave = () => {
        if (!this.active || selected !== this) return;

        this.leave();
        selected = undefined;
    };

    public leave() {
        clearTimeout(this.timer);

        this.hovered = false;
        this.hide();
    }

    // Rendering

    private renderFlags() {
        this.renderList(
            this.flags,
            "flags",
            getFiberFlags(this.node.fiber.flags)
        );

        this.renderList(
            this.subTreeFlags,
            "subtree flags",
            getFiberFlags(this.node.fiber.subtreeFlags)
        );
    }

    private renderValue(
        panel: HTMLDivElement,
        title: string,
        value: unknown
    ) {
        panel.replaceChildren();

        this.addTitle(panel, title);

        const content = document.createElement("pre");

        content.textContent = this.format(value);

        Object.assign(content.style, {
            margin: "4px 0 0",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            opacity: ".8",
        });

        panel.appendChild(content);
    }

    private renderList(
        panel: HTMLDivElement,
        title: string,
        values: string[]
    ) {
        panel.replaceChildren();

        this.addTitle(panel, title);

        if (!values.length) {
            const empty = document.createElement("div");

            empty.textContent = "None";
            empty.style.opacity = ".5";

            panel.appendChild(empty);
            return;
        }

        for (const value of values) {
            const row = document.createElement("div");

            row.textContent = value;
            row.style.opacity = ".8";

            panel.appendChild(row);
        }
    }

    private addTitle(
        panel: HTMLDivElement,
        title: string
    ) {
        const titleElement = document.createElement("div");

        titleElement.textContent = title;

        Object.assign(titleElement.style, {
            fontWeight: "600",
            marginBottom: "4px",
        });

        panel.appendChild(titleElement);
    }

    private format(value: unknown) {
        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    }

    private renderTree() {
        this.tree.replaceChildren();

        this.addTitle(this.tree, "tree");

        for (const [index, fiber] of getFiberPath(
            this.node.fiber
        ).entries()) {
            const row = document.createElement("div");

            row.textContent = getFiberName(fiber);

            Object.assign(row.style, {
                opacity: index === 0 ? "1" : ".65",
                marginLeft: `${index * 8}px`,
            });

            this.tree.appendChild(row);
        }
    }

    private createPanel() {
        const panel = document.createElement("div");

        Object.assign(panel.style, {
            position: "fixed",
            zIndex: "1000000",
            display: "none",
            flexDirection: "column",
            gap: "6px",
            width: "280px",
            padding: "6px",
            borderRadius: "10px",
            background: "rgba(20, 20, 25, .95)",
            color: "white",
            fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: "11px",
            lineHeight: "1.6",
            boxShadow: "0 10px 30px rgba(0,0,0,.3)",
            pointerEvents: "none",
            opacity: "0",
            transition: "opacity .2s",
            boxSizing: "border-box",
        });

        return panel;
    }

    private createSection() {
        const section = document.createElement("div");
        const [r, g, b] = this.color;

        Object.assign(section.style, {
            width: "100%",
            padding: "8px",
            borderRadius: "6px",
            background: `rgba(${r}, ${g}, ${b}, .15)`,
            boxSizing: "border-box",
        });

        return section;
    }

    private createBadge() {
        const badge = document.createElement("div");

        Object.assign(badge.style, {
            position: "absolute",
            top: "4px",
            left: "4px",
            zIndex: "999999",
            padding: "4px 8px",
            borderRadius: "6px",
            color: "white",
            fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: "11px",
            lineHeight: "1",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            transition: "opacity .2s",
        });

        return badge;
    }

    destroy() {
        clearTimeout(this.timer);

        if (selected === this) {
            selected = undefined;
        }

        this.active = false;

        this.element.style.cssText = this.previousStyles;

        this.badge.remove();
        this.panel.remove();

        this.element.removeEventListener(
            "mouseenter",
            this.onEnter
        );

        this.element.removeEventListener(
            "mouseleave",
            this.onLeave
        );
    }
}