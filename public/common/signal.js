const register = [];

export class Signal {
  constructor(value) {
    this.value = value;
    this.listeners = [];
  }

  destroy() {
    this.listeners = [];
  }

  toString() {
    return this.value.toString();
  }

  on(handler, immediate = true) {
    this.listeners.push(handler);
    if (immediate) handler(this.value);
    return () => this.off(handler);
  }

  off(handler) {
    this.listeners = this.listeners.filter(listener => listener !== handler);
  }

  get() {
    if (register.length) {
      register[register.length - 1].push(this);
    }

    return this.value;
  }

  set(value) {
    this.value = value;
    this.listeners.forEach(listener => listener(value));
  }
}

export function signal(value) {
  return new Signal(value);
}

export class Computed extends Signal {
  constructor(fn) {
    register.push([]);
    super(fn());
    this.upstream = register.pop().map(target => target.on(() => {
      this.value = fn();
      this.listeners.forEach(listener => listener(this.value));
    }, false));
    this.fn = fn;
  }

  destroy() {
    this.upstream.forEach(unsubscribe => unsubscribe());
    this.upstream = [];
    super.destroy();
  }

  set(value) {
    throw new Error('Cannot set value of computed signal');
  }
}

export function computed(fn) {
  return new Computed(fn);
}

export function lens(signal, transform) {
  return computed(() => transform(signal.get()));
}

export function event(element, event, transform, defaultValue = null) {
  const signal = signal(defaultValue);
  element.addEventListener(event, (e) => signal.set(transform?.(e) ?? e));
  return signal;
}
