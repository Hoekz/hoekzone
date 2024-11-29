import { Emitter } from './emitter.js';
import { Line } from './line.js';
import * as svg from './svg.js';
import { button, iconButton } from './element.js';

function computeBounds(canvas) {
  const { width, height } = canvas.getBoundingClientRect();
  const availableWidth = width - Drawable.padding.left - Drawable.padding.right;
  const availableHeight = height - Drawable.padding.top - Drawable.padding.bottom;
  const maxWidth = availableHeight * Drawable.ratio.width / Drawable.ratio.height;
  const maxHeight = availableWidth * Drawable.ratio.height / Drawable.ratio.width;

  if (maxWidth < availableWidth) {
    return { x: width / 2 - maxWidth / 2, y: Drawable.padding.top, width: maxWidth, height: availableHeight };
  }

  return { x: width / 2 - availableWidth / 2, y: Drawable.padding.top, width: availableWidth, height: maxHeight };
}

export class Drawable extends Emitter {
  static padding = { top: 60, right: 10, bottom: 120, left: 10 };
  static ratio = { width: 4, height: 5 };

  constructor({ canvas, overlay, colors, title, withFill, image, events }) {
    super();
    this.active = false;
    this.canvas = canvas;
    this.bounds = computeBounds(canvas);
    this.title = title;
    this.drawing = false;
    this.lines = [];
    this.mode = 'draw';
    this.ctx = canvas.getContext('2d');
    this.overlay = overlay;
    this.withFill = !!withFill;
    
    if (image) {
      Object.assign(this, svg.fromSVG(image, this.bounds));
    }
    
    this.colors = colors ?? this.colors ?? ['#000000'];
    this.activeColor = this.colors[0];

    if (events) {
      this.on('submit', events.submit);
    }
  }

  create() {
    this.overlay.innerHTML = `<h1>${this.title}</h1>`;

    this.clearButton = iconButton('clear', {
      left: this.bounds.x,
      top: this.bounds.y + this.bounds.height + 10,
      backgroundColor: '#cccccc',
    }, {}, { attrs: { title: 'clear' } });
    this.clearButton.create(this.overlay);

    this.colorButtons = this.colors.map((color, i) => {
      const btn = iconButton('circle', {
        left: this.bounds.x + this.bounds.width - 50 * (i + 1),
        top: this.bounds.y + this.bounds.height + 10,
        backgroundColor: color,
      }, {}, { attrs: { title: `select color ${color}`, color } });
      btn.create(this.overlay);
      return btn;
    });

    this.modeButton = iconButton('draw', {
      left: this.bounds.x + this.bounds.width - 50 * (this.colors.length + 1),
      top: this.bounds.y + this.bounds.height + 10,
      backgroundColor: '#cccccc',
    }, {}, { attrs: { title: 'toggle mode' } });
    this.modeButton.create(this.overlay);

    this.submitButton = button('Submit', {
      left: this.bounds.x,
      width: this.bounds.width,
      bottom: 10,
      height: 40,
      backgroundColor: '#cccccc',
      color: '#333333',
    });
    this.submitButton.create(this.overlay);

    this.attachEvents();
    this.setColor(this.activeColor);

    this.active = true;
    requestAnimationFrame(this.render);
  }

  destroy() {
    this.overlay.removeEventListener('mousedown', this.start);
    this.overlay.removeEventListener('mousemove', this.move);
    this.overlay.removeEventListener('mouseup', this.end);
    this.overlay.removeEventListener('touchstart', this.start);
    this.overlay.removeEventListener('touchmove', this.move);
    this.overlay.removeEventListener('touchend', this.end);

    this.clearButton.destroy();
    this.modeButton.destroy();
    this.submitButton.destroy();
    this.colorButtons.forEach(button => button.destroy());

    cancelAnimationFrame(this.render);
    this.active = false;
  }

  attachEvents() {
    this.clearButton.on('click', this.clear);
    this.modeButton.on('click', this.toggleMode);
    this.submitButton.on('click', () => this.emit('submit', this.image()));
    this.colorButtons.forEach((button, i) => button.on('click', () => this.setColor(this.colors[i])));

    this.overlay.addEventListener('mousedown', this.start);
    this.overlay.addEventListener('mousemove', this.move);
    this.overlay.addEventListener('mouseup', this.end);
    this.overlay.addEventListener('touchstart', this.start);
    this.overlay.addEventListener('touchmove', this.move);
    this.overlay.addEventListener('touchend', this.end);
  }

  start = (e) => {
    let { offsetX: x, offsetY: y } = e;
    if (e.touches) {
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    }

    if (x < this.bounds.x || x > this.bounds.x + this.bounds.width) return;
    if (y < this.bounds.y || y > this.bounds.y + this.bounds.height) return;
    const width = this.bounds.width / 64;

    this.drawing = true;
    this.lines.push(new Line({ x, y, color: this.activeColor, width }));
  }

  move = (e) => {
    let { offsetX: x, offsetY: y } = e;
    if (e.touches) {
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    }

    if (x < this.bounds.x || x > this.bounds.x + this.bounds.width) return;
    if (y < this.bounds.y || y > this.bounds.y + this.bounds.height) return;

    if (this.drawing) {
      const line = this.lines[this.lines.length - 1];
      if (this.mode === 'draw' || line.points.length === 1) {
        line.addPoint({ x, y });
      } else if (this.mode === 'line') {
        line.setLastPoint({ x, y });
      }
    }
  }

  end = () => this.drawing = false;

  render = () => {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.active) {
      return;
    }

    requestAnimationFrame(this.render);

    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);

    this.lines.filter(line => line.points.length > 1).forEach(({ color, width, points }) => {
      this.ctx.beginPath();
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = width;
      this.ctx.lineCap = 'round';
      this.ctx.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach(point => this.ctx.lineTo(point.x, point.y));
      this.ctx.stroke();
    });

    this.ctx.strokeStyle = 'black';
    this.ctx.lineWidth = 10;
    this.ctx.strokeRect(this.bounds.x - 5, this.bounds.y - 5, this.bounds.width + 10, this.bounds.height + 10);
  }

  clear = () => {
    this.lines = [];
  }

  setColor = (color) => {
    this.colorButtons.forEach(button => {
      if (button.props.attrs.color === color) {
        button.element.classList.add('active');
      } else {
        button.element.classList.remove('active');
      }
    });
    this.activeColor = color;
  }

  toggleMode = () => {
    this.mode = this.mode === 'draw' ? 'line' : 'draw';
    this.modeButton.get('i').className = `icon ${this.mode}`;
  }

  image = () => svg.toURI(svg.toSVG(this.lines, this.bounds, this.withFill ? 'white' : null));
}
