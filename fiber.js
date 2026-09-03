"use strict";
(() => {
  // src/hook.ts
  var HookManager = class {
    constructor() {
      this.restores = [];
    }
    hook(target, key, create) {
      const object = target;
      const original = object[key];
      object[key] = create(original);
      this.restores.push(() => {
        object[key] = original;
      });
    }
    destroy() {
      for (let i = this.restores.length - 1; i >= 0; i--) {
        this.restores[i]();
      }
      this.restores = [];
    }
  };

  // src/fiber.ts
  function walkFiber(fiber, visit) {
    if (!fiber) return;
    visit(fiber);
    walkFiber(fiber.child, visit);
    walkFiber(fiber.sibling, visit);
  }
  function getFiberName(fiber) {
    const type = fiber.type;
    if (typeof type === "string") {
      return type;
    }
    if (typeof type === "function") {
      const component = type;
      return component.displayName || component.name || "Anonymous";
    }
    if (type && typeof type === "object") {
      const component = type;
      return component.displayName || component.render?.displayName || component.render?.name || "Unknown";
    }
    return "Unknown";
  }
  function getFiberPath(fiber) {
    const path = [];
    let current = fiber;
    while (current) {
      path.unshift(current);
      current = current.return;
    }
    return path;
  }

  // src/fiberNodeElement.ts
  var selected;
  var flags = {
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
    [1 << 19]: "PassiveStatic"
  };
  var FiberNodeElement = class {
    constructor(element, node) {
      this.hovered = false;
      this.active = false;
      this.color = [
        Math.random() * 255,
        Math.random() * 255,
        Math.random() * 255
      ];
      this.onEnter = () => {
        if (!this.active) return;
        if (selected && selected !== this) {
          selected.leave();
        }
        selected = this;
        this.hovered = true;
        this.show();
        this.showPanel();
      };
      this.onLeave = () => {
        if (!this.active || selected !== this) return;
        this.leave();
        selected = void 0;
      };
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
    onUpdate(node) {
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
    show() {
      clearTimeout(this.timer);
      const [r, g, b] = this.color;
      Object.assign(this.element.style, {
        outline: `2px solid rgba(${r}, ${g}, ${b}, .8)`,
        outlineOffset: "2px",
        borderRadius: "4px",
        background: `rgba(${r}, ${g}, ${b}, .15)`,
        cursor: "pointer",
        transition: "background .2s, outline .2s"
      });
      if (getComputedStyle(this.element).position === "static") {
        this.element.style.position = "relative";
      }
      this.badge.textContent = `${getFiberName(this.node.fiber)} (${this.node.rerenders})`;
      this.badge.style.background = `rgba(${r}, ${g}, ${b}, .9)`;
      this.badge.style.display = "block";
      this.badge.style.opacity = "1";
    }
    showPanel() {
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
        opacity: "1"
      });
    }
    hide(immediate = false) {
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
    scheduleHide() {
      clearTimeout(this.timer);
      this.timer = window.setTimeout(() => {
        if (!this.hovered) {
          this.hide();
        }
      }, 1e3);
    }
    leave() {
      clearTimeout(this.timer);
      this.hovered = false;
      this.hide();
    }
    // Rendering
    renderFlags() {
      this.renderList(
        this.flags,
        "flags",
        this.getFlags(this.node.fiber.flags)
      );
    }
    getFlags(value) {
      return Object.entries(flags).filter(([flag]) => value & Number(flag)).map(([, name]) => name);
    }
    renderValue(panel, title, value) {
      panel.replaceChildren();
      this.addTitle(panel, title);
      const content = document.createElement("pre");
      content.textContent = this.format(value);
      Object.assign(content.style, {
        margin: "4px 0 0",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        opacity: ".8"
      });
      panel.appendChild(content);
    }
    renderList(panel, title, values) {
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
    addTitle(panel, title) {
      const titleElement = document.createElement("div");
      titleElement.textContent = title;
      Object.assign(titleElement.style, {
        fontWeight: "600",
        marginBottom: "4px"
      });
      panel.appendChild(titleElement);
    }
    format(value) {
      try {
        const result = JSON.stringify(
          value,
          (_, value2) => {
            if (typeof value2 === "function") {
              return `[Function ${value2.name || "anonymous"}]`;
            }
            return value2;
          },
          2
        );
        return result ?? String(value);
      } catch {
        return String(value);
      }
    }
    renderTree() {
      this.tree.replaceChildren();
      this.addTitle(this.tree, "fiber tree");
      for (const [index, fiber] of getFiberPath(
        this.node.fiber
      ).entries()) {
        const row = document.createElement("div");
        row.textContent = getFiberName(fiber);
        Object.assign(row.style, {
          opacity: index === 0 ? "1" : ".65",
          marginLeft: `${index * 8}px`
        });
        this.tree.appendChild(row);
      }
    }
    createPanel() {
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
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: "11px",
        lineHeight: "1.6",
        boxShadow: "0 10px 30px rgba(0,0,0,.3)",
        pointerEvents: "none",
        opacity: "0",
        transition: "opacity .2s",
        boxSizing: "border-box"
      });
      return panel;
    }
    createSection() {
      const section = document.createElement("div");
      const [r, g, b] = this.color;
      Object.assign(section.style, {
        width: "100%",
        padding: "8px",
        borderRadius: "6px",
        background: `rgba(${r}, ${g}, ${b}, .15)`,
        boxSizing: "border-box"
      });
      return section;
    }
    createBadge() {
      const badge = document.createElement("div");
      Object.assign(badge.style, {
        position: "absolute",
        top: "4px",
        left: "4px",
        zIndex: "999999",
        padding: "4px 8px",
        borderRadius: "6px",
        color: "white",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: "11px",
        lineHeight: "1",
        pointerEvents: "none",
        whiteSpace: "nowrap",
        transition: "opacity .2s"
      });
      return badge;
    }
    destroy() {
      clearTimeout(this.timer);
      if (selected === this) {
        selected = void 0;
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
  };

  // src/runtime.ts
  var Runtime = class {
    constructor() {
      this.fibers = /* @__PURE__ */ new WeakMap();
      this.elements = /* @__PURE__ */ new Set();
    }
    update(fiber, update) {
      const element = fiber.stateNode;
      let node = this.fibers.get(element);
      if (!node) {
        node = {
          fiber,
          rerenders: 0
        };
        node.element = new FiberNodeElement(element, node);
        this.fibers.set(element, node);
        this.elements.add(node.element);
      } else {
        node.fiber = fiber;
      }
      update(node);
    }
    destroy() {
      for (const element of this.elements) {
        element.destroy();
      }
      this.elements.clear();
      this.fibers = /* @__PURE__ */ new WeakMap();
    }
  };

  // src/badgeElement.ts
  var FiberBadgeElement = class {
    constructor() {
      this.element = document.createElement("div");
      Object.assign(this.element.style, {
        position: "fixed",
        top: "10px",
        right: "10px",
        zIndex: "2147483647",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "5px 8px",
        borderRadius: "6px",
        background: "#20232a",
        color: "#61dafb",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: "11px",
        fontWeight: "600",
        boxShadow: "0 2px 8px rgba(0,0,0,.2)",
        userSelect: "none"
      });
      this.element.innerHTML = `
            <span style="
                display: flex;
                align-items: center;
                justify-content: center;
                width: 14px;
                height: 14px;
            ">
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                >
                    <ellipse cx="12" cy="12" rx="10" ry="4" />
                    <ellipse
                        cx="12"
                        cy="12"
                        rx="10"
                        ry="4"
                        transform="rotate(60 12 12)"
                    />
                    <ellipse
                        cx="12"
                        cy="12"
                        rx="10"
                        ry="4"
                        transform="rotate(120 12 12)"
                    />
                    <circle
                        cx="12"
                        cy="12"
                        r="1.5"
                        fill="currentColor"
                    />
                </svg>
            </span>

            <span>fiber</span>
        `;
      document.body.appendChild(this.element);
    }
    destroy() {
      this.element.remove();
    }
  };

  // src/fiberListElement.ts
  var FiberListElement = class {
    constructor() {
      this.hovered = false;
      this.nodes = /* @__PURE__ */ new Map();
      this.index = 0;
      this.onEnter = () => {
        this.hovered = true;
        clearTimeout(this.timer);
        this.show();
      };
      this.onLeave = () => {
        this.hovered = false;
        this.scheduleHide();
      };
      this.panel = this.createPanel();
      this.list = this.createList();
      this.panel.append(this.list);
      document.body.append(this.panel);
      this.panel.addEventListener("mouseenter", this.onEnter);
      this.panel.addEventListener("mouseleave", this.onLeave);
      this.hide(true);
    }
    onUpdateNode(node) {
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
    add(node) {
      const row = document.createElement("div");
      Object.assign(row.style, {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "5px 6px",
        borderRadius: "5px",
        whiteSpace: "nowrap",
        cursor: "pointer"
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
        background: color ? `rgb(${color[0]}, ${color[1]}, ${color[2]})` : "gray",
        color: "white",
        fontSize: "9px",
        lineHeight: "1"
      });
      const name = document.createElement("span");
      name.textContent = getFiberName(node.fiber);
      const count = document.createElement("span");
      Object.assign(count.style, {
        marginLeft: "auto",
        opacity: ".5"
      });
      count.textContent = node.rerenders.toString();
      row.append(dot, name, count);
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
    update(node) {
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
    show() {
      clearTimeout(this.timer);
      this.panel.style.display = "flex";
      requestAnimationFrame(() => {
        this.panel.style.opacity = "1";
      });
    }
    hide(immediate = false) {
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
    scheduleHide() {
      clearTimeout(this.timer);
      this.timer = window.setTimeout(() => {
        if (!this.hovered) {
          this.hide();
        }
      }, 1e3);
    }
    createPanel() {
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
        pointerEvents: "auto"
      });
      return panel;
    }
    createList() {
      const list = document.createElement("div");
      Object.assign(list.style, {
        overflow: "auto",
        minHeight: "0"
      });
      return list;
    }
    destroy() {
      clearTimeout(this.timer);
      this.panel.removeEventListener("mouseenter", this.onEnter);
      this.panel.removeEventListener("mouseleave", this.onLeave);
      this.panel.remove();
    }
  };

  // src/index.ts
  var INSTANCE_KEY = "__fiber_instance__";
  var existing = window[INSTANCE_KEY];
  if (existing) {
    console.log("fiber - Existing instance found, destroying it...");
    existing.destroy();
  }
  var h = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!h) {
    console.log("fiber - React DevTools hook not found");
  } else {
    console.log("fiber - React DevTools hook found");
    console.log("fiber - Supports Fiber:", h.supportsFiber);
    initialize(h);
  }
  function initialize(h2) {
    const badge = new FiberBadgeElement();
    const list = new FiberListElement();
    const hooks = new HookManager();
    const runtime = new Runtime();
    hooks.hook(
      h2,
      "onCommitFiberRoot",
      (original) => function(rendererID, root, ...args) {
        list.clear();
        walkFiber(root.current, (fiber) => {
          if (!(fiber.stateNode instanceof HTMLElement)) {
            return;
          }
          if (fiber.flags === 0) {
            return;
          }
          runtime.update(fiber, (node) => {
            node.rerenders++;
            node.element?.onUpdate();
            list.onUpdateNode(node);
          });
        });
        return original?.call(
          this,
          rendererID,
          root,
          ...args
        );
      }
    );
    const instance = {
      destroy() {
        console.log("fiber - Destroying instance");
        hooks.destroy();
        badge.destroy();
        list.destroy();
        runtime.destroy();
        delete window[INSTANCE_KEY];
      }
    };
    window[INSTANCE_KEY] = instance;
    console.log("fiber - Instance initialized");
  }
})();
