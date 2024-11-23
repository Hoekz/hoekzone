import { Component } from '/common/component.js';
import { Drawable } from '/common/drawable.js';
import { Screen } from '/common/screen.js';
import { image } from '/common/element.js';
import { prompts } from '/data/depictable.js';

export class Depictable extends Component {
  title = 'Depictable';
  states = ['draw', 'wait', 'title', 'guess', 'results'];

  constructor(app) {
    super();
    this.app = app;
  }

  draw() {
    return new Drawable({
      canvas: this.app.canvas,
      overlay: this.app.overlay,
      colors: ['#ec5436', '#f7b733'],
      title: prompts[Math.floor(Math.random() * prompts.length)],
      withFill: true,
      events: {
        submit: (image) => {
          this.app.set('image', image);
          this.state = 'wait';
        },
      },
    });
  }

  wait() {
    return new Screen({
      title: 'Done! Waiting for other players...',
      canvas: this.app.canvas,
      overlay: this.app.overlay,
      elements: [
        image(this.app.get('image'), { top: 60 }, { altText: 'Here is your drawing!' }),
      ],
    });
  }
}
