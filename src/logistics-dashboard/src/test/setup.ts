import '@testing-library/jest-dom'

// jsdom doesn't implement HTMLDialogElement methods
if (typeof HTMLDialogElement !== 'undefined') {
  HTMLDialogElement.prototype.showModal = HTMLDialogElement.prototype.showModal || function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = HTMLDialogElement.prototype.close || function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  };
} else {
  // Older jsdom versions don't define HTMLDialogElement at all
  Object.defineProperty(window, 'HTMLDialogElement', { value: class extends HTMLElement {} });
}
