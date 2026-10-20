import { motor } from './dc-motor-starting-model.mjs';
import {
  resistanceStarting,
  sections,
} from './dc-motor-resistance-starting-model.mjs';

const number = (value, digits = 1) => value.toFixed(digits);
const panels = [];

function circuit(mode) {
  const external =
    mode === 'continuous'
      ? `<g class="external">
        <rect x="150" y="100" width="280" height="24" rx="2" />
        <rect data-part="active-track" x="150" y="100" width="280" height="24" rx="2" />
        <path class="slider-contact" data-part="slider" />
        <text class="external-text" x="290" y="148">滑动变阻器 Rr（接左端与滑动触点）</text>
        <text class="external-text" data-part="resistance" x="290" y="169"></text>
        <text class="external-text" data-part="external-drop" x="290" y="190"></text>
      </g><path class="wire" d="M65 112H150" />`
      : sections
          .map((value, index) => {
            const x = 130 + index * 90;
            return `<g class="external" data-section="${index}">
          <path class="wire" d="M${x - 10} 112V64H${x + 4}M${x + 35} 64H${x + 60}V112M${x - 10} 112H${x}M${x + 50} 112H${x + 60}" />
          <path class="bypass" data-switch="${index}" d="M${x + 4} 64L${x + 35} 45" />
          <rect x="${x}" y="100" width="50" height="24" rx="2" />
          <text x="${x + 25}" y="31">K${index + 1}</text>
          <text class="external-text" x="${x + 25}" y="147">R${index + 1}</text>
          <text class="external-text small" x="${x + 25}" y="165">${number(value, 2)} Ω</text>
          <text class="external-text small" data-drop="${index}" x="${x + 25}" y="184">0.0 V</text>
        </g>`;
          })
          .join('') +
        '<path class="wire" d="M65 112H120M190 112H210M280 112H300M370 112H390M460 112H520" />';
  return `<svg class="circuit" viewBox="0 0 680 300" role="img" aria-labelledby="${mode}-title ${mode}-desc">
    <title id="${mode}-title">${mode === 'continuous' ? '无级' : '有级'}串电阻启动等效电路与实时压降</title>
    <desc id="${mode}-desc">独立励磁保持恒定磁通。电枢电源、主开关、启动电阻、电枢电阻 Ra 和反电势 E 串联；${mode === 'continuous' ? '滑动触点向左移动使接入电阻连续减小。' : 'K1 至 K4 各与一段电阻并联，依次闭合，短接对应电阻。'}紫色表示启动电阻压降，橙色表示电枢电阻压降，绿色表示反电势。</desc>
    <defs><marker id="${mode}-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 10 5 0 10Z" fill="#287f70" /></marker></defs>
    <g class="wire"><path d="M65 178V145M65 222V255H600V227M600 173V112H580" /><circle cx="65" cy="200" r="22" /><circle cx="600" cy="200" r="27" /></g>
    <path class="main-switch" data-part="main-switch" d="M65 145L88 115" />
    ${external}
    <rect class="armature" x="520" y="100" width="60" height="24" rx="2" />
    <text class="armature-text" x="550" y="88">Ra = 1 Ω</text>
    <text class="armature-text small" x="550" y="148">IaRa</text>
    <text class="armature-text" data-part="armature-drop" x="550" y="169">0.0 V</text>
    <path class="current-flow" data-part="flow" />
    <text x="65" y="196">+</text><text x="65" y="214">−</text>
    <text x="65" y="278">Ua = 220 V</text>
    <text x="600" y="195">+</text><text x="600" y="215">−</text>
    <text class="emf-text" data-part="emf" x="600" y="278">E = 0.0 V</text>
    <path d="M638 231V170" stroke="#287f70" stroke-width="2" marker-end="url(#${mode}-arrow)" />
    <path d="M230 215H365" stroke="#287f70" stroke-width="2" marker-end="url(#${mode}-arrow)" />
    <text class="current-text" data-part="current" x="298" y="240">Ia = 0.0 A →</text>
    <text class="small" x="336" y="298">独立励磁：Uf → 励磁绕组 Rf → If 恒定，Φ 恒定</text>
  </svg>`;
}

function write(element, value) {
  if (element.textContent !== value) element.textContent = value;
}

