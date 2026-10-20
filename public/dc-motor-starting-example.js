const tabs = [...document.querySelectorAll('[data-starting-page]')];
const navigation = window.parent === window ? window : window.parent;
const anchor = 'dc-drives-starting-example-';

function selectPage(page, updateHash = false) {
  if (!tabs.some((tab) => tab.dataset.startingPage === page)) return;
  for (const tab of tabs) {
    const selected = tab.dataset.startingPage === page;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden =
      !selected;
  }
  if (updateHash && navigation.location.hash !== '#' + anchor + page) {
    navigation.location.hash = anchor + page;
  }
}

function syncPage() {
  const page = navigation.location.hash.slice(1).replace(anchor, '');
  selectPage(
    tabs.some((tab) => tab.dataset.startingPage === page) ? page : 'current',
  );
}

for (const tab of tabs) {
  tab.addEventListener('click', () =>
    selectPage(tab.dataset.startingPage, true),
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
    selectPage(tabs[next].dataset.startingPage, true);
  });
}

navigation.addEventListener('hashchange', syncPage);
navigation.addEventListener('popstate', syncPage);
window.addEventListener('pagehide', () => {
  navigation.removeEventListener('hashchange', syncPage);
  navigation.removeEventListener('popstate', syncPage);
});
syncPage();
