export class Screen {
    constructor({ canvas, overlay, title }) {
        this.title = title;
        this.canvas = canvas;
        this.overlay = overlay;
        this.elements = [];
    }

    create(elements) {
        this.overlay.title(this.title);
        this.elements.push(...elements);
    }

    destroy() {
        this.elements.forEach(element => {
            if (element.destroy) {
                element.destroy();
            } else {
                this.overlay.remove(element);
            }
        });

        this.elements = [];
    }
}
