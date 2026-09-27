const modeCard = document.querySelector('#mode-card');
const modeSwitch = document.querySelector('#mode-switch');

const modes = {
  motor: {
    'mode-name': '电动机 · 机械端口输出',
    'peer-title': '机械负载',
    'peer-action': '被电机带动',
    'port-power-label': '机械功率 P₂：轴端输出 → 负载',
    'shaft-torque-label': 'Tₑ · 同向拖动',
    'property-title': '拖动转矩',
    'relation-equation': 'Tₑ 与 n 同向',
    'property-description': '电机通过轴端向负载施加输出转矩 T₂，带动负载旋转。',
    'property-result': '橙色弧形箭头：电磁转矩 Tₑ 的方向。',
  },
  generator: {
    'mode-name': '发电机 · 机械端口输入',
    'peer-title': '原动机',
    'peer-action': '带动发电机',
    'port-power-label': '机械功率 P₁：原动机 → 轴端输入',
    'shaft-torque-label': 'Tₑ · 反向制动',
    'property-title': '制动转矩',
    'relation-equation': 'Tₑ 与 n 反向',
    'property-description':
      '原动机从轴端施加输入转矩 T₁；电磁转矩 Tₑ 阻碍旋转。',
    'property-result': '橙色弧形箭头：电磁转矩 Tₑ 的方向。',
  },
};

function renderMode(mode) {
  modeCard.dataset.mode = mode;
  modeSwitch.setAttribute('aria-checked', String(mode === 'generator'));
  // Reverse the arc itself so both its arrowhead and flowing dashes reverse.
  document
    .querySelector('#torque-direction')
    .setAttribute(
      'd',
      mode === 'motor' ? 'M0-49A49 49 0 1 1-49 0' : 'M-49 0A49 49 0 1 0 0-49',
    );
  for (const [id, text] of Object.entries(modes[mode])) {
    document.getElementById(id).textContent = text;
  }
  document
    .querySelector('#machine-animation')
    .setAttribute(
      'aria-label',
      mode === 'motor'
        ? '工业电动机外观：轴端输出机械功率，橙色电磁转矩箭头与青绿色转速箭头同向。'
        : '工业发电机外观：原动机从轴端输入机械功率，橙色电磁转矩箭头与青绿色转速箭头反向。',
    );
}

function toggleMode() {
  renderMode(modeCard.dataset.mode === 'motor' ? 'generator' : 'motor');
}

modeSwitch.addEventListener('click', toggleMode);
modeSwitch.addEventListener('keydown', (event) => {
  if (event.key !== ' ' && event.key !== 'Enter') return;
  event.preventDefault();
  event.stopPropagation();
  if (!event.repeat) toggleMode();
});

renderMode('motor');
