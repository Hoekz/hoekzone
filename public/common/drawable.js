import { Emitter } from './emitter.js';

function isPointOnLineSegment(pt, a, b) {
  if (pt.x > Math.max(a.x, b.x) || pt.x < Math.min(a.x, b.x) || pt.y > Math.max(a.y, b.y) || pt.y < Math.min(a.y, b.y)) {
    return false;
  }

  const dx = b.x - a.x;
  const dy = b.y - a.y;

  const pdx = pt.x - a.x;
  const pdy = pt.y - a.y;

  return dx * pdy === dy * pdx;
}

class Line {
  points = [];

  constructor({ x, y, color, width, points }) {
    this.color = color;
    this.width = width;
    if (points) {
      this.points = points;
    } else {
      this.points.push({ x, y });
    }
  }

  addPoint({ x, y }) {
    if (this.points.length > 1) {
      const prev = this.points[this.points.length - 1];
      const prev2 = this.points[this.points.length - 2];

      if (isPointOnLineSegment(prev, prev2, { x, y })) {
        this.setLastPoint({ x, y });
        return
      }
    }

    this.points.push({ x, y });
  }

  setLastPoint({ x, y }) {
    this.points[this.points.length - 1] = { x, y };
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    this.points.slice(1).forEach(point => ctx.lineTo(point.x, point.y));
    ctx.strokeStyle = this.color;
    ctx.stroke();
  }
}

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

function parseSVG(svg, bounds) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg.replace('data:image/svg+xml;utf8,', ''), 'image/svg+xml');
  const svgElement = doc.querySelector('svg');
  const viewBox = svgElement.getAttribute('viewBox').split(' ').map(parseFloat);
  const colors = new Set();
  let activeColor = null;
  const lines = Array.from(svgElement.querySelectorAll('polyline')).map(polyline => {
    const color = polyline.getAttribute('stroke').replace('%23', '#');
    colors.add(color);
    activeColor = activeColor || color;
    const width = parseFloat(polyline.getAttribute('stroke-width')) * bounds.width / viewBox[2];
    const points = polyline.getAttribute('points').split(' ').map(point => {
      const [x, y] = point.split(',');
      return {
        x: parseFloat(x) * bounds.width / viewBox[2] + bounds.x,
        y: parseFloat(y) * bounds.height / viewBox[3] + bounds.y,
      };
    });

    return new Line({ color, width, points });
  });

  return { lines, colors: Array.from(colors), activeColor };
}

export class Drawable extends Emitter {
  static padding = { top: 60, right: 10, bottom: 120, left: 10 };
  static ratio = { width: 4, height: 5 };

  constructor({ canvas, overlay, colors, title, withFill, svg }) {
    super();
    this.active = false;
    this.canvas = canvas;
    this.bounds = computeBounds(canvas);
    this.colors = colors;
    this.activeColor = this.colors[0];
    this.title = title;
    this.drawing = false;
    this.lines = [];
    this.mode = 'draw';
    this.ctx = canvas.getContext('2d');
    this.overlay = overlay;
    this.withFill = !!withFill;

    if (svg) {
      Object.assign(this, parseSVG(svg, this.bounds));
    }
  }

  create() {
    this.overlay.title(this.title);

    this.clearButton = this.overlay.iconButton('clear', this.clear, {
      left: this.bounds.x,
      top: this.bounds.y + this.bounds.height + 10,
      backgroundColor: '#cccccc',
    }, 'clear');

    this.colorButtons = this.colors.map((color, i) => this.overlay.iconButton('circle', () => this.setColor(color), {
      left: this.bounds.x + this.bounds.width - 50 * (i + 1),
      top: this.bounds.y + this.bounds.height + 10,
      backgroundColor: color,
    }, `select color ${color}`));

    this.modeButton = this.overlay.iconButton('draw', this.toggleMode, {
      left: this.bounds.x + this.bounds.width - 50 * (this.colors.length + 1),
      top: this.bounds.y + this.bounds.height + 10,
      backgroundColor: '#cccccc',
    }, 'toggle mode');

    this.submitButton = this.overlay.button('Submit', () => this.emit('submit', this.image()), {
      left: this.bounds.x,
      right: this.bounds.x + this.bounds.width,
      bottom: 10,
      height: 40,
      backgroundColor: '#cccccc',
      color: '#333333',
    });

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

    this.overlay.remove(this.clearButton);
    this.colorButtons.forEach(button => this.overlay.remove(button));
    this.overlay.remove(this.modeButton);
    this.overlay.remove(this.submitButton);

    cancelAnimationFrame(this.render);
    this.active = false;
  }

  attachEvents() {
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

  end = (e) => {
    this.drawing = false;
    console.log('end', this.lines);
  }

  render = () => {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.active) {
      return;
    }

    requestAnimationFrame(this.render);

    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(this.bounds.x - 5, this.bounds.y - 5, this.bounds.width + 10, this.bounds.height + 10);
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
  }

  clear = () => {
    this.lines = [];
  }

  setColor = (color) => {
    this.colorButtons.forEach(button => {
      button.style.outline = button.getAttribute('title').includes(color) ? '2px solid white' : 'none';
    });
    this.activeColor = color;
  }

  toggleMode = () => {
    console.log('toggle mode');
    this.mode = this.mode === 'draw' ? 'line' : 'draw';
    this.modeButton.setIcon(this.mode);
  }

  image = () => {
    const width = 2;
    const scaleWidth = 128;
    const scaleHeight = scaleWidth * Drawable.ratio.height / Drawable.ratio.width;

    return `data:image/svg+xml;utf8,
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${scaleWidth} ${scaleHeight}" width="${scaleWidth}" height="${scaleHeight}">
      ${this.withFill ? '<rect width="100%" height="100%" fill="white"/>' : ''}
      ${this.lines.map(({ color, points }) => `
        <polyline
          points="${points.map(({ x, y }) => `${
            (x - this.bounds.x) * scaleWidth / this.bounds.width
          },${
            (y - this.bounds.y) * scaleHeight / this.bounds.height
          }`).join(' ')}"
          stroke="%23${color.slice(1)}"
          fill="none"
          stroke-width="${width}"
          stroke-line-cap="round"
        />
      `).join('')}
    </svg>
    `.replace(/\s{2,}/g, ' ').replace(/>\s+</g, '><');
  }
}
