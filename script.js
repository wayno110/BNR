/* ====================================================================
   BNR Origin Series — product page interactions
   - Thumbnail switching
   - Variant picker switching
   - Hover-to-magnify (inner lens + side-panel zoomed view)
   ==================================================================== */

(function () {
  const mainImg   = document.getElementById('mainImage');
  const wrap      = document.getElementById('zoomTarget');
  const lens      = document.getElementById('zoomLens');
  const result    = document.getElementById('zoomResult');
  const thumbs    = document.querySelectorAll('.thumb');
  const variants  = document.querySelectorAll('.variant');

  const ZOOM = 2.5;                 // magnification factor
  const LENS_SIZE = 140;            // px, matches CSS

  /* ---------- 1. Thumbnail + variant click handling ---------- */
  function setActiveImage(src, sourceEl, group) {
    mainImg.src = src;
    wrap.dataset.zoomSrc = src;
    // refresh background on result panel if currently shown
    result.style.backgroundImage = `url("${src}")`;
    // toggle active class
    group.forEach(el => el.classList.remove('active'));
    sourceEl.classList.add('active');
    // also sync the matching variant button & matching thumbnail
    syncSelectors(src);
  }

  function syncSelectors(src) {
    thumbs.forEach(t => t.classList.toggle('active', t.dataset.src === src));
    variants.forEach(v => v.classList.toggle('active', v.dataset.src === src));
  }

  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      setActiveImage(thumb.dataset.src, thumb, thumbs);
    });
  });

  variants.forEach(variant => {
    variant.addEventListener('click', () => {
      setActiveImage(variant.dataset.src, variant, variants);
    });
  });

  /* ---------- 2. Hover-to-magnify ----------
     Strategy: when cursor is over the main image, we
       (a) show a square "lens" overlay that follows the cursor
       (b) show a result panel (positioned to the right) whose background
           image is the full-resolution product photo, scaled up by ZOOM,
           and shifted to mirror the cursor position.
     This gives an Amazon-style "magnify on hover" experience.
  ----------------------------------------------------------- */

  function showZoom() {
    const src = wrap.dataset.zoomSrc;
    result.style.backgroundImage = `url("${src}")`;

    // size the background image inside result panel: ZOOM × the displayed image size
    const rect = wrap.getBoundingClientRect();
    result.style.backgroundSize = `${rect.width * ZOOM}px ${rect.height * ZOOM}px`;

    lens.style.display   = 'block';
    result.style.display = 'block';
  }

  function hideZoom() {
    lens.style.display   = 'none';
    result.style.display = 'none';
  }

  function moveLens(e) {
    const rect = wrap.getBoundingClientRect();
    // cursor position relative to the image
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    // top-left corner of lens
    let lx = x - LENS_SIZE / 2;
    let ly = y - LENS_SIZE / 2;

    // clamp lens inside the image
    lx = Math.max(0, Math.min(lx, rect.width  - LENS_SIZE));
    ly = Math.max(0, Math.min(ly, rect.height - LENS_SIZE));

    lens.style.left = lx + 'px';
    lens.style.top  = ly + 'px';
    lens.style.width  = LENS_SIZE + 'px';
    lens.style.height = LENS_SIZE + 'px';

    // shift the background of the result panel to match
    // we want the area under the lens to be shown, scaled by ZOOM.
    const bgX = -lx * ZOOM;
    const bgY = -ly * ZOOM;
    result.style.backgroundPosition = `${bgX}px ${bgY}px`;
  }

  // Only enable hover-magnifier on devices that actually have a hover (not touch)
  const canHover = window.matchMedia('(hover: hover)').matches;
  if (canHover) {
    wrap.addEventListener('mouseenter', showZoom);
    wrap.addEventListener('mouseleave', hideZoom);
    wrap.addEventListener('mousemove', moveLens);
  } else {
    // On touch devices: tapping the main image cycles to the next image.
    wrap.addEventListener('click', () => {
      const list = Array.from(thumbs);
      const currentSrc = wrap.dataset.zoomSrc;
      const i = list.findIndex(t => t.dataset.src === currentSrc);
      const next = list[(i + 1) % list.length];
      setActiveImage(next.dataset.src, next, thumbs);
    });
  }

  /* ---------- 3. Re-position the result panel on resize ---------- */
  window.addEventListener('resize', () => {
    if (result.style.display === 'block') {
      const rect = wrap.getBoundingClientRect();
      result.style.backgroundSize = `${rect.width * ZOOM}px ${rect.height * ZOOM}px`;
    }
  });
})();
