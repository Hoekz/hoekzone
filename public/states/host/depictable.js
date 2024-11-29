import { fireSignal } from '/common/firebase.js';
import { Component } from '/common/component.js';
import { prompts } from '/data/depictable.js';
import { wait } from '/common/utilities.js';

function randomize(list) {
  const copy = list.slice();
  const randomized = [];

  while (copy.length) {
    const index = Math.floor(Math.random() * copy.length);
    randomized.push(copy.splice(index, 1)[0]);
  }

  return randomized;
}

export class DepictableServer {
  constructor(collection) {
    this.collection = collection;
    this.players = fireSignal(collection.doc('players'), []);
    this.game = fireSignal(collection.doc('game'), null);
    this.round = 'first';
    this.state = 'draw';
    this.subRound = 0;
  }

  create(players) {
    const pool = prompts.slice();
    const firstPrompts = randomize(players).map(player => ({
      player,
      prompt: pool.splice(Math.floor(Math.random() * pool.length), 1)[0],
      image: '',
      titles: players.map(player => ({ player, title: '', votes: [], favorites: [], done: false })),
    }));
    const secondPrompts = randomize(players).map(player => ({
      player,
      prompt: pool.splice(Math.floor(Math.random() * pool.length), 1)[0],
      image: '',
      titles: players.map(player => ({ player, title: '', votes: [], favorites: [], done: false })),
    }));

    this.game.set({
      round: 'first',
      subRound: 0,
      state: 'draw',
      first: { prompts: firstPrompts, done: false },
      second: { prompts: secondPrompts, done: false },
    });

    this.round = 'first';
    this.state = 'draw';
    this.subRound = 0;
  }

  set(data) {
    if (data.round) this.round = data.round;
    if (data.subRound) this.subRound = data.subRound;
    if (data.state) this.state = data.state;
    this.game.update(data);
  }

  gameLoop(game) {
    if (!game) return;

    const { round, state } = game;
    const roundData = game[round];
    this.round = round;
    this.state = state;
    this.subRound = 0;

    switch (state) {
      case 'draw':
        if (this.doneDrawing(roundData)) {
          this.set({ state: 'title', subRound: 0 });
        }
        break;
      case 'title':
        if (this.doneTitles(roundData)) {
          this.set({ state: 'guess' });
        }
        break;
      case 'guess':
        if (this.doneRound(roundData)) {
          this.set({ state: 'results' });
        } else if (this.doneSubRound(roundData, this.subRound)) {
          this.set({ state: 'title', subRound: this.subRound + 1 });
        }
        break;
      case 'results':
        if (this.doneResults(roundData)) {
          if (round === 'first') {
            this.set({ state: 'draw', round: 'second', subRound: 0 });
          } else {
            this.set({ state: 'finish', round: 'finish', subRound: 0 });
          }
        }
        break;
      case 'finish':
        break;
    }
  }

  doneDrawing(round) {
    return round.prompts.every(prompt => prompt.image);
  }

  doneTitles(round) {
    return round.prompts.every(prompt => prompt.titles.every(title => title.title));
  }

  doneRound(round) {
    return round.prompts.every(prompt => prompt.titles.every(title => title.done));
  }

  doneSubRound(round, subRound) {
    return round.prompts[subRound].titles.every(title => title.done);
  }
}

export class DepictableHost extends Component {
  states = ['draw', 'wait', 'title', 'guess', 'results', 'finish'];
  transition = 1000;

  constructor(app) {
    super('Depictable');
    this.app = app;
    this.server = new DepictableServer(app.collection);

    this.unsubState = this.server.game.on(async game => {
      if (game.state !== this.state) {
        this.emit('stop', this.state);
        await wait(this.transition);
        this.state = game.state;
        this.emit('start', this.state);
      }
    });

    this.subscriptions = [];
  }

  destroy() {
    super.destroy();
    this.unsubState();
    this.subscriptions.forEach(unsub => unsub());
  }

  draw() {
    return new Screen({
      canvas: this.app.canvas,
      overlay: this.app.overlay,
      title: 'Time to Draw!',
      elements: [
        image('https://via.placeholder.com/300', { top: 60 }, { altText: 'Prompt' }),
      ],
    });
  }

  wait() {
    // TODO: set condition for moving to next state

    return new Screen({
      canvas: this.app.canvas,
      overlay: this.app.overlay,
      title: 'Waiting for other players...',
    });
  }

  title() {
    // TODO: set condition for moving to next state

    return new Screen({
      canvas: this.app.canvas,
      overlay: this.app.overlay,
      title: 'Title',
    });
  }

  guess() {
    // TODO: set condition for moving to next state

    return new Screen({
      canvas: this.app.canvas,
      overlay: this.app.overlay,
      title: 'Guess',
    });
  }

  results() {
    // TODO: set condition for moving to next state

    return new Screen({
      canvas: this.app.canvas,
      overlay: this.app.overlay,
      title: 'Results',
    });
  }
}