const states = {
  userSettings: () => import('./states/userSettings.js').then(({ UserSettings }) => UserSettings),
  lobby: () => import('./states/lobby.js').then(({ Lobby }) => Lobby),
  depictable: () => import('./states/depictable.js').then(({ Depictable }) => Depictable),
}

export class App {
  constructor({ user, canvas, overlay }) {
    this.user = user;
    this.canvas = canvas;
    this.overlay = new Overlay(overlay);
    this.state = '';
    this.display = null;
    this.store = {
      'user.admin': true,
    };
  }
  
  create(state) {
    this.setState(state || 'userSettings');
  }

  destroy() {
    this.surface.destroy();
  }

  async setState(state) {
    this.display?.destroy();
    this.display = null;
    this.state = state;

    const State = await states[state]();
    this.display = new State(this);
    this.display.create();
    if (state !== 'lobby') {
      this.display.on('done', () => this.setState('lobby'));
    }
    this.display.on('link', (state) => this.setState(state));
  }

  set(key, value) {
    this.store[key] = value;
    console.log('set', key, value);
  }

  get(key) {
    return this.store[key];
  }
}

function pixelify(style) {
  return Object.entries(style).reduce((acc, [key, value]) => {
    acc[key] = typeof value === 'number' ? `${value}px` : value;
    return acc;
  }, {});
}

class Overlay {
  constructor(element) {
    this.element = element;
  }

  addEventListener(event, handler) {
    this.element.addEventListener(event, handler, false);
  }

  removeEventListener(event, handler) {
    this.element.removeEventListener(event, handler, false);
  }

  remove(element) {
    this.element.removeChild(element);
  }

  text(text, style) {
    const element = document.createElement('p');
    element.textContent = text;
    Object.assign(element.style, {
      position: 'absolute',
      fontWeight: 'bold',
      textAlign: 'center',
    }, pixelify(style));

    this.element.appendChild(element);

    return element;
  }

  button(text, action, style, { icon } = {}) {
    const button = document.createElement('button');
    button.setAttribute('type', 'button');
    button.textContent = text;

    if (icon) {
      const iconElement = document.createElement('i');
      iconElement.classList.add('icon', icon);
      iconElement.style.position = 'static';
      iconElement.style.margin = '0 5px';
      button.insertBefore(iconElement, button.firstChild);
    }

    Object.assign(button.style, {
      height: '45px',
      border: 'none',
      borderRadius: '5px',
      backgroundColor: '#cccccc',
      color: '#333333',
      cursor: 'pointer',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '5px',
    }, pixelify(style));
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      action(e);
    }, true);
    this.element.appendChild(button);
    return button;
  }

  iconButton(icon, action, style, title = icon) {
    const button = document.createElement('button');
    button.setAttribute('type', 'button');
    button.setAttribute('title', title);
    Object.assign(button.style, {
      width: '45px',
      height: '45px',
      border: 'none',
      borderRadius: '20%',
      backgroundColor: '#cccccc',
      color: '#333333',
      cursor: 'pointer',
    }, pixelify(style));
    button.innerHTML = `<i class="icon ${icon}">${icon}</i>`;
    button.addEventListener('click', (e) => {
      console.log('click', icon);
      e.preventDefault();
      e.stopPropagation();
      action(e);
    }, true);
    button.setIcon = (icon) => button.innerHTML = `<i class="icon ${icon}">${icon}</i>`;
    this.element.appendChild(button);
    return button;
  }

  input(label, { get, set }, style) {
    const input = document.createElement('input');
    input.setAttribute('type', 'text');
    input.setAttribute('placeholder', label);
    input.value = get();
    input.addEventListener('input', (e) => set(e.target.value), false);
    Object.assign(input.style, {
      height: '45px',
      border: 'none',
      borderRadius: '5px',
      backgroundColor: '#cccccc',
      color: '#333333',
      padding: '0 10px',
      fontWeight: 'bold',
    }, pixelify(style));
    this.element.appendChild(input);
    return input;
  }

  title(text) {
    const existingTitle = this.element.querySelector('h1');
    if (existingTitle) {
      this.element.removeChild(existingTitle);
    }

    if (text) {
      const title = document.createElement('h1');
      title.textContent = text;
      Object.assign(title.style, {
        width: '100%',
        textAlign: 'center',
        position: 'absolute',
        top: 15,
        left: 0,
        fontSize: Math.min(20, Math.floor(360 / text.length)) + 'px',
        fontWeight: 'bold',
      });
      this.element.appendChild(title);
    }
  }

  image(src, alt, style) {
    const image = document.createElement('img');
    image.src = src;
    image.alt = alt;
    Object.assign(image.style, {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      lineHeight: '100',
      fontWeight: 'bold',
    }, pixelify(style));
    this.element.appendChild(image);
    return image;
  }
}
