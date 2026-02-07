export type BackHandler = () => boolean | void;

const handlers: BackHandler[] = [];

export const backController = {
  push(handler: BackHandler) {
    handlers.push(handler);
  },

  pop(handler?: BackHandler) {
    if (handlers.length === 0) return;

    if (!handler) {
      handlers.pop();
      return;
    }

    for (let i = handlers.length - 1; i >= 0; i -= 1) {
      if (handlers[i] === handler) {
        handlers.splice(i, 1);
        return;
      }
    }
  },

  run(): boolean {
    const top = handlers[handlers.length - 1];
    if (!top) return false;
    return top() === true;
  },
};
