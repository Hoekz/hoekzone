import { Drawable } from '/common/drawable.js';
import { Emitter } from '/common/emitter.js';
import { Screen } from '/common/screen.js';
import { prompts } from '/data/depictable.js';

export class Depictable extends Emitter {
  constructor(app) {
    super();
    this.app = app;
    this.title = 'Depictable';
    this.state = 'join';
    this.display = null;
  }

  setState(state) {
    this.state = state;
    this.display?.destroy();
    this.display = null;
    this.app.canvas.getContext('2d').clearRect(0, 0, this.app.canvas.width, this.app.canvas.height);

    switch (state) {
      case 'join':
        this.join();
        break;
      case 'draw':
        this.draw();
        break;
      case 'wait':
        this.wait();
        break;
      case 'guess':
        this.guess();
        break;
      case 'results':
        this.results();
        break;
    }
  }

  create() {
    this.setState('draw');
  }

  destroy() {
    this.display?.destroy();
  }

  draw() {
    this.display = new Drawable({
      canvas: this.app.canvas,
      overlay: this.app.overlay,
      colors: ['#ec5436', '#f7b733'],
      title: prompts[Math.floor(Math.random() * prompts.length)],
      withFill: true,
    });

    this.display.on('submit', (image) => {
      this.app.set('image', image);
      this.setState('wait');
    });

    this.display.create();
  }

  wait() {
    this.display = new Screen({
      title: 'Done! Waiting for others...',
      canvas: this.app.canvas,
      overlay: this.app.overlay,
    });

    this.display.create([
      this.app.overlay.image(this.app.get('image'), 'Here is your drawing!', {
        top: 60,
        left: this.app.canvas.width / 2,
        transform: 'translateX(-50%)',
        width: this.app.canvas.width - 20,
      }),
    ]);
  }
}
