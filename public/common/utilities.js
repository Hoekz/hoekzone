export const get = (path) => (obj) => path.split('.').reduce((acc, key) => acc[key], obj);
export const set = (path, value) => (obj) => {
    const keys = path.split('.');
    const last = keys.pop();
    const target = keys.reduce((acc, key) => acc[key], obj);
    target[last] = value;
    return obj;
};

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
