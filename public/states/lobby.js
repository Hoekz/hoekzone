import { Component } from '/common/component.js';
import { Screen } from '/common/screen.js';
import { button, text, image, iconButton } from '/common/element.js';

export class Lobby extends Component {
  static gameList = {
    depictable: 'draw',
  };

  states = ['lobby'];

  constructor(app) {
    super('Lobby');
    this.app = app;
  }

  lobby() {
    const mode = this.app.get('mode');
    const isAdmin = this.app.get('user.admin');
    let elements = [];
    
    if (mode === 'host') {
      elements = this.shared();
    } else {
      const userSettings = iconButton('gear', {
        right: 10,
        top: 10,
      }, { click: () => this.app.state = 'userSettings' });
      const lobbyContent = isAdmin ? this.admin() : this.user();
      elements = [userSettings, ...lobbyContent];
    }
    
    console.log('elements', elements);
    return new Screen({
      canvas: this.app.canvas,
      overlay: this.app.overlay,
      title: 'Lobby',
      elements,
    });
  }

  shared() {
    const users = [];

    // TODO: Add users to lobby

    return [];
  }

  admin() {
    return [
      text('You\'re in charge! Choose a game:', {
        left: '50%',
        transform: 'translateX(-50%)',
        top: 60,
      }),
      ...Object.entries(Lobby.gameList).map(([name, icon], i) => button(name, {
        left: '50%',
        transform: 'translateX(-50%)',
        top: i * 60 + 120,
      }, { click: () => this.emit('link', name) }, { icon }))
    ];
  }

  user() {
    return [
      text('Sit Tight! The game will start shortly.', {
        left: '50%',
        transform: 'translateX(-50%)',
        top: 60,
      }),
      image(this.app.get('user.image'), {
        top: 120,
        left: this.app.canvas.width / 2,
        transform: 'translateX(-50%)',
      }, { altText: 'You look great!' }),
    ];
  }
}
