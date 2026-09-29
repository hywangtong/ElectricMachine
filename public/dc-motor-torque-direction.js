const fieldControl = document.querySelector('#field-control');
const currentControl = document.querySelector('#current-control');
const resetButton = document.querySelector('#reset-button');
const topPole = document.querySelector('#top-pole');
const bottomPole = document.querySelector('#bottom-pole');
const topPoleShape = document.querySelector('#top-pole-shape');
const bottomPoleShape = document.querySelector('#bottom-pole-shape');
const topCurrent = document.querySelector('#top-current');
const bottomCurrent = document.querySelector('#bottom-current');
const topForce = document.querySelector('#top-force');
const bottomForce = document.querySelector('#bottom-force');
const topForceLabel = document.querySelector('#top-force-label');
const bottomForceLabel = document.querySelector('#bottom-force-label');
const torquePath = document.querySelector('#torque-path');
const torqueLabel = document.querySelector('#torque-label');
const fieldLabel = document.querySelector('#field-label');
const resultPill = document.querySelector('#result-pill');
const fieldState = document.querySelector('#field-state');
const currentState = document.querySelector('#current-state');
const fieldLines = document.querySelectorAll('#field-lines path');
const caseRows = document.querySelectorAll('.case-row');

const state = {
  field: 1,
  current: 1,
};

window.addEventListener(
  'keydown',
  (event) => {
    if (event.key !== ' ' || !(event.target instanceof HTMLButtonElement))
      return;
    event.preventDefault();
    event.stopPropagation();
    event.target.click();
  },
  { capture: true },
);

function setForce(path, label, forward, y) {
  path.setAttribute('d', forward ? `M266 ${y}H394` : `M214 ${y}H86`);
  label.setAttribute('x', forward ? '350' : '130');
}

function render() {
  const clockwise = state.field * state.current === 1;
  const fieldDown = state.field === 1;
  const currentOriginal = state.current === 1;

  fieldControl.setAttribute('aria-pressed', String(!fieldDown));
  currentControl.setAttribute('aria-pressed', String(!currentOriginal));
  fieldState.textContent = fieldDown ? 'N 在上，S 在下' : 'S 在上，N 在下';
  currentState.textContent = currentOriginal ? '上 ·　下 ×' : '上 ×　下 ·';

  topPole.textContent = fieldDown ? 'N' : 'S';
  bottomPole.textContent = fieldDown ? 'S' : 'N';
  topPoleShape.classList.toggle('north-pole', fieldDown);
  topPoleShape.classList.toggle('south-pole', !fieldDown);
  bottomPoleShape.classList.toggle('south-pole', fieldDown);
  bottomPoleShape.classList.toggle('north-pole', !fieldDown);

  fieldLines.forEach((line) => {
    const x = line.dataset.x;
    line.setAttribute('d', fieldDown ? `M${x} 177V277` : `M${x} 277V177`);
  });
  fieldLabel.textContent = fieldDown ? 'Φ ↓' : 'Φ ↑';

  topCurrent.classList.toggle('current-in', !currentOriginal);
  bottomCurrent.classList.toggle('current-in', currentOriginal);
  setForce(topForce, topForceLabel, clockwise, 112);
  setForce(bottomForce, bottomForceLabel, !clockwise, 338);

  torquePath.setAttribute(
    'd',
    clockwise ? 'M606 168A60 60 0 1 1 546 228' : 'M546 228A60 60 0 1 0 606 168',
  );
  const turnText = clockwise ? '顺时针 ↻' : '逆时针 ↺';
  resultPill.textContent = turnText;
  torqueLabel.textContent = turnText;

  caseRows.forEach((row) => {
    row.classList.toggle(
      'is-active',
      Number(row.dataset.field) === state.field &&
        Number(row.dataset.current) === state.current,
    );
  });
}

fieldControl.addEventListener('click', () => {
  state.field *= -1;
  render();
});

currentControl.addEventListener('click', () => {
  state.current *= -1;
  render();
});

resetButton.addEventListener('click', () => {
  state.field = 1;
  state.current = 1;
  render();
});

render();
