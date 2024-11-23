import { Emitter } from './emitter.js';

export class Component extends Emitter {
  constructor(title = 'Unknown Component') {
    super();
    this.title = title;
    this.states = [];
    this._state = '';
    this._display = null;
  }

  get display() {
    return this._display;
  }

  set display(display) {
    this._display?.destroy();
    if (display instanceof Promise) {
      display.then(display => {
        this._display = display;
        this._display?.create();
        this.emit('display', this.state);
      });
    } else {
      this._display = display;
      this._display?.create();
      this.emit('display', this.state);
    }
  }

  get state() {
    return this._state;
  }

  set state(state) {
    this._state = state;
    this.display = this[state]();
    this.emit('state', state);
  }

  create() {
    this.state = this.states[0];
    this.emit('create');
  }

  destroy() {
    this.display = null;
    this.emit('destroy');
  }
}
