(() => {
  const toggle = document.querySelector('#branch-toggle');
  const value = document.querySelector('#branch-value');
  const supplyTitle = document.querySelector('#supply-title');
  const branchCurrent = document.querySelector('#branch-current');
  const branchTwoElements = document.querySelectorAll('.branch-two');

  if (!toggle || !value || !supplyTitle || !branchCurrent) return;

  const setBranchCount = (count) => {
    const isTwo = count === 2;

    toggle.setAttribute('aria-checked', String(isTwo));
    toggle.setAttribute(
      'aria-label',
      `当前并联支路数为 ${count}，点击切换为 ${isTwo ? 1 : 2}`,
    );
    value.textContent = String(count);
    supplyTitle.textContent = isTwo
      ? '外接电源供电 · 两导体出端并联'
      : '外接电源供电 · 1 支路';
    branchCurrent.textContent = isTwo ? '每支路电流：I / 2' : '每支路电流：I';
    branchTwoElements.forEach((element) => {
      element.toggleAttribute('hidden', !isTwo);
    });
  };

  const initialCount =
    new URLSearchParams(window.location.search).get('branches') === '2' ? 2 : 1;
  setBranchCount(initialCount);

  toggle.addEventListener('click', () => {
    setBranchCount(toggle.getAttribute('aria-checked') === 'true' ? 1 : 2);
  });
})();
