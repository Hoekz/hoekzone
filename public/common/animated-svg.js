import { Element, from } from './element.js';
import { animateDrawing } from './svg.js';

export class AnimatedSVG extends Element {
  constructor({ svgs, interval, mode }) {
    super('div', { class: 'animated-container' });
    this.svgs = svgs;
    this.interval = interval;
    this.mode = mode || 'order';
    this.index = this.mode === 'random' ? Math.floor(Math.random() * this.svgs.length) : 0;
    this.svg = null;
    this.intervalId = null;
  }

  create(parent) {
    super.create(parent);
    this.render(this.svgs[this.index]);
    this.start();
  }

  destroy() {
    this.stop();
    super.destroy();
  }

  async render(svg) {
    this.element.innerHTML = '';
    this.svg = await from(svg, { style: { width: '100%', height: '100%', maxWidth: 400 } });
    this.svg.create(this.element);
    animateDrawing(this.svg.element, {
      duration: this.interval / 1000 - 3,
      delay: 0,
      fadeDuration: this.interval / 1000,
    });
  }

  start() {
    this.stop();
    this.intervalId = setInterval(() => {
      if (this.mode === 'order') {
        this.index = (this.index + 1) % this.svgs.length;;
      } else if (this.mode === 'random') {
        const index = this.index;
        while (index === this.index) {
          this.index = Math.floor(Math.random() * this.svgs.length);
        }
      }

      this.render(this.svgs[this.index]);
    }, this.interval);
  }

  stop() {
    this.svg?.destroy();
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}