import { Emitter } from '/common/emitter.js';
import { Screen } from '/common/screen.js';
import { Drawable } from '/common/drawable.js';

export class UserSettings extends Emitter {
  constructor(app) {
    super();
    this.app = app;
    this.state = 'name';
    this.display = null;
  }

  create() {
    this.setState('name');
  }

  destroy() {
    this.display?.destroy();
  }

  setState(state) {
    this.state = state;
    this.display?.destroy();
    this.display = null;

    switch (state) {
      case 'name':
        this.name();
        break;
      case 'image':
        this.image();
        break;
    }
  }

  name() {
    this.display = new Screen({
      canvas: this.app.canvas,
      overlay: this.app.overlay,
      title: 'Name Yourself!',
    });

    this.display.create([
      this.app.overlay.input('Name', {
        get: () => this.app.get('user.name') || '',
        set: (value) => this.app.set('user.name', value),
      }, {
        left: 10,
        right: 10,
        top: 60,
      }),
      this.app.overlay.button('Save', () => {
        this.setState('image');
      }, {
        left: 10,
        right: 10,
        top: 120,
      }),
    ]);
  }

  image() {
    this.display = new Drawable({
      canvas: this.app.canvas,
      overlay: this.app.overlay,
      colors: this.app.get('colors') || ['#ec5436', '#f7b733'],
      title: 'Draw Yourself!',
      svg: this.app.get('user.image') || null,
    });

    this.display.on('submit', (image) => {
      this.app.set('user.image', image);
      this.emit('done');
    });

    this.display.create();
  }
}