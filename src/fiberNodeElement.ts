import type { FiberNode } from "./types";
import { getFiberName, getFiberPath } from "./fiber";

let selected: FiberNodeElement | undefined;

const flags: Record<number, string> = {
    [1 << 0]: "PerformedWork",
    [1 << 1]: "Placement",
    [1 << 2]: "Update",
    [1 << 3]: "ChildDeletion",
    [1 << 4]: "ContentReset",
    [1 << 5]: "Callback",
    [1 << 6]: "DidCapture",
    [1 << 7]: "Ref",
    [1 << 8]: "Snapshot",
    [1 << 9]: "Passive",
    [1 << 10]: "Visibility",
    [1 << 11]: "Hydrating",
    [1 << 12]: "StoreConsistency",
    [1 << 13]: "Incomplete",
    [1 << 14]: "ShouldCapture",
    [1 << 15]: "ForceClientRender",
    [1 << 16]: "Forked",
    [1 << 17]: "RefStatic",
    [1 << 18]: "LayoutStatic",
    [1 << 19]: "PassiveStatic",
};

export class FiberNodeElement {
    private element: HTMLElement;
    private node: FiberNode;

    private badge: HTMLDivElement;
    private panel: HTMLDivElement;

    private flags: HTMLDivElement;
    private props: HTMLDivElement;
    private state: HTMLDivElement;
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

        this.flags = this.createSection();
        this.props = this.createSection();
        this.state = this.createSection();
        this.tree = this.createSection();

        this.panel.append(
            this.flags,
            this.props,
            this.state,
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
            `${getFiberName(this.node.fiber)} (${this.node.rerenders})`;

        this.badge.style.background = `rgba(${r}, ${g}, ${b}, .9)`;

        this.badge.style.display = "block";
        this.badge.style.opacity = "1";
    }

    public showPanel() {
        this.renderFlags();

        this.renderValue(
            this.props,
            "memoizedProps",
            this.node.fiber.memoizedProps
        );

        this.renderValue(
            this.state,
            "memoizedState",
            this.node.fiber.memoizedState
        );

        this.renderTree();

        const rect = this.element.getBoundingClientRect();

        Object.assign(this.panel.style, {
            left: `${rect.left}px`,
            top: `${rect.bottom + 8}px`,
            display: "flex",
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
            this.getFlags(this.node.fiber.flags)
        );
    }

    private getFlags(value: number) {
        return Object.entries(flags)
            .filter(([flag]) => value & Number(flag))
            .map(([, name]) => name);
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
            const result = JSON.stringify(
                value,
                (_, value) => {
                    if (typeof value === "function") {
                        return `[Function ${value.name || "anonymous"}]`;
                    }

                    return value;
                },
                2
            );

            return result ?? String(value);
        } catch {
            return String(value);
        }
    }

    private renderTree() {
        this.tree.replaceChildren();

        this.addTitle(this.tree, "fiber tree");

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