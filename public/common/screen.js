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

    remove(target) {
        const index = this.elements.indexOf(target);
        if (index !== -1) {
            this.elements.splice(index, 1);
            target.destroy();
        }
    }

    add(element) {
        this.elements.push(element);
        element.create(this.overlay);
    }

    replace(target, replacement) {
        this.remove(target);
        this.add(replacement);
    }
}
