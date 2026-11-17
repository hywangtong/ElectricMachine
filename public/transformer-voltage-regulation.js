const notes = [
  '取折算后的 −U̇₂′ 为水平基准。感性负载时，电流 İ₁ 滞后端电压 φ₂。',
  '从 −U̇₂′ 的箭头端接上电阻压降 İ₁Rₛ，它与电流 İ₁ 同向。',
  '从电阻压降的箭头端接上漏抗压降 jİ₁Xₛ。乘 j 表示相对 İ₁ 逆时针转 90°。',
  'U₁N cos δ − U₂′ = I₁Rₛ cos φ₂ + I₁Xₛ sin φ₂。小角度下，这两个水平投影之和近似等于 U₁N − U₂′。',
];

const layers = [...document.querySelectorAll('[data-layer]')];
const steps = [...document.querySelectorAll('[data-step]')];
const note = document.querySelector('#regulation-step-note');
const play = document.querySelector('#play-regulation');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let active = steps.length - 1;
let timer;

function showStep(index) {
  active = index;
  for (const [i, layer] of layers.entries()) {
    for (const animation of layer.getAnimations({ subtree: true })) {
      animation.cancel();
    }
    layer.toggleAttribute('hidden', i > index);
    steps[i].setAttribute('aria-pressed', String(i === index));
  }
  note.textContent = notes[index];
  if (reducedMotion.matches) return;

  const layer = layers[index];
  for (const vector of layer.querySelectorAll('.vector')) {
    vector.animate(
      [
        { strokeDasharray: '1', strokeDashoffset: '1', opacity: 0 },
        { strokeDasharray: '1', strokeDashoffset: '0', opacity: 1 },
      ],
      { duration: 540, easing: 'ease-out' },
    );
  }
  for (const [selector, delay] of [
    ['.equal-radius', 480],
    ['.projections', 780],
  ]) {
    for (const mark of layer.querySelectorAll(selector)) {
      mark.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 340,
        delay,
        fill: 'backwards',
      });
    }
  }
}

function stop(label) {
  clearInterval(timer);
  timer = undefined;
  play.textContent = label;
}

function pausePlayback() {
  stop('继续播放');
  for (const animation of layers[active].getAnimations({ subtree: true })) {
    animation.pause();
  }
}

for (const [index, step] of steps.entries()) {
  step.addEventListener('click', () => {
    stop(index === steps.length - 1 ? '重播推导' : '播放推导');
    showStep(index);
  });
}

play.addEventListener('click', () => {
  if (timer !== undefined) {
    pausePlayback();
    return;
  }
  if (active === steps.length - 1) {
    showStep(0);
  } else {
    for (const animation of layers[active].getAnimations({ subtree: true })) {
      animation.play();
    }
  }
  play.textContent = '暂停播放';
  timer = setInterval(() => {
    showStep(active + 1);
    if (active === steps.length - 1) stop('重播推导');
  }, 3600);
});

const hashes = [
  '#transformers-voltage-regulation-phasors',
  '#transformers-voltage-regulation',
];
const tabs = [...document.querySelectorAll('.regulation-tabs [role="tab"]')];
const panels = tabs.map((tab) =>
  document.getElementById(tab.getAttribute('aria-controls')),
);
const courseWindow = window.parent;

function showTab(index) {
  for (const [i, tab] of tabs.entries()) {
    tab.setAttribute('aria-selected', String(i === index));
    tab.tabIndex = i === index ? 0 : -1;
    panels[i].hidden = i !== index;
  }
  if (index === 1 && timer !== undefined) pausePlayback();
}

function selectTab(index) {
  showTab(index);
  if (courseWindow.location.hash !== hashes[index]) {
    courseWindow.location.hash = hashes[index];
  }
}

for (const [index, tab] of tabs.entries()) {
  tab.addEventListener('click', () => selectTab(index));
  tab.addEventListener('keydown', (event) => {
    if (event.key === ' ') {
      event.stopPropagation();
      return;
    }
    const destination = {
      ArrowLeft: 1 - index,
      ArrowRight: 1 - index,
      Home: 0,
      End: 1,
    }[event.key];
    if (destination === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    selectTab(destination);
    tabs[destination].focus();
  });
}

function syncTab() {
  showTab(courseWindow.location.hash === hashes[0] ? 0 : 1);
}

courseWindow.addEventListener('hashchange', syncTab);
window.addEventListener(
  'pagehide',
  () => {
    courseWindow.removeEventListener('hashchange', syncTab);
  },
  { once: true },
);
syncTab();

// Let Space activate a focused step or playback button natively.
document
  .querySelector('.regulation-steps')
  .addEventListener('keydown', (event) => {
    if (event.key === ' ' && event.target instanceof HTMLButtonElement) {
      event.stopPropagation();
    }
  });
