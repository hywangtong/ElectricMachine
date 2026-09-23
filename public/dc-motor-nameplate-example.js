const page = document.querySelector('.exercise-page');
const button = document.querySelector('.reveal-button');
const label = button?.querySelector('.button-label');
const solutionId = button?.getAttribute('aria-controls');
const solution = solutionId ? document.getElementById(solutionId) : null;

if (page && button && label && solution) {
  button.addEventListener('click', () => {
    const revealed = button.getAttribute('aria-expanded') !== 'true';

    button.setAttribute('aria-expanded', String(revealed));
    label.textContent = revealed ? '收起计算过程与答案' : '显示计算过程与答案';
    solution.hidden = !revealed;
    page.classList.toggle('is-revealed', revealed);
  });
}
