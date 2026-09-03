export class HookManager {
    private restores: (() => void)[] = [];

    hook<T extends (...args: any[]) => any>(
        target: object,
        key: string,
        create: (original: T | undefined) => T
    ) {
        const object = target as Record<string, unknown>;

        const original = object[key] as T | undefined;

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
}