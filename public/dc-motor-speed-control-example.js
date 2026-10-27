const tabs = [...document.querySelectorAll('[data-speed-page]')];
const navigation = window.parent;
const anchor = 'dc-drives-speed-control-example';
const hashes = {
  parameters: anchor,
  load: anchor + '-load',
  resistance: anchor + '-resistance',
};

function selectPage(page, updateHash = false) {
  if (!Object.hasOwn(hashes, page)) return;
  for (const tab of tabs) {
    const selected = tab.dataset.speedPage === page;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden =
      !selected;
  }
  if (updateHash && navigation.location.hash !== '#' + hashes[page]) {
    navigation.location.hash = hashes[page];
  }
}

function syncPage() {
  const page = Object.keys(hashes).find(
    (key) => navigation.location.hash === '#' + hashes[key],
  );
  selectPage(page ?? 'parameters');
}

for (const tab of tabs) {
  tab.addEventListener('click', () => selectPage(tab.dataset.speedPage, true));
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    const index = tabs.indexOf(tab);
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? tabs.length - 1
          : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) %
            tabs.length;
    tabs[next].focus();
    selectPage(tabs[next].dataset.speedPage, true);
  });
}

navigation.addEventListener('hashchange', syncPage);
navigation.addEventListener('popstate', syncPage);
window.addEventListener('pagehide', () => {
  navigation.removeEventListener('hashchange', syncPage);
  navigation.removeEventListener('popstate', syncPage);
});
syncPage();
