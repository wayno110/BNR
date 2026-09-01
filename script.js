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

  const ZOOM = 2.5;
  const LENS_SIZE = 140;

  /* ---------------------------------------------------------------
     Safety check
     --------------------------------------------------------------- */

  if (!mainImg || !wrap || !lens || !result) {
    console.warn('BNR gallery: required zoom elements were not found.');
    return;
  }


  /* ===============================================================
     1. THUMBNAIL + VARIANT SWITCHING
     =============================================================== */

  function setActiveImage(src, sourceEl, group) {

    mainImg.src = src;
    wrap.dataset.zoomSrc = src;

    /* Refresh zoom background */
    result.style.backgroundImage = `url("${src}")`;

    /* Toggle active item */
    group.forEach(el => el.classList.remove('active'));

    if (sourceEl) {
      sourceEl.classList.add('active');
    }

    /* Keep thumbnails and variant buttons synchronized */
    syncSelectors(src);
  }


  function syncSelectors(src) {

    thumbs.forEach(t => {
      t.classList.toggle('active', t.dataset.src === src);
    });

    variants.forEach(v => {
      v.classList.toggle('active', v.dataset.src === src);
    });
  }


  thumbs.forEach(thumb => {

    thumb.addEventListener('click', () => {

      setActiveImage(
        thumb.dataset.src,
        thumb,
        thumbs
      );

    });

  });


  variants.forEach(variant => {

    variant.addEventListener('click', () => {

      setActiveImage(
        variant.dataset.src,
        variant,
        variants
      );

    });

  });


  /* ===============================================================
     2. DESKTOP HOVER MAGNIFIER
     =============================================================== */

  function updateZoomBackground() {

    const rect = mainImg.getBoundingClientRect();

    result.style.backgroundSize =
      `${rect.width * ZOOM}px ${rect.height * ZOOM}px`;

  }


  function showZoom() {

    const src =
      wrap.dataset.zoomSrc ||
      mainImg.currentSrc ||
      mainImg.src;

    result.style.backgroundImage =
      `url("${src}")`;

    result.style.backgroundRepeat = 'no-repeat';

    updateZoomBackground();

    lens.style.display = 'block';
    result.style.display = 'block';

  }


  function hideZoom() {

    lens.style.display = 'none';
    result.style.display = 'none';

  }


  function moveLens(e) {

    const rect = mainImg.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();

    /*
       Cursor position relative to the displayed main image
    */

    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;


    /*
       Position lens around cursor
    */

    let lx = x - LENS_SIZE / 2;
    let ly = y - LENS_SIZE / 2;


    /*
       Keep lens inside displayed image
    */

    const maxX = Math.max(0, rect.width - LENS_SIZE);
    const maxY = Math.max(0, rect.height - LENS_SIZE);

    lx = Math.max(0, Math.min(lx, maxX));
    ly = Math.max(0, Math.min(ly, maxY));


    /*
       mainImg may not start exactly at the same point as the wrapper,
       so account for its actual position.
    */

    const imageOffsetX =
      rect.left - wrapRect.left;

    const imageOffsetY =
      rect.top - wrapRect.top;


    /*
       Move visible gold magnifier lens
    */

    lens.style.left =
      (imageOffsetX + lx) + 'px';

    lens.style.top =
      (imageOffsetY + ly) + 'px';

    lens.style.width =
      LENS_SIZE + 'px';

    lens.style.height =
      LENS_SIZE + 'px';


    /*
       Move magnified background
    */

    const bgX = -lx * ZOOM;
    const bgY = -ly * ZOOM;

    result.style.backgroundPosition =
      `${bgX}px ${bgY}px`;

  }


  /* ===============================================================
     3. DETECT DESKTOP MOUSE / TRACKPAD
     =============================================================== */

  /*
     "any-hover" and "any-pointer" are included because some Windows
     laptops have touchscreens as well as a mouse.

     Checking only "(hover: hover)" can incorrectly disable the
     desktop magnifier on those systems.
  */

  const canHover =
    window.matchMedia(
      '(hover: hover) and (pointer: fine)'
    ).matches ||
    window.matchMedia(
      '(any-hover: hover) and (any-pointer: fine)'
    ).matches;


  if (canHover) {

    wrap.addEventListener(
      'mouseenter',
      showZoom
    );

    wrap.addEventListener(
      'mouseleave',
      hideZoom
    );

    wrap.addEventListener(
      'mousemove',
      moveLens
    );

  } else {


    /* =============================================================
       4. MOBILE / TOUCH LIGHTBOX
       ============================================================= */

    const lightbox =
      document.getElementById('lightbox');

    const lightboxImg =
      document.getElementById('lightboxImg');

    const lightboxClose =
      document.getElementById('lightboxClose');

    const zoomHint =
      document.querySelector('.zoom-hint');


    if (zoomHint) {

      zoomHint.textContent =
        '🤏 Pinch to expand';

    }


    function openLightbox() {

      if (!lightbox || !lightboxImg) {
        return;
      }

      lightboxImg.src =
        wrap.dataset.zoomSrc ||
        mainImg.currentSrc ||
        mainImg.src;

      lightbox.classList.add('active');

    }


    function closeLightbox() {

      if (!lightbox || !lightboxImg) {
        return;
      }

      lightbox.classList.remove('active');

      lightboxImg.src = '';

    }


    wrap.addEventListener(
      'click',
      openLightbox
    );


    if (lightboxClose) {

      lightboxClose.addEventListener(
        'click',
        closeLightbox
      );

    }


    if (lightbox) {

      lightbox.addEventListener(
        'click',
        (e) => {

          if (e.target === lightbox) {
            closeLightbox();
          }

        }
      );

    }

  }


  /* ===============================================================
     5. RECALCULATE ZOOM AFTER IMAGE LOAD
     =============================================================== */

  mainImg.addEventListener('load', () => {

    if (result.style.display === 'block') {
      updateZoomBackground();
    }

  });


  /* ===============================================================
     6. RECALCULATE ZOOM AFTER WINDOW RESIZE
     =============================================================== */

  window.addEventListener('resize', () => {

    if (result.style.display === 'block') {
      updateZoomBackground();
    }

  });

})();
