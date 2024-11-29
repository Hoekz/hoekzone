
export function isPointOnLineSegment(pt, a, b) {
  if (pt.x > Math.max(a.x, b.x) || pt.x < Math.min(a.x, b.x) || pt.y > Math.max(a.y, b.y) || pt.y < Math.min(a.y, b.y)) {
    return false;
  }

  const dx = b.x - a.x;
  const dy = b.y - a.y;

  const pdx = pt.x - a.x;
  const pdy = pt.y - a.y;

  return dx * pdy === dy * pdx;
}

export class Line {
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
