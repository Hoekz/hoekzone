import { Component } from '/common/component.js';
import { signal } from '/common/signal.js';

export class App extends Component {
  states = ['userSettings', 'lobby', 'depictable'];

  constructor({ user, canvas, overlay }) {
    super('Hoekzone');
    this.user = user;
    this.canvas = canvas;
    this.overlay = overlay;
    this.store = {
      'user.admin': true,
    };
  }

  create() {
    super.create();

    this.on('display', () => {
      console.log('display', this.state);
      this.display.on('link', (state) => {
        console.log('link', state);
        this.state = state;
      });
    });
  }

  async userSettings() {
    const {  UserSettings } = await import('./states/userSettings.js');
    return new UserSettings(this);
  }

  async lobby() {
    const { Lobby } = await import('./states/lobby.js');
    return new Lobby(this);
  }

  async depictable() {
    const { Depictable } = await import('./states/depictable.js');
    return new Depictable(this);
  }

  set(key, value) {
    this.store[key] = value;
    console.log('set', key);
  }

  get(key) {
    return this.store[key];
  }

  value(key, defaultValue) {
    return this.store[key] = this.store[key] || signal(defaultValue);
  }
}
