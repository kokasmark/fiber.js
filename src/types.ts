import { FiberNodeElement } from "./fiberNodeElement";

export type ComponentType = Function & {
    displayName?: string;
};

export interface Fiber {
    tag: number;
    type: ComponentType;
    elementType: unknown;

    mode: number;

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

    actualDuration: number;
    actualStartTime: number;
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

export const FiberFlags: Record<number, string> = {
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

export const FiberTags: Record<number, string> = {
  0: "FunctionComponent",
  1: "ClassComponent",
  2: "IndeterminateComponent",
  3: "HostRoot",
  4: "HostPortal",
  5: "HostComponent",
  6: "HostText",
  7: "Fragment",
  8: "Mode",
  9: "ContextConsumer",
  10: "ContextProvider",
  11: "ForwardRef",
  12: "Profiler",
  13: "SuspenseComponent",
  14: "MemoComponent",
  15: "SimpleMemoComponent",
  16: "LazyComponent",
  17: "IncompleteClassComponent",
  18: "DehydratedFragment",
  19: "SuspenseListComponent",
  21: "ScopeComponent",
  22: "OffscreenComponent",
  23: "LegacyHiddenComponent",
  24: "CacheComponent",
  25: "TracingMarkerComponent",
  26: "HostHoistable",
  27: "HostSingleton",
};

export const FiberModes: Record<number, string> = {
  0: "NoMode",
  1: "ConcurrentMode",
  2: "ProfileMode",
  8: "StrictLegacyMode",
  16: "StrictEffectsMode",
  32: "SuspenseyImagesMode",
};

declare global {
    interface Window {
        __REACT_DEVTOOLS_GLOBAL_HOOK__?: ReactDevToolsHook;
    }
}

export interface FiberInstance {
    destroy: () => void;
}