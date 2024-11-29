export class Emitter {
  constructor() {
    this.listeners = {};
  }

  destroy() {
    this.listeners = {};
  }

  on(event, handler) {
    this.listeners[event] = this.listeners[event] || [];
    this.listeners[event].push(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(h => h !== handler);
    }
  }

  emit(event, ...args) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(handler => handler(...args));
    }
  }
}

export class IntervalEmitter extends Emitter {
  constructor(interval) {
    super();
    this.interval = interval;
    this.intervalId = null;
  }

  start() {
    this.stop();
    this.intervalId = setInterval(() => this.emit('tick'), this.interval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
