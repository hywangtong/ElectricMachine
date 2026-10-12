import { armatureReactionParameters } from './dc-armature-reaction-model.js';
import {
  magnetization,
  saturationParameters,
} from './dc-armature-saturation-model.js';

const gainColour = '#4c9980';
const lossColour = '#b96b8e';
const text = (x, y, copy, extra = '') =>
  `<text x="${x}" y="${y}" ${extra.includes('fill=') ? '' : 'fill="#496961"'} ${extra.includes('font-size=') ? '' : 'font-size="13"'} ${extra}>${copy}</text>`;

export function renderSaturationDiagram(state) {
  const { fieldMmf } = saturationParameters;
  const x = (mmf) => 498 + (mmf / 2.2) * 292;
  const y = (b) => 251 - (b / 1.9) * 170;
  const points = [
    fieldMmf - state.armatureMmf,
    fieldMmf,
    fieldMmf + state.armatureMmf,
  ];
  let svg = text(
    492,
    39,
    state.nonlinear ? '非线性磁化：增磁侧趋于饱和' : '线性对照：两侧变化量相等',
    'font-weight="800" font-size="16"',
  );
  svg += text(
    492,
    62,
    state.nonlinear
      ? '同样大小的 ±Fₐ，得到不同大小的 ΔB'
      : '同样大小的 ±Fₐ，得到相等大小的 ΔB',
  );
  svg += `<path d="M498 81V251H800" fill="none" stroke="#9badb6"/>`;
  const curve = Array.from({ length: 101 }, (_, index) => {
    const mmf = (2.2 * index) / 100;
    return `${index ? 'L' : 'M'}${x(mmf)} ${y(magnetization(mmf, state.nonlinear))}`;
  }).join(' ');
  svg += `<path d="${curve}" fill="none" stroke="#2d72c4" stroke-width="3"/>`;
  svg += `<path d="M498 ${y(1)}H790" stroke="#9badb6" stroke-dasharray="5 5"/>`;
  for (const [index, mmf] of points.entries()) {
    const b = magnetization(mmf, state.nonlinear);
    const colour =
      index === 0 ? lossColour : index === 2 ? gainColour : '#2d72c4';
    svg += `<path d="M${x(mmf)} 251V${y(b)}H498" fill="none" stroke="${colour}" stroke-dasharray="3 4"/><circle cx="${x(mmf)}" cy="${y(b)}" r="5" fill="${colour}"/>`;
    // Hide overlapping endpoint labels at zero current.
    if (state.current > 15 || index === 1)
      svg += text(
        x(mmf),
        270 + (index === 1 ? 15 : 0),
        ['Ff − Fa', 'Ff', 'Ff + Fa'][index],
        'text-anchor="middle"',
      );
  }
  svg += text(481, 94, 'B', 'font-weight="800"');
  svg += text(800, 251, 'F', 'font-weight="800"');
  svg += text(
    493,
    305,
    'N 极下磁密分布 · 面积决定每极磁通',
    'font-weight="800"',
  );
  const plotX = (position) => 646 - position * 146;
  const plotY = (b) => 361 - (b - 1) * 55;
  svg += `<rect x="500" y="317" width="292" height="89" rx="5" fill="#f4f8f6"/>`;
  for (const gain of [true, false]) {
    const strips = state.strips.filter((strip) =>
      gain ? strip.position >= 0 : strip.position < 0,
    );
    const outline = strips
      .map((strip) => `L${plotX(strip.position)} ${plotY(strip.b)}`)
      .join(' ');
    svg += `<path d="M${plotX(strips[0].position)} ${plotY(1)}${outline}L${plotX(strips.at(-1).position)} ${plotY(1)}Z" fill="${gain ? gainColour : lossColour}" opacity="0.35"/>`;
  }
  const distribution = state.strips
    .map(
      (strip, index) =>
        `${index ? 'L' : 'M'}${plotX(strip.position)} ${plotY(strip.b)}`,
    )
    .join(' ');
  svg += `<path d="M500 ${plotY(1)}H792" stroke="#9badb6" stroke-dasharray="5 4"/><path d="${distribution}" fill="none" stroke="#2d72c4" stroke-width="2.5"/>`;
  svg += text(501, 332, '增磁区', `fill="${gainColour}"`);
  svg += text(737, 393, '去磁区', `fill="${lossColour}"`);
  svg += text(
    646,
    425,
    `增加 ${(state.gain * 100).toFixed(1)}% − 减少 ${(state.loss * 100).toFixed(1)}%`,
    'text-anchor="middle" font-weight="700"',
  );
  svg += text(
    646,
    449,
    `Φ / Φ₀ = ${(state.fluxRatio * 100).toFixed(1)}%`,
    'text-anchor="middle" font-weight="800" font-size="17"',
  );
  // In this N-top / S-bottom cross section the armature return field aids
  // the main field at top-left and bottom-right, and opposes it elsewhere.
  for (const [px, py, gain] of [
    [76, 111, true],
    [334, 111, false],
    [76, 355, false],
    [334, 355, true],
  ]) {
    svg += `<rect x="${px - 37}" y="${py - 17}" width="74" height="24" rx="12" fill="${gain ? '#e8f4ed' : '#f8eaf1'}"/>`;
    svg += text(
      px,
      py,
      gain ? '叠加 · 增磁' : '抵消 · 去磁',
      `text-anchor="middle" fill="${gain ? gainColour : lossColour}" font-weight="700" font-size="12"`,
    );
  }
  return svg;
}

