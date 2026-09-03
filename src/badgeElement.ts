export class FiberBadgeElement {
    private element: HTMLDivElement;

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

            userSelect: "none",
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
}