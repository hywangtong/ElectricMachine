const page = new URLSearchParams(window.location.search).get('page');
const activeView = page === 'solution' ? 'solution' : 'problem';

for (const element of document.querySelectorAll('[data-view]')) {
  element.hidden = element.dataset.view !== activeView;
}

document.title =
  activeView === 'solution'
    ? '例 7-1：额定输入、电流与转矩'
    : '例 7-1：从铭牌找已知量与待求量';
