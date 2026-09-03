import { FiberNodeElement } from "./fiberNodeElement";

export type ComponentType = Function & {
    displayName?: string;
};

export interface Fiber {
    tag: number;
    type: ComponentType;
    elementType: unknown;

    return: Fiber | null;
    child: Fiber | null;
    sibling: Fiber | null;

    pendingProps: unknown;
    memoizedProps: unknown;
    memoizedState: unknown;

    alternate: Fiber | null;
    stateNode: unknown;

    flags: number;
    subtreeFlags: number;

    lanes: number;
    childLanes: number;
}

export interface FiberRoot {
    current: Fiber;
}

export interface FiberNode{
    fiber: Fiber;
    rerenders: number;
    element?: FiberNodeElement;
}

export interface ReactRenderer {
    [key: string]: unknown;
}

export interface ReactDevToolsHook {
    renderers: Map<number, ReactRenderer>;
    supportsFiber: boolean;
    inject(renderer: ReactRenderer): number;

    onCommitFiberRoot?: (
        rendererID: number,
        root: FiberRoot
    ) => void;

    onCommitFiberUnmount?: (
        rendererID: number,
        fiber: Fiber
    ) => void;
}

declare global {
    interface Window {
        __REACT_DEVTOOLS_GLOBAL_HOOK__?: ReactDevToolsHook;
    }
}

export interface FiberInstance {
    destroy: () => void;
}