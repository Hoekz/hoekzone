import { Emitter } from './emitter.js';

export class Screen extends Emitter {
    constructor({ canvas, overlay, title, elements }) {
        super();
        this.title = title;
        this.canvas = canvas;
        this.overlay = overlay;
        this.elements = elements || [];
    }

    create(elements = []) {
        this.overlay.innerHTML = `<h1>${this.title}</h1>`;
        this.elements.push(...elements);
        this.elements.forEach(element => element.create(this.overlay));
    }

    destroy() {
        this.elements.forEach(element => element.destroy());
        this.elements = [];
    }
}
