(() => {
  // [x, y, width, depth]; the four entries keep the reference's numbering.
  const odd = [
    [0, 0, 1, 3],
    [1, 0, 3, 1],
    [3, 1, 1, 3],
    [0, 3, 3, 1],
  ];
  const even = [
    [0, 1, 1, 3],
    [0, 0, 3, 1],
    [3, 0, 1, 3],
    [1, 3, 3, 1],
  ];
  const layerCount = 10;
  const thickness = 5;
  function topSeams(pieces) {
    const joints = [];
    for (const [x, y, w, d] of pieces) {
      for (const [u, v, width, depth] of pieces) {
        const top = Math.max(y, v);
        const bottom = Math.min(y + d, v + depth);
        const left = Math.max(x, u);
        const right = Math.min(x + w, u + width);
        if (x + w === u && top < bottom)
          joints.push([
            [u, top],
            [u, bottom],
          ]);
        if (y + d === v && left < right)
          joints.push([
            [left, v],
            [right, v],
          ]);
      }
    }
    return joints;
  }

  function project(x, y, z) {
    return [350 + (x - y) * 55, 196 + (x + y) * 27.5 - z];
  }

  function solid([x, y, w, d], z) {
    const a = project(x, y, z);
    const b = project(x + w, y, z);
    const c = project(x + w, y + d, z);
    const d1 = project(x, y + d, z);
    const lower = ([px, py]) => [px, py + thickness];
    return [
      `<polygon class="steel-side steel-east" points="${[b, c, lower(c), lower(b)].join(' ')}" />`,
      `<polygon class="steel-side steel-south" points="${[d1, c, lower(c), lower(d1)].join(' ')}" />`,
      `<polygon class="steel-top" points="${[a, b, c, d1].join(' ')}" />`,
    ].join('');
  }

  function seams(pieces, point) {
    return topSeams(pieces)
      .map(
        ([a, b]) =>
          `<path class="steel-seam" d="M${point(...a)} L${point(...b)}" />`,
      )
      .join('');
  }

  function plan(id, pieces) {
    document.getElementById(id).innerHTML =
      pieces
        .map(
          ([x, y, w, d], i) =>
            `<rect class="steel-top" x="${x}" y="${y}" width="${w}" height="${d}" />` +
            `<text x="${x + w / 2}" y="${y + d / 2}">${i + 1}</text>`,
        )
        .join('') + seams(pieces, (x, y) => [x, y]);
  }

  plan('odd-plan', odd);
  plan('even-plan', even);

  document.getElementById('stack-layers').innerHTML = Array.from(
    { length: layerCount },
    (_, i) => {
      const isEven = i % 2 === 1;
      const pieces = isEven ? even : odd;
      // Each layer is painted from the far pieces to the near pieces.
      const order = isEven ? [1, 0, 2, 3] : [0, 1, 3, 2];
      const z = (i + 1) * thickness;
      const faces = order.map((index) => solid(pieces[index], z)).join('');
      const highlight =
        i >= layerCount - 2 ? seams(pieces, (x, y) => project(x, y, z)) : '';
      return `<g class="stack-layer" data-layer="${i + 1}">${faces}${highlight}</g>`;
    },
  ).join('');

  const stack = document.getElementById('lamination-stack');
  const toggle = document.getElementById('stack-toggle');
  const readout = document.getElementById('stack-readout');
  toggle.addEventListener('keydown', (event) => {
    if (event.key === ' ') event.stopPropagation();
  });
  toggle.addEventListener('click', () => {
    const open = stack.classList.toggle('is-exploded');
    toggle.setAttribute('aria-pressed', String(open));
    toggle.textContent = open ? '合上顶部两层' : '展开顶部两层';
    readout.textContent = open
      ? '已展开 · 第 9 层（奇）与第 10 层（偶）'
      : '已叠合 · 10 层';
  });
})();
