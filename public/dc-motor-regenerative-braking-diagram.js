const colors = {
  current: '#bc742a',
  speed: '#39796f',
  torque: '#ac4c54',
  load: '#7d89ae',
};

export function circuitDiagram(id) {
  return `<svg viewBox="0 0 440 292" role="img" aria-label="他励直流电机电路：电源、电枢电阻、串联电阻与独立励磁；箭头表示实际方向">
    <defs>${Object.entries(colors)
      .map(
        ([key, color]) =>
          `<marker id="${id}-${key}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 10 5 0 10Z" fill="${color}"/></marker>`,
      )
      .join('')}</defs>
    <path d="M60 119V52H142M176 52H234V119M234 191V246H60V181" class="wire"/>
    <path data-flow d="M60 119V52H234V246H60V181" class="current-flow"/>
    <rect x="142" y="43" width="34" height="18" fill="white" stroke="#47635f" stroke-width="2.5"/><text x="143" y="30" class="math">Rₐ</text>
    <circle cx="60" cy="150" r="31" fill="#eff3f8" stroke="#47635f" stroke-width="3"/>
    <text data-source-top x="53" y="143">+</text><text data-source-bottom x="54" y="170">−</text><text x="6" y="157" class="math">Uₐ</text>
    <g data-resistor><rect x="137" y="236" width="49" height="20" fill="#fcf3e5" stroke="#bc742a" stroke-width="3"/><text x="144" y="282" class="math">Rb</text></g>
    <circle cx="234" cy="155" r="36" fill="#f5f8f3" stroke="#47635f" stroke-width="3"/>
    <g data-rotor stroke="#39796f" stroke-width="3"><circle cx="234" cy="155" r="28" fill="none"/><path d="M234 127V183M206 155H262"/><circle cx="234" cy="127" r="5" fill="#bc742a" stroke="#fff" stroke-width="1.5"/></g>
    <circle cx="234" cy="155" r="17" fill="#fff"/><text x="221" y="165">M</text>
    <text data-emf-top x="184" y="146" class="motor-color">+</text><text data-emf-bottom x="184" y="180" class="motor-color">−</text><text x="155" y="163" class="math motor-color">E</text>
    <path data-current d="M102 77H165" stroke="#bc742a" stroke-width="3" marker-end="url(#${id}-current)"/><text x="112" y="103" class="math" style="fill:#bc742a">Iₐ</text>
    <path data-speed d="M279 200A65 65 0 0 1 194 207" fill="none" stroke="#39796f" stroke-width="3"/><text x="276" y="228" class="math brake-color">n</text>
    <path data-torque d="M194 106A65 65 0 0 1 280 112" fill="none" stroke="#ac4c54" stroke-width="3"/><text x="281" y="100" class="math motor-color">T</text>
    <path data-load d="M292 96A83 83 0 0 0 177 95" fill="none" stroke="#7d89ae" stroke-width="3"/><text x="280" y="68" class="math" style="fill:#7d89ae">T<tspan baseline-shift="sub" font-size="16">L</tspan></text>
    <path d="M401 52H340V97q-22 0 0 19q-22 0 0 19q-22 0 0 19q-22 0 0 19q-22 0 0 19V246H401" class="wire"/>
    <circle cx="401" cy="52" r="4" fill="white" stroke="#47635f" stroke-width="2"/><circle cx="401" cy="246" r="4" fill="white" stroke="#47635f" stroke-width="2"/>
    <text x="389" y="82">+</text><text x="389" y="234">−</text><text x="369" y="158" class="math brake-color">U<tspan baseline-shift="sub" font-size="16">f</tspan></text>
    <text x="291" y="278" class="small" style="font-size:14px">独立励磁 · 极性不变</text>
  </svg>`;
}

export function updateCircuit(
  root,
  id,
  state,
  { rb = 0, load = 40, angle = 0, offset = 0 } = {},
) {
  const el = (key) => root.querySelector(`[data-${key}]`);
  el('source-top').textContent = state.voltage < 0 ? '−' : '+';
  el('source-bottom').textContent = state.voltage < 0 ? '+' : '−';
  el('emf-top').textContent = state.emf < 0 ? '−' : '+';
  el('emf-bottom').textContent = state.emf < 0 ? '+' : '−';
  el('resistor').setAttribute('opacity', rb > 0 ? 1 : 0);
  el('current').setAttribute(
    'd',
    state.current < 0 ? 'M165 77H102' : 'M102 77H165',
  );
  el('current').setAttribute('opacity', Math.abs(state.current) < 0.05 ? 0 : 1);
  el('flow').setAttribute('opacity', Math.min(1, Math.abs(state.current) / 15));
  el('flow').style.strokeDashoffset = offset;
  el('rotor').setAttribute('transform', `rotate(${angle} 234 155)`);
  for (const [key, value] of [
    ['speed', state.speed],
    ['torque', state.torque],
    ['load', load],
  ]) {
    // Load's path is opposite to n/T; TL is the resisting term in JΩ̇ = T − TL.
    el(key).setAttribute(
      'marker-end',
      value > 0.05 ? `url(#${id}-${key})` : 'none',
    );
    el(key).setAttribute(
      'marker-start',
      value < -0.05 ? `url(#${id}-${key})` : 'none',
    );
    el(key).setAttribute('opacity', Math.abs(value) < 0.05 ? 0 : 1);
  }
}
