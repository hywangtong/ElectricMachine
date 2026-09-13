const lesson = document.getElementById('lesson');
const field = document.getElementById('field-strength');
const value = document.getElementById('field-value');
const state = document.getElementById('domain-state');
const diagram = document.getElementById('domain-diagram');
const arrows = document.getElementById('domain-arrows');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const svgNamespace = 'http://www.w3.org/2000/svg';

// Opposite pairs balance at H=0. Fixed orientations make weakening reversible
// and avoid random jumps when the slider changes or the page is reloaded.
const baseAngles = [28, 73, -46, 122, -81, 157, -28, -73];
const domains = baseAngles.flatMap((angle, index) =>
  [angle, angle > 0 ? angle - 180 : angle + 180].map((initialAngle, pair) => {
    const position = index * 2 + pair;
    const x = 52 + (position % 8) * 78;
    const y = 35 + Math.floor(position / 8) * 50;
    const group = document.createElementNS(svgNamespace, 'g');
    group.setAttribute('transform', `translate(${x} ${y})`);
    const arrow = document.createElementNS(svgNamespace, 'path');
    arrow.setAttribute('d', 'M-19 0H19M11-7L19 0L11 7');
    group.append(arrow);
    arrows.append(group);
    return { arrow, initialAngle };
  }),
);

let displayedStrength = Number(field.value) / 100;
let targetStrength = displayedStrength;
let animationFrame = null;
let previousTime = null;

function draw(strength) {
  for (const { arrow, initialAngle } of domains) {
    arrow.setAttribute('transform', `rotate(${initialAngle * (1 - strength)})`);
  }
  arrows.setAttribute(
    'stroke',
    `rgb(${127 - 92 * strength}, ${166 - 41 * strength}, ${157 - 49 * strength})`,
  );
}

function animate(time) {
  const elapsed =
    previousTime === null ? 16 : Math.min(time - previousTime, 64);
  previousTime = time;
  displayedStrength +=
    (targetStrength - displayedStrength) * (1 - Math.exp(-elapsed / 100));
  if (Math.abs(targetStrength - displayedStrength) < 0.001) {
    displayedStrength = targetStrength;
    animationFrame = null;
    previousTime = null;
    draw(displayedStrength);
    return;
  }
  draw(displayedStrength);
  animationFrame = window.requestAnimationFrame(animate);
}

function update() {
  const percent = Number(field.value);
  targetStrength = percent / 100;
  value.textContent = `${percent}% · 相对强度`;
  const description =
    percent === 0
      ? 'H = 0：磁畴方向散乱，整体磁化相互抵消。'
      : percent === 100
        ? 'H 最强：磁畴箭头向右同向排列。'
        : `H = ${percent}%：场越强越趋于同向，场越弱越回到散乱。`;
  state.textContent = description;
  field.setAttribute('aria-valuetext', `${percent}% 相对磁场强度`);
  diagram.setAttribute('aria-label', description);
  if (reducedMotion.matches) {
    if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
    animationFrame = null;
    previousTime = null;
    displayedStrength = targetStrength;
    draw(displayedStrength);
  } else if (animationFrame === null && displayedStrength !== targetStrength) {
    animationFrame = window.requestAnimationFrame(animate);
  }
}

function fit() {
  lesson.style.setProperty(
    '--lesson-scale',
    Math.min(window.innerWidth / 1444, window.innerHeight / 744),
  );
}

field.addEventListener('input', update);
reducedMotion.addEventListener('change', update);
window.addEventListener('resize', fit);
window.addEventListener('pageshow', () => {
  update();
  fit();
});
draw(displayedStrength);
update();
fit();