for (const mode of ['continuous', 'stepped']) {
  const root = document.getElementById(mode);
  root.querySelector('.circuit-host').innerHTML = circuit(mode);
  const part = (name) => root.querySelector(`[data-part="${name}"]`);
  const value = (name, text) =>
    write(root.querySelector(`[data-value="${name}"]`), text);
  const play = root.querySelector('[data-action="play"]');
  const progress = root.querySelector('input');
  const state = {
    mode,
    progress: 0,
    powered: false,
    running: false,
    offset: 0,
  };
  function render() {
    const point = resistanceStarting(mode, state.progress, state.powered);
    const { emf, resistance, current, armatureDrop, externalDrop, cutCount } =
      point;
    const finished = state.progress >= 1;
    write(
      play,
      state.running
        ? '暂停观察'
        : finished
          ? '重新演示'
          : state.powered
            ? '继续慢放'
            : '接通并慢放',
    );
    play.setAttribute('aria-pressed', String(state.running));
    progress.value = state.progress;
    value('resistance', `${number(resistance, 2)} Ω`);
    value('current', `${number(current)} A`);
    value('speed', `${number(point.speed, 0)} r/min`);
    write(part('current'), `Ia = ${number(current)} A →`);
    write(part('emf'), `E = ${number(emf)} V`);
    write(part('armature-drop'), `${number(armatureDrop)} V`);
    part('main-switch').setAttribute(
      'd',
      state.powered ? 'M65 145V112' : 'M65 145L88 115',
    );
    let flowPath;
    if (mode === 'continuous') {
      const x =
        150 + (280 * resistance) / (motor.voltage / 30 - motor.resistance);
      part('slider').setAttribute(
        'd',
        `M${x} 100V64H480V112H520M${x - 6} 90L${x} 100L${x + 6} 90`,
      );
      part('active-track').setAttribute('width', Math.max(0, x - 150));
      part('active-track').style.fill = '#d4bce2';
      write(part('resistance'), `接入 Rr = ${number(resistance, 2)} Ω`);
      write(part('external-drop'), `IaRr = ${number(externalDrop)} V`);
      flowPath = `M65 255V112H${x}V64H480V112H600V255Z`;
    } else {
      flowPath = 'M65 255V112H120';
      sections.forEach((_, index) => {
        const closed = index < cutCount;
        const x = 130 + index * 90;
        const bypass = root.querySelector(`[data-switch="${index}"]`);
        bypass.setAttribute(
          'd',
          closed ? `M${x + 4} 64H${x + 35}` : `M${x + 4} 64L${x + 35} 45`,
        );
        bypass.classList.toggle('closed', closed);
        root
          .querySelector(`[data-section="${index}"]`)
          .classList.toggle('cut', closed);
        write(
          root.querySelector(`[data-drop="${index}"]`),
          `${number(point.sectionDrops[index])} V`,
        );
        flowPath += closed ? `V64H${x + 60}V112` : `H${x + 60}`;
        if (index < 3) flowPath += `H${x + 80}`;
      });
      flowPath += 'H600V255Z';
    }
    part('flow').setAttribute('d', flowPath);
    part('flow').style.opacity = state.powered ? '0.8' : '0';
    part('flow').style.strokeDashoffset = -state.offset;
    for (const [name, voltage] of [
      ['emf', emf],
      ['armature', armatureDrop],
      ['external', externalDrop],
      ['open', state.powered ? 0 : motor.voltage],
    ]) {
      root.querySelector(`[data-bar="${name}"]`).style.width =
        `${(100 * voltage) / motor.voltage}%`;
    }
    value(
      'balance',
      state.powered
        ? `220 V = E ${number(emf)} + IaRa ${number(armatureDrop)} + IaRr ${number(externalDrop)} V`
        : '待接通：主开关承担 220 V',
    );
    value(
      'phase',
      !state.powered
        ? mode === 'continuous'
          ? '待接通 · 滑动触点位于最大电阻端'
          : '待接通 · K1～K4 均断开，全部电阻串入'
        : finished
          ? '启动完成 · Rr = 0，E = 205 V，Ia = IN = 15 A'
          : mode === 'continuous'
            ? resistance > 0
              ? '触点逐渐左移 → Rr 连续减小，Ia 保持 2 IN'
              : '启动电阻已减至零 → E 继续增大，Ia 下降'
            : cutCount === 4
              ? 'K1～K4 全闭合 · 电阻全部旁路，Ia 继续下降'
              : `已切除 ${cutCount} / 4 段 · 加速时 Ia 下降，闭合 K${cutCount + 1} 后回升`,
    );
  }
  function start() {
    if (state.progress >= 1) state.progress = 0;
    state.powered = true;
    state.running = true;
    render();
  }
  play.addEventListener('click', () => {
    if (state.running) {
      state.running = false;
      render();
    } else start();
  });
  root.querySelector('[data-action="reset"]').addEventListener('click', () => {
    Object.assign(state, {
      progress: 0,
      powered: false,
      running: false,
      offset: 0,
    });
    render();
  });
  progress.addEventListener('input', () => {
    Object.assign(state, {
      progress: Number(progress.value),
      powered: true,
      running: false,
    });
    render();
  });
  panels.push({ state, render, start });
  render();
}

document.getElementById('play-both').addEventListener('click', () => {
  for (const panel of panels) {
    panel.state.progress = 0;
    panel.state.offset = 0;
    panel.start();
  }
});
let previousTime;
function frame(now) {
  const dt =
    previousTime === undefined
      ? 0
      : Math.min(0.05, (now - previousTime) / 1000);
  previousTime = now;
  for (const { state, render } of panels) {
    if (!state.running || document.hidden) continue;
    state.progress = Math.min(1, state.progress + dt / 20);
    state.offset +=
      dt * resistanceStarting(state.mode, state.progress).current * 2;
    if (state.progress >= 1) state.running = false;
    render();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
