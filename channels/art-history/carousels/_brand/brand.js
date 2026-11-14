// Adds chrome (header/footer), grain/vignette and solo-render mode to every slide.
// <body data-no="04" data-title="The Night Watch" data-handle="@art.alive.studio">
(function () {
  const b = document.body;
  const slides = [...document.querySelectorAll('.slide')];
  const no = b.dataset.no || '00', title = b.dataset.title || '', handle = b.dataset.handle || '@art.alive.studio';
  slides.forEach((s, i) => {
    const n = String(i + 1).padStart(2, '0'), tot = String(slides.length).padStart(2, '0');
    if (!s.hasAttribute('data-nochrome')) {
      const c = document.createElement('div'); c.className = 'chrome';
      c.innerHTML = `<span><span class="no">No. ${no}</span><span class="sep"></span>${title}</span><span>${n} / ${tot}</span>`;
      const f = document.createElement('div'); f.className = 'foot';
      f.innerHTML = `<span>${handle}</span><span class="dots">${slides.map((_, j) => `<i class="${j === i ? 'on' : ''}"></i>`).join('')}</span>`;
      s.append(c, f);
    }
    const fx = document.createElement('div'); fx.className = 'fx'; s.append(fx);
  });
  const q = new URLSearchParams(location.search).get('s');
  if (q) { b.dataset.solo = '1'; slides[+q - 1]?.classList.add('is-solo'); }
  document.title = `${slides.length}`;
})();
