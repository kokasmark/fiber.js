import { ComponentType, Fiber } from "./types";

export function walkFiber(
  fiber: Fiber | null,
  visit: (fiber: Fiber) => void
) {
  if (!fiber) return;

  visit(fiber);

  walkFiber(fiber.child, visit);
  walkFiber(fiber.sibling, visit);
}

export function getFiberName(fiber: Fiber): string {
    const type = fiber.type;

    if (typeof type === "string") {
        return type;
    }

    if (typeof type === "function") {
        const component = type as ComponentType;

        return (
            component.displayName ||
            component.name ||
            "Anonymous"
        );
    }

    if (type && typeof type === "object") {
        const component = type as {
            displayName?: string;
            render?: ComponentType;
        };

        return (
            component.displayName ||
            component.render?.displayName ||
            component.render?.name ||
            "Unknown"
        );
    }

    return "Unknown";
}

export function getFiberPath(fiber: Fiber): Fiber[] {
    const path: Fiber[] = [];

    let current: Fiber | null = fiber;

    while (current) {
        path.unshift(current);
        current = current.return;
    }

    return path;
}