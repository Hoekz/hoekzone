import { Screen } from '/common/screen.js';
import { Drawable } from '/common/drawable.js';
import { Component } from '/common/component.js';
import { input, button } from '../common/element.js';

export class UserSettings extends Component {
  states = ['name', 'image'];

  constructor(app) {
    super('User Settings');
    this.app = app;
  }

  name() {
    return new Screen({
      canvas: this.app.canvas,
      overlay: this.app.overlay,
      title: 'Name Yourself!',
      elements: [
        input('Name', this.app.value('user.name', ''), {
          left: '50%',
          transform: 'translateX(-50%)',
          top: 60,
        }),
        button('Save', {
          left: '50%',
          transform: 'translateX(-50%)',
          top: 120,
        }, { click: () => this.state = 'image' }),
      ],
    });
  }

  image() {
    return new Drawable({
      canvas: this.app.canvas,
      overlay: this.app.overlay,
      colors: this.app.get('colors') || ['#ec5436', '#f7b733'],
      title: 'Draw Yourself!',
      svg: this.app.get('user.image') || '',
      events: {
        submit: (image) => {
          this.app.set('user.image', image);
          this.emit('link', 'lobby');
        },
      },
    });
  }
}