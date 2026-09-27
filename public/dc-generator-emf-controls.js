// Keep native control keys and gestures inside the embedded lesson.
window.addEventListener(
  'keydown',
  (event) => {
    if (!(event.target instanceof Element)) return;
    const isInput = event.target.closest('input, select');
    const isButton = event.target.closest('button');
    if (
      (isInput &&
        [
          'ArrowLeft',
          'ArrowRight',
          'ArrowUp',
          'ArrowDown',
          'Home',
          'End',
          'PageUp',
          'PageDown',
          ' ',
        ].includes(event.key)) ||
      (isButton && [' ', 'Enter'].includes(event.key))
    )
      event.stopPropagation();
  },
  true,
);

for (const control of document.querySelectorAll('input, select, button')) {
  for (const type of ['touchstart', 'touchend']) {
    control.addEventListener(type, (event) => event.stopPropagation(), {
      passive: true,
    });
  }
}
