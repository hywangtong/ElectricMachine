const tabs = [...document.querySelectorAll('[data-example-page]')];
const navigation = window.parent;
const anchor = 'dc-drives-natural-characteristic-example';
const hashes = { natural: anchor, hardness: anchor + '-hardness' };

function selectPage(page, updateHash = false) {
  if (!(page in hashes)) return;
  for (const tab of tabs) {
    const selected = tab.dataset.examplePage === page;
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
  selectPage(
    navigation.location.hash === '#' + hashes.hardness ? 'hardness' : 'natural',
  );
}

for (const tab of tabs) {
  tab.addEventListener('click', () =>
    selectPage(tab.dataset.examplePage, true),
  );
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
    selectPage(tabs[next].dataset.examplePage, true);
  });
}

navigation.addEventListener('hashchange', syncPage);
navigation.addEventListener('popstate', syncPage);
window.addEventListener('pagehide', () => {
  navigation.removeEventListener('hashchange', syncPage);
  navigation.removeEventListener('popstate', syncPage);
});
syncPage();
