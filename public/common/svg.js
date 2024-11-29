import { Line } from './line.js';

export function fromSVG(svg, bounds) {
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

export function toURI(svg) {
  if (typeof svg === 'string' && svg.startsWith('<svg')) {
    return `data:image/svg+xml;utf8,${svg.replace(/#/g, '%23')}`;
  }

  if (svg instanceof Element) {
    return toURI(svg.outerHTML);
  }

  return svg;
}

export function toSVG(lines, bounds, backdrop) {
  const width = 2;
  const scaleWidth = 128;
  const scaleHeight = scaleWidth * bounds.height / bounds.width;
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${scaleWidth} ${scaleHeight}" width="${scaleWidth}" height="${scaleHeight}">
      ${backdrop ? `<rect width="100%" height="100%" fill="${backdrop}"/>` : ''}
      ${lines.map(({ color, points }) => `
        <polyline
          points="${points.map(({ x, y }) => `${
            ((x - bounds.x) * scaleWidth / bounds.width).toFixed(2)
          },${
            ((y - bounds.y) * scaleHeight / bounds.height).toFixed(2)
          }`).join(' ')}"
          stroke="${color}"
          fill="none"
          stroke-width="${width}"
          stroke-linecap="round"
        />
      `).join('')}
    </svg>
    `.trim().replace(/\s{2,}/g, ' ').replace(/>\s+</g, '><');
}

export function animateDrawing(svg, times) {
  const { delay, duration, fadeDuration } = times || { delay: 0, duration: 5 };
  const polylines = [...svg.querySelectorAll('polyline')];
  const totalLength = polylines.reduce((total, polyline) => total + polyline.getTotalLength(), 0);

  let currentDelay = delay;

  for (const [index, polyline] of polylines.entries()) {
    const length = polyline.getTotalLength();
    const dur = length / totalLength * duration;

    polyline.style.setProperty('--length', Math.ceil(length));
    polyline.style.setProperty('--duration', dur + 's');
    polyline.style.setProperty('--delay', currentDelay + 's');

    currentDelay += dur;
  }

  svg.classList.add('animate-drawing');
  svg.style.setProperty('--total-duration', (fadeDuration || duration) + 's');
}
