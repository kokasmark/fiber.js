import type { FiberNode } from "./types";
import { getFiberName } from "./fiber";

export class FiberListElement {
    private panel: HTMLDivElement;
    private list: HTMLDivElement;

    private timer?: number;
    private hovered = false;

    private nodes = new Map<FiberNode, HTMLDivElement>();
    private index = 0;

    constructor() {
        this.panel = this.createPanel();
        this.list = this.createList();

        this.panel.append(this.list);
        document.body.append(this.panel);

        this.panel.addEventListener("mouseenter", this.onEnter);
        this.panel.addEventListener("mouseleave", this.onLeave);

        this.hide(true);
    }

    onUpdateNode(node: FiberNode) {
        if (!this.nodes.has(node)) {
            this.add(node);
        } else {
            this.update(node);
        }

        this.show();

        if (!this.hovered) {
            this.scheduleHide();
        }
    }

    clear() {
        clearTimeout(this.timer);

        this.nodes.clear();
        this.index = 0;

        this.list.replaceChildren();

        this.hide(true);
    }

    private add(node: FiberNode) {
        const row = document.createElement("div");

        Object.assign(row.style, {
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "5px 6px",
            borderRadius: "5px",
            whiteSpace: "nowrap",
            cursor: "pointer",
        });

        const dot = document.createElement("span");

        dot.textContent = (++this.index).toString();

        const color = node.element?.color;

        Object.assign(dot.style, {
            width: "16px",
            height: "16px",
            flexShrink: "0",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            borderRadius: "50%",

            background: color
                ? `rgb(${color[0]}, ${color[1]}, ${color[2]})`
                : "gray",

            color: "white",
            fontSize: "9px",
            lineHeight: "1",
        });

        const name = document.createElement("span");
        name.textContent = getFiberName(node.fiber);

        const count = document.createElement("span");

        Object.assign(count.style, {
            marginLeft: "auto",
            opacity: ".5",
        });

        count.textContent = node.rerenders.toString();

        const renderTime = document.createElement("span");
        renderTime.textContent = node.fiber.return?.actualDuration.toFixed(2).toString() ?? "";

        row.append(dot, name, count, renderTime);

        row.addEventListener("mouseenter", () => {
            node.element?.show();
            node.element?.showPanel();
        });

        row.addEventListener("mouseleave", () => {
            node.element?.hide();
        });

        this.nodes.set(node, row);
        this.list.appendChild(row);
    }

    private update(node: FiberNode) {
        const row = this.nodes.get(node);

        if (!row) return;

        const name = row.children[1];
        const count = row.children[2];

        if (name) {
            name.textContent = getFiberName(node.fiber);
        }

        if (count) {
            count.textContent = `${node.rerenders}`;
        }
    }

    private show() {
        clearTimeout(this.timer);

        this.panel.style.display = "flex";

        requestAnimationFrame(() => {
            this.panel.style.opacity = "1";
        });
    }

    private hide(immediate = false) {
        clearTimeout(this.timer);

        this.panel.style.opacity = "0";

        if (immediate) {
            this.panel.style.display = "none";
            return;
        }

        this.timer = window.setTimeout(() => {
            if (!this.hovered) {
                this.panel.style.display = "none";
            }
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
        this.hovered = true;
        clearTimeout(this.timer);
        this.show();
    };

    private onLeave = () => {
        this.hovered = false;
        this.scheduleHide();
    };

    private createPanel() {
        const panel = document.createElement("div");

        Object.assign(panel.style, {
            position: "fixed",
            top: "16px",
            left: "16px",
            bottom: "16px",
            width: "280px",
            zIndex: "1000000",

            display: "flex",
            flexDirection: "column",

            padding: "10px",
            boxSizing: "border-box",

            border: "1px solid rgba(255,255,255,.08)",
            borderRadius: "10px",

            background: "rgba(20, 20, 25, .95)",
            color: "white",

            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: "11px",
            lineHeight: "1.6",

            boxShadow: "0 10px 30px rgba(0,0,0,.3)",

            opacity: "0",
            transition: "opacity .2s",

            pointerEvents: "auto",
        });

        return panel;
    }

    private createList() {
        const list = document.createElement("div");

        Object.assign(list.style, {
            overflow: "auto",
            minHeight: "0",
        });

        return list;
    }

    destroy() {
        clearTimeout(this.timer);

        this.panel.removeEventListener("mouseenter", this.onEnter);
        this.panel.removeEventListener("mouseleave", this.onLeave);

        this.panel.remove();
    }
}