/* ====================================================================
   BNR Origin Series — Gallery & Magnifier
   Rebuilt version

   Features:
   - Thumbnail switching
   - Variant switching
   - Desktop hover magnifier
   - Correct handling of portrait + landscape images
   - Correct handling of object-fit: contain
   - Touch/mobile lightbox
   - Hybrid touchscreen + mouse support
   ==================================================================== */

(function () {

  /* ===============================================================
     ELEMENTS
     =============================================================== */

  const mainImg = document.getElementById('mainImage');
  const wrap = document.getElementById('zoomTarget');
  const lens = document.getElementById('zoomLens');
  const result = document.getElementById('zoomResult');

  const thumbs = document.querySelectorAll('.thumb');
  const variants = document.querySelectorAll('.variant');

  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');

  const zoomHint = document.querySelector('.zoom-hint');


  /* ===============================================================
     SETTINGS
     =============================================================== */

  const LENS_SIZE = 140;
  const ZOOM = 2.5;


  /* ===============================================================
     SAFETY CHECK
     =============================================================== */

  if (!mainImg || !wrap || !lens || !result) {

    console.warn(
      'BNR Gallery: required magnifier elements could not be found.'
    );

    return;
  }


  /* ===============================================================
     IMAGE SWITCHING
     =============================================================== */

  function setActiveImage(src) {

    if (!src) {
      return;
    }

    /*
       Hide magnifier while changing images.
    */

    hideZoom();


    /*
       Change main image.
    */

    mainImg.src = src;


    /*
       Store current image for magnifier/lightbox.
    */

    wrap.dataset.zoomSrc = src;


    /*
       Update magnifier background.
    */

    result.style.backgroundImage =
      `url("${src}")`;


    /*
       Synchronise thumbnail states.
    */

    thumbs.forEach(function (thumb) {

      thumb.classList.toggle(
        'active',
        thumb.dataset.src === src
      );

    });


    /*
       Synchronise variant states.
    */

    variants.forEach(function (variant) {

      variant.classList.toggle(
        'active',
        variant.dataset.src === src
      );

    });

  }


  /* ===============================================================
     THUMBNAIL EVENTS
     =============================================================== */

  thumbs.forEach(function (thumb) {

    thumb.addEventListener('click', function () {

      setActiveImage(
        thumb.dataset.src
      );

    });

  });


  /* ===============================================================
     VARIANT EVENTS
     =============================================================== */

  variants.forEach(function (variant) {

    variant.addEventListener('click', function () {

      setActiveImage(
        variant.dataset.src
      );

    });

  });


  /* ===============================================================
     CALCULATE ACTUAL VISIBLE IMAGE RECTANGLE

     The gallery container is always 4:3.

     Some product images are portrait.
     Some are landscape.

     Because CSS uses object-fit: contain, the actual visible image
     may not fill the complete gallery container.

     This function calculates the real displayed image dimensions
     and the empty space around it.
     =============================================================== */

  function getRenderedImageRect() {

    const box = wrap.getBoundingClientRect();

    const naturalWidth = mainImg.naturalWidth;
    const naturalHeight = mainImg.naturalHeight;


    /*
       If image dimensions are not available yet,
       fall back to the complete gallery box.
    */

    if (!naturalWidth || !naturalHeight) {

      return {

        box: box,

        left: 0,
        top: 0,

        width: box.width,
        height: box.height

      };

    }


    const imageRatio =
      naturalWidth / naturalHeight;

    const boxRatio =
      box.width / box.height;


    let renderedWidth;
    let renderedHeight;

    let offsetX;
    let offsetY;


    /*
       Image is proportionally wider than container.

       Width fills container.
       Empty space appears above/below.
    */

    if (imageRatio > boxRatio) {

      renderedWidth = box.width;

      renderedHeight =
        renderedWidth / imageRatio;

      offsetX = 0;

      offsetY =
        (box.height - renderedHeight) / 2;

    }


    /*
       Image is proportionally taller than container.

       Height fills container.
       Empty space appears left/right.
    */

    else {

      renderedHeight = box.height;

      renderedWidth =
        renderedHeight * imageRatio;

      offsetY = 0;

      offsetX =
        (box.width - renderedWidth) / 2;

    }


    return {

      box: box,

      left: offsetX,
      top: offsetY,

      width: renderedWidth,
      height: renderedHeight

    };

  }


  /* ===============================================================
     PREPARE MAGNIFIER
     =============================================================== */

  function prepareZoom() {

    const rendered = getRenderedImageRect();

    const src =
      wrap.dataset.zoomSrc ||
      mainImg.currentSrc ||
      mainImg.src;


    /*
       Magnifier uses the original image directly.
    */

    result.style.backgroundImage =
      `url("${src}")`;

    result.style.backgroundRepeat =
      'no-repeat';


    /*
       Scale background relative to actual visible image.
    */

    result.style.backgroundSize =
      `${rendered.width * ZOOM}px ` +
      `${rendered.height * ZOOM}px`;

  }


  /* ===============================================================
     SHOW MAGNIFIER
     =============================================================== */

  function showZoom() {

    prepareZoom();

    lens.style.display = 'block';

    result.style.display = 'block';

  }


  /* ===============================================================
     HIDE MAGNIFIER
     =============================================================== */

  function hideZoom() {

    lens.style.display = 'none';

    result.style.display = 'none';

  }


  /* ===============================================================
     MOVE MAGNIFIER
     =============================================================== */

  function moveZoom(event) {

    /*
       Touch input should use the lightbox instead.
    */

    if (event.pointerType === 'touch') {

      hideZoom();

      return;

    }


    const rendered =
      getRenderedImageRect();


    /*
       Mouse position relative to the entire gallery container.
    */

    const mouseX =
      event.clientX -
      rendered.box.left;

    const mouseY =
      event.clientY -
      rendered.box.top;


    /*
       Mouse position relative to the ACTUAL visible image.
    */

    const imageX =
      mouseX -
      rendered.left;

    const imageY =
      mouseY -
      rendered.top;


    /*
       If cursor is over the empty letterbox area created by
       object-fit: contain, hide the magnifier.
    */

    if (
      imageX < 0 ||
      imageY < 0 ||
      imageX > rendered.width ||
      imageY > rendered.height
    ) {

      hideZoom();

      return;

    }


    /*
       Cursor is genuinely over the image.
    */

    if (
      lens.style.display !== 'block' ||
      result.style.display !== 'block'
    ) {

      showZoom();

    }


    /* -------------------------------------------------------------
       Calculate lens dimensions.

       On very narrow portrait images the visible image could
       theoretically be smaller than the standard lens.
       ------------------------------------------------------------- */

    const lensWidth =
      Math.min(
        LENS_SIZE,
        rendered.width
      );

    const lensHeight =
      Math.min(
        LENS_SIZE,
        rendered.height
      );


    /*
       Center lens on cursor.
    */

    let lensX =
      imageX -
      lensWidth / 2;

    let lensY =
      imageY -
      lensHeight / 2;


    /*
       Prevent lens from leaving visible image.
    */

    lensX =
      Math.max(
        0,
        Math.min(
          lensX,
          rendered.width - lensWidth
        )
      );

    lensY =
      Math.max(
        0,
        Math.min(
          lensY,
          rendered.height - lensHeight
        )
      );


    /* -------------------------------------------------------------
       Position gold lens.

       rendered.left / rendered.top account for letterboxing.
       ------------------------------------------------------------- */

    lens.style.width =
      lensWidth + 'px';

    lens.style.height =
      lensHeight + 'px';

    lens.style.left =
      (rendered.left + lensX) + 'px';

    lens.style.top =
      (rendered.top + lensY) + 'px';


    /* -------------------------------------------------------------
       MAGNIFIED BACKGROUND

       Use center of lens as magnification target.
       ------------------------------------------------------------- */

    const lensCenterX =
      lensX +
      lensWidth / 2;

    const lensCenterY =
      lensY +
      lensHeight / 2;


    /*
       Position the zoomed image so the point beneath the centre
       of the lens appears in the centre of the result window.
    */

    const backgroundX =
      (result.clientWidth / 2) -
      (lensCenterX * ZOOM);

    const backgroundY =
      (result.clientHeight / 2) -
      (lensCenterY * ZOOM);


    result.style.backgroundPosition =
      `${backgroundX}px ${backgroundY}px`;

  }


  /* ===============================================================
     POINTER EVENTS

     Important:
     We deliberately do NOT rely on CSS media queries such as:

       (hover: hover)
       (pointer: fine)

     Those tests can incorrectly identify touchscreen Windows
     computers and disable the magnifier entirely.

     Instead, pointer events tell us whether the CURRENT interaction
     came from a mouse, pen or touchscreen.
     =============================================================== */

  wrap.addEventListener(
    'pointerenter',
    function (event) {

      if (event.pointerType !== 'touch') {

        moveZoom(event);

      }

    }
  );


  wrap.addEventListener(
    'pointermove',
    function (event) {

      if (event.pointerType !== 'touch') {

        moveZoom(event);

      }

    }
  );


  wrap.addEventListener(
    'pointerleave',
    function () {

      hideZoom();

    }
  );


  /* ===============================================================
     MOBILE / TOUCH LIGHTBOX
     =============================================================== */

  function openLightbox() {

    if (!lightbox || !lightboxImg) {
      return;
    }


    const src =
      wrap.dataset.zoomSrc ||
      mainImg.currentSrc ||
      mainImg.src;


    lightboxImg.src = src;

    lightbox.classList.add('active');

  }


  function closeLightbox() {

    if (!lightbox || !lightboxImg) {
      return;
    }


    lightbox.classList.remove('active');

    lightboxImg.src = '';

  }


  /*
     Track whether the most recent pointer interaction was touch.

     This prevents a normal desktop mouse click from opening
     the mobile lightbox.
  */

  let touchInteraction = false;


  wrap.addEventListener(
    'pointerdown',
    function (event) {

      touchInteraction =
        event.pointerType === 'touch';

    }
  );


  wrap.addEventListener(
    'click',
    function () {

      if (touchInteraction) {

        hideZoom();

        openLightbox();

      }


      touchInteraction = false;

    }
  );


  /*
     Close button.
  */

  if (lightboxClose) {

    lightboxClose.addEventListener(
      'click',
      function (event) {

        event.stopPropagation();

        closeLightbox();

      }
    );

  }


  /*
     Clicking the dark lightbox background closes it.
  */

  if (lightbox) {

    lightbox.addEventListener(
      'click',
      function (event) {

        if (event.target === lightbox) {

          closeLightbox();

        }

      }
    );

  }


  /*
     Escape key also closes lightbox.
  */

  document.addEventListener(
    'keydown',
    function (event) {

      if (
        event.key === 'Escape' &&
        lightbox &&
        lightbox.classList.contains('active')
      ) {

        closeLightbox();

      }

    }
  );


  /* ===============================================================
     IMAGE LOAD

     naturalWidth and naturalHeight become reliable after load.
     =============================================================== */

  mainImg.addEventListener(
    'load',
    function () {

      hideZoom();

      prepareZoom();

    }
  );


  /* ===============================================================
     WINDOW RESIZE
     =============================================================== */

  window.addEventListener(
    'resize',
    function () {

      hideZoom();

      prepareZoom();

    }
  );


  /* ===============================================================
     INITIALISE
     =============================================================== */

  function initialiseGallery() {

    /*
       Make sure zoom source matches initial image.
    */

    if (!wrap.dataset.zoomSrc) {

      wrap.dataset.zoomSrc =
        mainImg.getAttribute('src');

    }


    /*
       Prepare magnifier once initial image is available.
    */

    if (mainImg.complete) {

      prepareZoom();

    }


    /*
       Update mobile instruction where appropriate.
    */

    if (
      zoomHint &&
      window.matchMedia('(pointer: coarse)').matches
    ) {

      zoomHint.textContent =
        '🤏 Tap to expand';

    }

  }


  initialiseGallery();

})();
