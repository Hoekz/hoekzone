import { Component } from '/common/component.js';
import { prompts } from '/data/depictable.js';

export class DepictableHost extends Component {
  states = ['draw', 'wait', 'title', 'guess', 'results', 'finish'];
  flow = {
    assign: [['draw', 'assignmentsDone']],
    draw: [['title', 'drawDone']],
    title: [['guess', 'titleDone']],
    guess: [['results', 'guessDone']],
    results: [
      ['finish', 'allRoundsDone'],
      ['draw', 'roundDone'],
      ['title', 'resultsDone'],
    ],
  }

  constructor(app) {
    super('Depictable');
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
        }
      }
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