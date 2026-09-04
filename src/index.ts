import type { FiberInstance, FiberNode, ReactDevToolsHook } from "./types";
import { HookManager } from "./hook";
import { getFiberFlags, walkFiber } from "./fiber";
import { Runtime as Runtime } from "./runtime";
import { FiberBadgeElement } from "./badgeElement";
import { FiberListElement } from "./fiberListElement";
import { FiberNodeElement } from "./fiberNodeElement";

const INSTANCE_KEY = "__fiber_instance__";

const existing = (window as any)[INSTANCE_KEY] as FiberInstance | undefined;

if (existing) {
    console.log("fiber - Existing instance found, destroying it...");
    existing.destroy();
}

const h: ReactDevToolsHook | undefined =
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__;

if (!h) {
    console.log("fiber - React DevTools hook not found");
} else {
    console.log("fiber - React DevTools hook found");
    console.log("fiber - Supports Fiber:", h.supportsFiber);

    initialize(h);
}

function initialize(h: ReactDevToolsHook) {
    const badge = new FiberBadgeElement();
    const list = new FiberListElement();
    const hooks = new HookManager();
    const runtime = new Runtime();

    hooks.hook(
        h,
        "onCommitFiberRoot",
        (original) =>
            function (
                this: ReactDevToolsHook,
                rendererID,
                root,
                ...args
            ) {                
                list.clear()

                walkFiber(root.current, (fiber) => {
                    if (!(fiber.stateNode instanceof HTMLElement))
                        return;
                    
                    if (getFiberFlags(fiber.flags).length === 0 || getFiberFlags(fiber.subtreeFlags).length === 0)
                        return;

                    runtime.update(fiber, (node) => {
                        node.rerenders++;
                        node.element?.onUpdate();
                        list.onUpdateNode(node);
                    });
                   
                });

                return original?.call(this, rendererID, root, ...args
                );
            }
    );

    const instance: FiberInstance = {
        destroy() {
            console.log("fiber - Destroying instance");

            hooks.destroy();
            badge.destroy();
            list.destroy();
            runtime.destroy();

            delete (window as any)[INSTANCE_KEY];
        }
    };

    (window as any)[INSTANCE_KEY] = instance;

    console.log("fiber - Instance initialized");
}