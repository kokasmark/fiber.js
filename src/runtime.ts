import { Fiber, FiberNode } from "./types";
import { FiberNodeElement } from "./fiberNodeElement";

export class Runtime {
    private fibers = new WeakMap<HTMLElement, FiberNode>();
    private elements = new Set<FiberNodeElement>();

    public update(
        fiber: Fiber,
        update: (node: FiberNode) => void
    ) {
        const element = fiber.stateNode as HTMLElement;

        let node = this.fibers.get(element);

        if (!node) {
            node = {
                fiber,
                rerenders: 0,
                totalTime: 0,
            };

            node.element = new FiberNodeElement(element, node);

            this.fibers.set(element, node);
            this.elements.add(node.element);
        } else {
            node.fiber = fiber;
        }

        update(node);
    }

    public destroy() {
        for (const element of this.elements) {
            element.destroy();
        }

        this.elements.clear();
        this.fibers = new WeakMap();
    }
}