export function renderSaturationScope(simulation) {
  const state = simulation.state;
  const left = 42,
    right = 497,
    top = 12,
    bottom = 151;
  const duration = armatureReactionParameters.windowSeconds;
  const start = Math.max(0, simulation.elapsed - duration);
  const x = (t) => left + ((t - start) / duration) * (right - left);
  const y = (emf) => (top + bottom) / 2 - (emf / 75) * ((bottom - top) / 2);
  let svg = `<defs><clipPath id="scope-clip"><rect x="${left}" y="${top}" width="${right - left}" height="${bottom - top}"/></clipPath></defs><rect x="${left}" y="${top}" width="${right - left}" height="${bottom - top}" rx="5" fill="#f4f8f6"/>`;
  for (const value of [-60, -30, 0, 30, 60]) {
    svg += `<path d="M${left} ${y(value)}H${right}" stroke="${Math.abs(value) === 60 ? '#8da29a' : '#dce7e2'}" stroke-dasharray="4 4"/>`;
    svg += text(5, y(value) + 4, value, 'font-size="10"');
  }
  for (let index = 0; index <= 4; index++) {
    const time = start + (duration * index) / 4;
    svg += `<path d="M${x(time)} ${top}V${bottom}" stroke="#dce7e2"/>`;
    svg += text(x(time) - 9, 170, time.toFixed(1), 'font-size="10"');
  }
  const trace = simulation.samples
    .map(
      (sample, index) => `${index ? 'L' : 'M'}${x(sample.t)} ${y(sample.emf)}`,
    )
    .join(' ');
  svg += `<g clip-path="url(#scope-clip)"><path d="${trace}" fill="none" stroke="#2d72c4" stroke-width="2.5"/></g><circle cx="${x(simulation.elapsed)}" cy="${y(state.emf)}" r="4" fill="#2d72c4"/>`;
  svg += text(499, 170, 's', 'font-size="10"');
  const scope = document.getElementById('scope');
  scope.innerHTML = svg;
  scope.setAttribute(
    'aria-label',
    `反电势基波，当前峰值 ${state.emfPeak.toFixed(1)} 伏，零电枢电流时峰值 60 伏`,
  );
}

export function renderSaturationReadings(simulation) {
  const state = simulation.state;
  const $ = (id) => document.getElementById(id);
  $('current-reading').textContent = `${state.current} A`;
  $('flux-reading').textContent = `${(state.fluxRatio * 100).toFixed(1)}%`;
  $('peak-reading').textContent = `${state.emfPeak.toFixed(1)} V`;
  $('flux-loss-reading').textContent =
    `${((1 - state.fluxRatio) * 100).toFixed(1)}%`;
  $('emf-reading').textContent =
    `${state.emf >= 0 ? '+' : '−'}${Math.abs(state.emf).toFixed(1)} V`;
  $('scope-clock').textContent =
    `最近 12 s · t = ${simulation.elapsed.toFixed(1)} s`;
  $('pause').textContent = simulation.paused ? '继续动画 P' : '暂停动画 P';
  $('pause').setAttribute('aria-pressed', String(simulation.paused));
  $('armature-current').disabled = simulation.paused;
  $('linear-comparison').disabled = simulation.paused;
  $('pause-note').textContent = simulation.paused
    ? '快照保持：转子、磁场、读数与波形均已冻结。'
    : '按 P 暂停，冻结转子、读数和波形；转速始终为 5 r/min。';
  $('pause-note').classList.toggle('paused', simulation.paused);
  $('explanation').innerHTML = state.nonlinear
    ? '一侧磁势叠加，另一侧磁势抵消。铁芯趋于饱和，<b>增磁量小于去磁量</b>，整个极面的磁通净减少。'
    : '假设铁芯线性：两侧磁势变化相等，增磁与去磁恰好抵消，<b>每极磁通及反电势幅值保持不变</b>。';
  document.querySelector('.causal-chain').textContent = state.nonlinear
    ? 'Iₐ ↑ → 电枢反应 ↑ → Φ ↓ → E ↓'
    : '线性对照：Iₐ ↑ → 磁场畸变，Φ 与 E 不变';
}
