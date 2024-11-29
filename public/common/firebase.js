import { Signal } from './signal.js';

export class FireSignal extends Signal {
  constructor(ref, defaultValue = null) {
    super(defaultValue);
    this.ref = ref;
  }

  on(handler, immediate = true) {
    super.on(handler, immediate);
    this.unsubscribe ??= this.ref.onSnapshot(snapshot => {
      this.value = snapshot.data();
      this.emit();
    });
  }

  off(handler) {
    super.off(handler);
    if (!this.listeners.length) {
      this.unsubscribe?.();
      this.unsubscribe = null;
    }
  }

  destroy() {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.ref = null;
    super.destroy();
  }

  set(value) {
    this.ref.set(value);
    this.value = value;
    this.emit();
  }

  emit() {
    this.listeners.forEach(listener => listener(this.value));
  }

  doc(id, defaultValue) {
    return fireSignal(this.ref.doc(id), defaultValue);
  }
}

export function fireSignal(ref, defaultValue) {
  return new FireSignal(ref, defaultValue);
}
