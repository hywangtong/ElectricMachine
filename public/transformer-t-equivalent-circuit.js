const lesson = document.querySelector('.lesson');
const buttons = [...document.querySelectorAll('.stages button')];
const steps = document.querySelectorAll('.step');
const diagrams = document.querySelectorAll('.art');
const heading = document.getElementById('voltage-circuit-heading');
const caption = document.getElementById('diagram-caption');
const count = document.getElementById('step-count');
const next = document.getElementById('next-step');
const replay = document.getElementById('replay');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const labels = [...document.querySelectorAll('[data-referred-label]')].map(
  (label) => [label, label.textContent],
);

const frames = [
  [
    '折算前 · 两侧匝数不同',
    '一次侧 200 匝，实际二次侧 100 匝，匝数比 k = 2。',
    '铜色为一次侧，青绿色为二次侧。',
  ],
  [
    '折算后 · 两侧匝数相同',
    '二次绕组折算为 200 匝，与一次绕组形成 1∶1 耦合。',
    '二次支路的电压、电流和阻抗均改用一次侧基准。',
  ],
  [
    '理想化简 · 对应端子直连',
    '忽略励磁电流和铁耗，理想的 1∶1 耦合可用两条导线等效。',
    '绕组电阻、漏抗和负载仍保留在各自的串联位置。',
  ],
  [
    '',
    '蓝色的 R₀ 和 jX₀ 串联后接在 T 形电路中间。',
    '两侧绕组阻抗和负载仍为原来的折算值。',
  ],
];

let active = 0;
let timer;

function selectFrame(index, autoplay = false) {
  clearTimeout(timer);
  active = index;
  const showT = index === frames.length - 1;
  const [title, firstLine, secondLine] = frames[index];
  lesson.dataset.voltageFrame = String(index);
  if (!showT) heading.textContent = title;
  for (const [label, original] of labels) {
    label.textContent = index === 0 ? original : label.dataset.referredLabel;
  }
  buttons.forEach((button, position) => {
    button.setAttribute('aria-pressed', String(position === index));
    steps[position].hidden = position !== index;
  });
  diagrams[0].toggleAttribute('hidden', showT);
  diagrams[1].toggleAttribute('hidden', !showT);
  caption.children[0].textContent = firstLine;
  caption.children[1].textContent = secondLine;
  count.textContent = `第 ${index + 1} 步 / 共 ${frames.length} 步`;
  next.textContent = showT ? '回到第一步 ↺' : '下一步 →';
  if (autoplay && !reducedMotion.matches && !showT) {
    timer = setTimeout(() => selectFrame(index + 1, true), 4500);
  }
}

function updatePlayback() {
  if (reducedMotion.matches) clearTimeout(timer);
  replay.disabled = reducedMotion.matches;
}

buttons.forEach((button, index) => {
  button.addEventListener('click', () => selectFrame(index));
});
next.addEventListener('click', () => selectFrame((active + 1) % frames.length));
replay.addEventListener('click', () => selectFrame(0, true));
reducedMotion.addEventListener('change', updatePlayback);
updatePlayback();
selectFrame(0, true);
