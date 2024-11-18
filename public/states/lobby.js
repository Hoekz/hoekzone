import { Emitter } from '/common/emitter.js';
import { Screen } from '/common/screen.js';

export class Lobby extends Emitter {
  static gameList = {
    depictable: 'draw',
  };

  constructor(app) {
    super();
    this.app = app;
    this.display = null;
  }

  create() {
    this.display = new Screen({
      canvas: this.app.canvas,
      overlay: this.app.overlay,
      title: 'Lobby',
    });

    const mode = this.app.get('mode');
    const isAdmin = this.app.get('user.admin');
    
    if (mode === 'host') {
      return this.shared();
    }
    
    this.display.create([
      this.app.overlay.iconButton('gear', () => {
        this.app.setState('userSettings');
      }, {
        right: 10,
        top: 10,
      }, 'Change your name and avatar'),
    ]);

    if (isAdmin) {
      this.admin();
    } else {
      this.user();
    }
  }

  destroy() {
    this.display?.destroy();
  }

  shared() {
    this.display.create([
      this.display.overlay.button('Join', () => {
        this.app.set('user.admin', false);
        this.app.set('user.ready', true);
        this.app.setState('depictable');
      }, {
        left: 10,
        right: 10,
        top: 60,
      }),
    ]);
  }

  admin() {
    this.app.set('user.ready', true);
    this.display.create([
      this.app.overlay.text('You\'re in charge! Choose a game:', {
        left: 10,
        right: 10,
        top: 60,
      }),
      ...Object.entries(Lobby.gameList)
      .map(([name, icon], i) => this.app.overlay.button(name, () => {
        this.emit('link', name);
      }, {
        left: 10,
        right: 10,
        top: i * 60 + 120,
      }, { icon }))
    ]);
  }

  user() {
    this.app.set('user.ready', true);
    this.display.create([
      this.app.overlay.text('Sit Tight! The game will start shortly.', {
        left: 10,
        right: 10,
        top: 60,
      }),
      this.app.overlay.image(this.app.get('user.image'), 'You look great!', {
        top: 120,
        left: this.app.canvas.width / 2,
        transform: 'translateX(-50%)',
      }),
    ]);
  }
}
