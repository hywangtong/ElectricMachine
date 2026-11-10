const phasePage = document.querySelector('[data-phase]');
const frequencyPage = document.querySelector('[data-frequency]');

function selectButton(buttons, active) {
  for (const button of buttons) {
    button.setAttribute('aria-pressed', String(button === active));
  }
}

if (phasePage) {
  const buttons = phasePage.querySelectorAll('[data-phase-mode]');
  const art = phasePage.querySelector('.phase-art');
  for (const button of buttons) {
    button.addEventListener('click', () => {
      const phase = button.dataset.phaseMode;
      phasePage.dataset.phase = phase;
      selectButton(buttons, button);
      art.setAttribute(
        'aria-label',
        phase === 'three'
          ? '三相变压器，蓝色跨接两根线表示线电压，橙色沿一根线表示线电流'
          : '单相变压器，两侧各两个接线端子，蓝色标电压，橙色标电流',
      );
    });
  }
}

if (frequencyPage) {
  const buttons = frequencyPage.querySelectorAll('[data-hz]');
  const art = frequencyPage.querySelector('.flux-art');
  const field = art.querySelector('.flux-field');
  const forward = art.querySelector('#forward-flux');
  const reverse = art.querySelector('#reverse-flux');
  const cursor = frequencyPage.querySelector('.chart-cursor');
  const point = frequencyPage.querySelector('.chart-point');
  const readout = frequencyPage.querySelector('#flux-readout');
  const pause = frequencyPage.querySelector('.pause-button');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const chartDuration = 0.1;
  const chartX = (time) => 45 + (609 * time) / chartDuration;
  const chartY = (flux) => 48 - 27 * flux;
  const peakFlux = (hz) => 60 / hz;
  const fluxAt = (hz, time) => peakFlux(hz) * Math.sin(2 * Math.PI * hz * time);
  let frequency = 50;
  let time = 1 / (4 * frequency);
  let running = !reducedMotion.matches;
  let visible = false;
  let frame = 0;
  let previousTime = 0;

  for (const hz of [50, 60]) {
    const path = Array.from({ length: 241 }, (_, i) => {
      const t = (i / 240) * chartDuration;
      return `${i === 0 ? 'M' : 'L'}${chartX(t).toFixed(2)} ${chartY(fluxAt(hz, t)).toFixed(2)}`;
    }).join(' ');
    frequencyPage.querySelector(`.trace-${hz}`).setAttribute('d', path);
  }

  function draw() {
    const flux = fluxAt(frequency, time);
    const x = chartX(time);
    cursor.setAttribute('x1', x);
    cursor.setAttribute('x2', x);
    point.setAttribute('cx', x);
    point.setAttribute('cy', chartY(flux));
    field.setAttribute('opacity', (0.82 * Math.abs(flux)).toFixed(3));
    forward.setAttribute('opacity', flux > 0 ? 1 : 0);
    reverse.setAttribute('opacity', flux < 0 ? 1 : 0);
  }

  function tick(now) {
    const dt = previousTime ? Math.min(now - previousTime, 33) : 0;
    previousTime = now;
    time = (time + dt / 80000) % chartDuration;
    draw();
    frame = requestAnimationFrame(tick);
  }

  function sync() {
    pause.textContent = running ? '暂停' : '播放';
    if (running && visible && !document.hidden) {
      if (!frame) frame = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
    }
  }

  for (const button of buttons) {
    button.addEventListener('click', () => {
      frequency = Number(button.dataset.hz);
      frequencyPage.dataset.frequency = button.dataset.hz;
      selectButton(buttons, button);
      readout.textContent = `${(1000 / frequency).toFixed(1)} ms / 周期 · 峰值 ${peakFlux(frequency).toFixed(2)} 倍`;
      if (!running) time = 1 / (4 * frequency);
      draw();
    });
  }

  pause.addEventListener('click', () => {
    running = !running;
    sync();
  });
  reducedMotion.addEventListener('change', (event) => {
    if (event.matches) running = false;
    sync();
  });
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }).observe(frequencyPage);
  document.addEventListener('visibilitychange', sync);
  draw();
  sync();
}
