import * as Vue from 'vue';

const localStorageMock = {
    getItem: () => null,
    setItem: () => null,
    removeItem: () => null,
    clear: () => null,
};

Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
});

Object.assign(globalThis, Vue);