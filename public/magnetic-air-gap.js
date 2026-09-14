const $ = (id) => document.getElementById(id);
const gap = $('gap');
const current = $('current');
const mu0 = 4 * Math.PI * 1e-7;
const turns = 300;
const ironEquivalentLength = 0.6 / 2000;
const maxMmf = turns * Number(current.max);
const maxB =
  (mu0 * maxMmf) / (ironEquivalentLength + 2 * Number(gap.min) * 1e-3);

function point(x, y) {
  return `${x.toFixed(3)} ${y.toFixed(3)}`;
}

function drawField(radius, strength) {
  const paths = [];
  const arrows = [];
  const pairs = strength === 0 ? 0 : Math.max(1, Math.round(12 * strength));
  for (let index = 0; index < pairs; index++) {
    for (const sign of [-1, 1]) {
      const angle = ((index + 0.5) / pairs) * 0.62;
      const c = Math.cos(angle);
      const s = Math.sin(angle) * sign;
      const left = point(360 - radius * c, 225 + radius * s);
      const right = point(360 + radius * c, 225 + radius * s);
      const poleLeft = point(360 - 120 * c, 225 + 120 * s);
      const poleRight = point(360 + 120 * c, 225 + 120 * s);
      // Upper/lower returns stay in the stator yoke and join both poles.
      const yokeRadius = 207 - (angle / 0.62) * 46;
      const cornerX = yokeRadius * Math.cos(0.72);
      const cornerY = yokeRadius * Math.sin(0.72) * sign;
      const yokeRight = point(360 + cornerX, 225 + cornerY);
      const yokeLeft = point(360 - cornerX, 225 + cornerY);
      paths.push(
        `<path d="M${poleLeft} L${left} C${point(360 - (radius - 48) * c, 225 + (radius - 48) * s)} ${point(360 + (radius - 48) * c, 225 + (radius - 48) * s)} ${right} L${poleRight} C${point(360 + 143 * c, 225 + 143 * s)} ${point(360 + cornerX + 20, 225 + cornerY - sign * 22)} ${yokeRight} A${yokeRadius} ${yokeRadius} 0 0 ${sign < 0 ? 0 : 1} ${yokeLeft} C${point(360 - cornerX - 20, 225 + cornerY - sign * 22)} ${point(360 - 143 * c, 225 + 143 * s)} ${poleLeft} Z" />`,
      );
    }
  }
  // Arrow length uses one fixed B scale, independently of line count.
  for (const angle of [-0.5, 0, 0.5]) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const length = 64 * strength * c;
    if (length === 0) continue;
    for (const side of [-1, 1]) {
      const x = 360 + side * (radius + 120) * 0.5 * c;
      const y = 225 + (radius + 120) * 0.5 * s;
      const dx = c * length * 0.5;
      const dy = side * s * length * 0.5;
      arrows.push(
        `<path d="M${point(x - dx, y - dy)} L${point(x + dx, y + dy)}" />`,
      );
    }
  }
  if (strength > 0) {
    for (const sign of [-1, 1]) {
      const y = 225 + sign * 185;
      arrows.push(
        `<path d="M${point(360 + 34 * strength, y)} L${point(360 - 34 * strength, y)}" />`,
      );
    }
    arrows.push(
      `<path d="M${point(360 - 40 * strength, 225)} L${point(360 + 40 * strength, 225)}" />`,
    );
  }
  $('field-lines').innerHTML = paths.join('');
  $('field-arrows').innerHTML = arrows.join('');
}

function render() {
  const deltaMm = Number(gap.value);
  const i = Number(current.value);
  const gapLength = 2 * deltaMm * 1e-3;
  const equivalentLength = ironEquivalentLength + gapLength;
  const mmf = turns * i;
  const b = (mu0 * mmf) / equivalentLength;
  const ironShare = ironEquivalentLength / equivalentLength;
  const gapShare = gapLength / equivalentLength;
  const ironDrop = mmf * ironShare;
  const gapDrop = mmf * gapShare;
  const radius = 120 - (8 + ((deltaMm - 0.2) / 1.3) * 22);
  $('rotor').setAttribute('r', radius);
  drawField(radius, b / maxB);
  $('windings').style.opacity = i === 0 ? '0' : '1';
  for (const id of ['gap-value', 'gap-label']) {
    $(id).textContent =
      `${id === 'gap-label' ? 'δ = ' : ''}${deltaMm.toFixed(2)} mm`;
  }
  $('current-value').textContent = `${i.toFixed(2)} A`;
  gap.setAttribute('aria-valuetext', `${deltaMm.toFixed(2)} 毫米`);
  current.setAttribute('aria-valuetext', `${i.toFixed(2)} 安培`);
  $('b-value').innerHTML = `B<sub>g</sub> = ${b.toFixed(3)} T`;
  $('total-value').textContent = `F = NI = ${mmf.toFixed(1)} A·匝`;
  $('iron-drop').textContent = `${ironDrop.toFixed(1)} A·匝`;
  $('gap-drop').textContent = `${gapDrop.toFixed(1)} A·匝`;
  $('iron-bar').style.width = `${(100 * ironDrop) / maxMmf}%`;
  $('gap-bar').style.width = `${(100 * gapDrop) / maxMmf}%`;
  $('drop-shares').textContent =
    i === 0
      ? '无励磁：两段磁通势降均为 0，占比不定义。'
      : `铁芯 ${(ironShare * 100).toFixed(1)}% · 两侧气隙 ${(gapShare * 100).toFixed(1)}%`;
  $('field-caption').textContent =
    i === 0
      ? 'I = 0 → B = 0：磁感线与磁场箭头消失'
      : '箭头越长、磁感线越密 → B 越强；箭头表示磁场方向';
  const c = Math.cos(0.4);
  const s = -Math.sin(0.4);
  const startX = 360 + radius * c;
  const startY = 225 + radius * s;
  const endX = 360 + 120 * c;
  const endY = 225 + 120 * s;
  $('gap-dimension').setAttribute(
    'd',
    `M${point(startX, startY)} L${point(endX, endY)} M${point(startX - 4 * s, startY + 4 * c)} l${point(8 * s, -8 * c)} M${point(endX - 4 * s, endY + 4 * c)} l${point(8 * s, -8 * c)}`,
  );
  $('gap-callout').setAttribute(
    'd',
    `M${point((startX + endX) / 2, (startY + endY) / 2)} L580 150H700`,
  );
  $('motor-diagram').setAttribute(
    'aria-label',
    `一对极电机，每侧气隙 ${deltaMm.toFixed(2)} 毫米，励磁电流 ${i.toFixed(2)} 安培，气隙磁感应强度 ${b.toFixed(3)} 特斯拉。${i === 0 ? '无励磁、无磁场。' : '磁通从左 N 极穿过两侧气隙和转子到达右 S 极，经上下定子铁芯返回。'}`,
  );
}

function fit() {
  $('lesson').style.setProperty(
    '--lesson-scale',
    Math.min(window.innerWidth / 1444, window.innerHeight / 744),
  );
}

gap.addEventListener('input', render);
current.addEventListener('input', render);
$('reset').addEventListener('click', () => {
  gap.value = '0.5';
  current.value = '1';
  render();
});
window.addEventListener('resize', fit);
window.addEventListener('pageshow', () => {
  window.requestAnimationFrame(() => {
    render();
    fit();
  });
});
fit();
render();
