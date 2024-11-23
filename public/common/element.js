// import { Component } from './component.js';
import { Emitter } from './emitter.js';
import { Signal } from './signal.js';

export class Element extends Emitter {
  constructor(tag, props) {
    super();
    this.tag = tag;
    this.props = props;
    this.element = null;
    this.subscriptions = [];
  }

  create(parent = null) {
    this.element = document.createElement(this.tag);

    if (parent) {
      parent.appendChild(this.element);
    }

    for (const [style, value] of Object.entries(this.props.style || {})) {
      if (value instanceof Signal) {
        this.subscriptions.push(value.on(this, (value) => this.style(style, value)));
      } else {
        this.style(style, value);
      }
    }

    for (const [event, handler] of Object.entries(this.props.events || {})) {
      this.element.addEventListener(event, handler);
    }

    for (const [attr, value] of Object.entries(this.props.attrs || {})) {
      if (value instanceof Signal) {
        this.subscriptions.push(value.on(this, (value) => this.attribute(attr, value)));
      } else {
        this.attribute(attr, value);
      }
    }

    if (this.props.class instanceof Signal) {
      this.subscriptions.push(this.props.class.on((value) => this.attribute('class', value)));
    } else if (this.props.class) {
      this.attribute('class', this.props.class);
    }

    if (this.props.text instanceof Signal) {
      this.subscriptions.push(this.props.text.on((text) => this.element.textContent = text));
    } else if (this.props.text instanceof Element) {
      this.props.text.create(this.element);
    } else {
      this.element.textContent = this.props.text;
    }

    if (this.props.children) {
      this.props.children.forEach(child => child.create(this.element));
    }

    if (this.props.value instanceof Signal) {
      this.subscriptions.push(this.props.value.on((value) => this.element.value = value));
      this.element.addEventListener('input', (e) => this.props.value.set(e.target.value));
    } else if (this.props.value) {
      this.element.value = this.props.value;
    }

    this.emit('create');
  }

  style(key, value) {
    if (typeof value === 'number') {
      this.element.style[key] = `${value}px`;
    } else if (typeof value === 'string') {
      this.element.style[key] = value;
    } else {
      this.element.style[key] = value.toString();
    }
  }

  attribute(key, value) {
    if (key === 'class') {
      this.element.className = value instanceof Array
        ? value.join(' ')
        : value instanceof Object
          ? Object.entries(value).filter(([key, value]) => value).map(([key]) => key).join(' ')
          : value;
      return;
    }

    if (key === 'data') {
      for (const [key, value] of Object.entries(value)) {
        this.element.dataset[key] = value;
      }

      return;
    }

    this.element.setAttribute(key.replaceAll(/([A-Z])/g, '-$1').toLowerCase(), value);
  }

  on(event, handler) {
    this.element.addEventListener(event, handler);
    return () => this.element.removeEventListener(event, handler);
  }

  get(selector) {
    return this.element.querySelector(selector);
  }

  destroy() {
    if (this.element) {
      this.element.parentNode.removeChild(this.element);
    }

    this.element = null;
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions = [];
    this.emit('destroy');
  }
}

export function element(tag, props) {
  return new Element(tag, props);
}

export function text(text, style = {}, props = {}) {
  return element('p', { text, style, ...props });
}

export function button(text, style = {}, events = {}, props = {}) {
  if ((style.width !== 'auto' || style.width !== '100%') && style.width) {
    style.maxWidth = 'none';
  }
  return element('button', { text, style, events, ...props });
}

export function input(name, value, style = {}, events = {}, props = {}) {
  return element('input', { ...props, value, style, events, attrs: { ...props?.attrs, placeholder: name, name,  type: 'text' } });
}

export function image(src, style = {}, props) {
  return element('img', { ...props, style, attrs: { ...props?.attrs, src } });
}

export function icon(name, style = {}, props) {
  return element('i', { class: `icon ${name}`, style, ...props });
}

export function iconButton(iconName, style = {}, events = {}, props = {}) {
  const btn = button(icon(iconName), { ...style, width: 45 }, events, { ...props });
  return btn;
}
