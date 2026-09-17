(() => {
  "use strict";

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  /* ---------- Ancho real del viewport (sin scrollbar) para fondos a
     pantalla completa. 100vw incluye el scrollbar y desalinea unos
     pixeles hacia la izquierda los elementos centrados con el truco
     width:100vw + left:50% + translateX(-50%) (.showcase, .bg-fullwidth).
     Con --vw100 usamos el ancho visible real (clientWidth). ---------- */
  function setViewportWidthVar() {
    document.documentElement.style.setProperty(
      "--vw100",
      `${document.documentElement.clientWidth}px`,
    );
  }
  setViewportWidthVar();
  window.addEventListener("resize", setViewportWidthVar);
  window.addEventListener("load", setViewportWidthVar);

  /* ---------- NAV: solid on scroll + mobile menu ---------- */
  const nav = document.getElementById("nav");
  const burger = document.getElementById("burger");
  const navLinks = document.getElementById("navLinks");

  const onScrollNav = () => {
    nav.classList.toggle("is-scrolled", window.scrollY > 40);
  };
  onScrollNav();
  window.addEventListener("scroll", onScrollNav, { passive: true });

  if (burger && navLinks) {
    burger.addEventListener("click", () => {
      const open = navLinks.classList.toggle("is-open");
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
    });
    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("is-open");
        burger.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Scroll reveal (IntersectionObserver) ---------- */
  const revealEls = document.querySelectorAll(
    ".reveal, .reveal-left, .reveal-right",
  );
  if (reducedMotion) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Equipo: cajón ligado al scroll ---------- */
  const teamSection = document.querySelector(".team");
  const teamDrawer = document.querySelector(".team__drawer");

  if (teamSection && teamDrawer) {
    let ticking = false;

    function updateDrawerOpen() {
      const rect = teamDrawer.getBoundingClientRect();
      const vh = window.innerHeight;
      // progress 0: el cajón apenas asoma por abajo del viewport (85%)
      // progress 1: el cajón ya está bien entrado en pantalla (35%)
      const start = vh * 0.7;
      const end = vh * 0.5;
      let progress = (start - rect.top) / (start - end);
      progress = Math.min(Math.max(progress, 0), 1);
      teamDrawer.style.setProperty("--open", progress.toFixed(3));
      ticking = false;
    }

    function onTeamScroll() {
      if (!ticking) {
        window.requestAnimationFrame(updateDrawerOpen);
        ticking = true;
      }
    }

    updateDrawerOpen();
    window.addEventListener("scroll", onTeamScroll, { passive: true });
    window.addEventListener("resize", onTeamScroll);

    // Cursor de mano al pasar sobre la sección; mano cerrada mientras agarras a alguien
    teamSection.addEventListener("pointerdown", () => {
      teamSection.classList.add("is-grabbing");
    });
    window.addEventListener("pointerup", () => {
      teamSection.classList.remove("is-grabbing");
    });
  }

  /* ---------- Equipo: recortes en video, agarrar + arrastrar + soltar ---------- */
  const teamShelf = document.getElementById("teamShelf");
  if (teamShelf) {
    // Panel derecho: foto grupal + círculo que resalta la carita + info
    const teamProfile = document.getElementById("teamProfile");
    const teamViewport = document.getElementById("teamViewport");
    const teamFullImg = document.getElementById("teamFullImg");
    const teamBlurImg = document.getElementById("teamBlurImg");
    const teamCircleFocus = document.getElementById("teamCircleFocus");
    const memberName = document.getElementById("memberName");
    const memberRole = document.getElementById("memberRole");
    const memberQuote = document.getElementById("memberQuote");

    const figures = Array.from(teamShelf.querySelectorAll(".team__figure"));

    // Grado de zoom hacia la carita del integrante seleccionado, y radio
    // (en px) del círculo que queda nítido — debe coincidir con el
    // diámetro de .team__circle-focus en el CSS (156px => radio 78px).
    const ZOOM_SCALE = 1.5;
    const FOCUS_RADIUS = 78;

    // Al seleccionar/agarrar a alguien: zoom hacia su carita en la foto
    // grupal, recorta la capa nítida a un círculo sobre esa carita (el
    // resto queda tapado por la capa blureada de abajo) + su nombre/rol/frase.
    function selectMember(figure) {
      if (!teamProfile || !teamFullImg) return;
      const { name, role, quote, faceX, faceY } = figure.dataset;
      const x = faceX || "50";
      const y = faceY || "50";

      teamProfile.classList.add("has-selection");
      teamViewport?.classList.add("has-selection");

      // Mismo zoom en ambas capas para que el recorte quede alineado
      const zoomTransform = `scale(${ZOOM_SCALE})`;
      teamFullImg.style.transformOrigin = `${x}% ${y}%`;
      teamFullImg.style.transform = zoomTransform;
      if (teamBlurImg) {
        teamBlurImg.style.transformOrigin = `${x}% ${y}%`;
        teamBlurImg.style.transform = zoomTransform;
      }

      // Variables que usa el clip-path circular en el CSS
      teamViewport?.style.setProperty("--focus-x", `${x}%`);
      teamViewport?.style.setProperty("--focus-y", `${y}%`);
      teamViewport?.style.setProperty("--focus-r", `${FOCUS_RADIUS}px`);

      if (teamCircleFocus) {
        teamCircleFocus.style.left = `${x}%`;
        teamCircleFocus.style.top = `${y}%`;
        teamCircleFocus.classList.add("is-active");
      }

      if (memberName) memberName.textContent = name || "";
      if (memberRole) memberRole.textContent = role || "";
      if (memberQuote) memberQuote.textContent = quote ? `“${quote}”` : "";
    }

    // Regresa el panel derecho a su estado vacío (foto completa, sin zoom).
    function resetSelection() {
      if (!teamProfile || !teamFullImg) return;
      teamProfile.classList.remove("has-selection");
      teamViewport?.classList.remove("has-selection");
      teamFullImg.style.transform = "scale(1)";
      if (teamBlurImg) teamBlurImg.style.transform = "scale(1)";
      teamCircleFocus?.classList.remove("is-active");
    }

    // Clic directo sobre la foto grupal (fuera de una figura) = deseleccionar.
    teamViewport?.addEventListener("click", () => resetSelection());

    // Crossfade simple: baja opacidad, cambia el src, vuelve a subir opacidad.
    function crossfadeImage(img, src) {
      if (!img || !src || img.getAttribute("src") === src) return;
      img.style.opacity = "0";
      window.setTimeout(() => {
        img.src = src;
        img.style.opacity = "1";
      }, 120);
    }

    // Cambia el estado (idle / grabbed) de la cabeza y el cuerpo del PNG.
    function setFigureState(figure, kind) {
      const suffix = kind === "grabbed" ? "Grabbed" : "Idle";
      const head = figure.querySelector(".team__head");
      const body = figure.querySelector(".team__body");
      crossfadeImage(head, figure.dataset[`head${suffix}`]);
      crossfadeImage(body, figure.dataset[`body${suffix}`]);
    }

    // Máximo ángulo (en grados) que el cuerpo puede balancear desde el cuello.
    const MAX_SWING = 22;
    // Qué tan sensible es el balanceo respecto al desplazamiento horizontal.
    const SWING_FACTOR = 0.15;

    figures.forEach((figure) => {
      const head = figure.querySelector(".team__head");
      const drag = figure.querySelector(".team__drag");
      let pointerId = null;
      let startX = 0;
      let startY = 0;
      let moved = false;

      // Solo la CABEZA es agarrable: así se respeta la metáfora de
      // marioneta (la sostienes del punto de arriba y el cuerpo cuelga).
      head.addEventListener("pointerdown", (e) => {
        pointerId = e.pointerId;
        startX = e.clientX;
        startY = e.clientY;
        moved = false;
        head.setPointerCapture(pointerId);

        // Al agarrarlo: PNG "sostenido" (cabeza + cuerpo), pasa por delante
        // de los demás (el resto se atenúa vía "has-grabbed" en el shelf)
        // y hace zoom hacia su carita en la foto grupal de la derecha.
        figure.classList.add("is-grabbed");
        teamShelf.classList.add("has-grabbed");
        setFigureState(figure, "grabbed");
        selectMember(figure);
      });

      head.addEventListener("pointermove", (e) => {
        if (pointerId === null || e.pointerId !== pointerId) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
        if (!moved) return;

        const shelfRect = teamShelf.getBoundingClientRect();
        const figRect = figure.getBoundingClientRect();
        const maxX = shelfRect.right - figRect.width / 2 - (figRect.left - dx);
        const minX = shelfRect.left - figRect.width / 2 - (figRect.left - dx);
        const maxY =
          shelfRect.bottom - figRect.height * 0.6 - (figRect.top - dy);
        const minY = shelfRect.top - figRect.top - 20;

        let nx = Math.min(Math.max(dx, minX), maxX);
        let ny = Math.min(Math.max(dy, minY), maxY);

        figure.classList.add("is-dragging");
        drag.style.transform = `translate(${nx}px, ${ny}px)`;

        // Efecto marioneta: el cuerpo se balancea colgando del cuello,
        // en dirección opuesta al arrastre horizontal (como un péndulo).
        // Se omite si el usuario pidió "reducir movimiento".
        if (!reducedMotion) {
          const swing = Math.min(
            Math.max(-dx * SWING_FACTOR, -MAX_SWING),
            MAX_SWING,
          );
          figure.style.setProperty("--swing", swing.toFixed(2));
        }
      });

      function endDrag(e) {
        if (pointerId === null || e.pointerId !== pointerId) return;
        head.releasePointerCapture(pointerId);
        pointerId = null;

        // Al soltarlo: regresa suavemente a su espacio, el cuerpo vuelve a
        // colgar recto (rebote elástico via CSS) y vuelve al PNG idle.
        // El panel derecho (zoom + círculo) se queda mostrando a quien
        // soltaste, hasta que agarres a otra persona o toques la foto.
        figure.classList.remove("is-dragging", "is-grabbed");
        teamShelf.classList.remove("has-grabbed");
        drag.style.transform = "";
        figure.style.setProperty("--swing", "0");
        setFigureState(figure, "idle");
      }

      head.addEventListener("pointerup", endDrag);
      head.addEventListener("pointercancel", endDrag);
    });
  }

  /* ---------- Servicios: Apertura nativa en Fullscreen ---------- */
  const serviceCards = document.querySelectorAll("[data-service-card]");

  serviceCards.forEach((card) => {
    const modal = card.querySelector("[data-service-modal]");
    const closeBtn = modal?.querySelector(".service-modal__close");

    // Abrir modal Fullscreen nativo al hacer click en la carta
    card.addEventListener("click", () => {
      if (modal && !modal.open) {
        modal.showModal(); // Método nativo de HTML5 para Top-Layer Fullscreen
        document.body.style.overflow = "hidden";
      }
    });

    // Función para cerrar el modal
    const closeModal = () => {
      if (modal && modal.open) {
        modal.close();
        document.body.style.overflow = "";
      }
    };

    // Botón X de cierre
    closeBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      closeModal();
    });

    // Cerrar al dar click fuera del contenido (en el fondo translúcido)
    modal?.addEventListener("click", (e) => {
      const rect = modal.getBoundingClientRect();
      const isInDialog =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;

      if (!isInDialog) {
        closeModal();
      }
    });

    // Restaurar scroll si se cierra con la tecla ESC
    modal?.addEventListener("cancel", () => {
      document.body.style.overflow = "";
    });
  });

  /* ---------- Showcase carousel (marcas / propios) ---------- */
  document.querySelectorAll("[data-showcase]").forEach((root) => {
    const track = root.querySelector(".showcase__track");
    const slides = Array.from(root.querySelectorAll(".showcase__slide"));
    const bgs = Array.from(root.querySelectorAll(".showcase__bg"));
    const prevBtn = root.querySelector("[data-prev]");
    const nextBtn = root.querySelector("[data-next]");
    const dotsWrap = root.querySelector("[data-dots]");
    const videos = bgs.map((bg) => bg.querySelector("video"));
    if (!track || slides.length === 0) return;

    let index = 0;
    const AUTOPLAY_MS = 5000;
    let autoplayTimer = null;

    // Construir puntos indicadores
    const dots = slides.map((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", `Ir al proyecto ${i + 1}`);
      if (i === 0) b.classList.add("is-active");
      b.addEventListener("click", () => goTo(i, true));
      dotsWrap.appendChild(b);
      return b;
    });

    function goTo(i, isManual) {
      index = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      bgs.forEach((bg, bi) => {
        const isActive = bi === index;
        bg.classList.toggle("is-active", isActive);
        const video = videos[bi];
        if (!video) return;
        if (isActive) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
      dots.forEach((d, di) => d.classList.toggle("is-active", di === index));

      // Si el cambio fue manual (flechitas, puntos o swipe), reinicia el
      // reloj del autoplay para que no "pelee" con lo que el usuario hizo.
      if (isManual) restartAutoplay();
    }

    function startAutoplay() {
      stopAutoplay();
      autoplayTimer = window.setInterval(() => {
        goTo(index + 1, false);
      }, AUTOPLAY_MS);
    }
    function stopAutoplay() {
      if (autoplayTimer) {
        window.clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }
    function restartAutoplay() {
      if (slides.length > 1) startAutoplay();
    }

    prevBtn?.addEventListener("click", () => goTo(index - 1, true));
    nextBtn?.addEventListener("click", () => goTo(index + 1, true));

    // Pausa mientras el mouse está encima (no se mueve mientras lo estás viendo)
    root.addEventListener("mouseenter", stopAutoplay);
    root.addEventListener("mouseleave", restartAutoplay);

    // Swipe táctil
    let touchStartX = null;
    track.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.touches[0].clientX;
      },
      { passive: true },
    );
    track.addEventListener(
      "touchend",
      (e) => {
        if (touchStartX === null) return;
        const delta = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(delta) > 40) {
          goTo(delta > 0 ? index - 1 : index + 1, true);
        }
        touchStartX = null;
      },
      { passive: true },
    );

    goTo(0);
    restartAutoplay();
  });

  /* ---------- Drawer: cajón que sube con el scroll ---------- */
  const drawerSection = document.getElementById("drawer");
  const drawerPanel = document.getElementById("drawerPanel");
  const drawerReveal = document.getElementById("drawerRevealOverlay");
  const drawerRevealButton = document.getElementById("drawerRevealButton");
  const drawerCloseButton = document.getElementById("drawerCloseButton");
  const releaseKeyButtons = document.querySelectorAll("[data-release-key]");
  const releaseKeyIndicators = document.querySelectorAll(
    "[data-release-key-indicator]",
  );
  const drawerKeyStatus = document.getElementById("drawerKeyStatus");
  const drawerCountdownCard = document.querySelector(".drawer__countdown-card");
  const drawerCodeInput = document.getElementById("drawerSecretCode");
  const drawerCodeButton = document.getElementById("drawerCodeButton");
  const drawerCodeFeedback = document.getElementById("drawerCodeFeedback");
  const drawerCodeHint = document.getElementById("drawerCodeHint");
  const SECRET_RELEASE_CODE = "CHIVAS";
  const RELEASE_CODE_CHUNKS = ["CH", "IV", "AS"];
  const foundDrawerKeys = new Set();
  let releaseUnlocked = false;

  if (drawerReveal) {
    document.body.appendChild(drawerReveal);
  }

  function updateDrawerKeyState() {
    const allKeysFound = foundDrawerKeys.size === releaseKeyButtons.length;
    if (drawerCodeHint) {
      const fragments = RELEASE_CODE_CHUNKS.map((chunk, index) =>
        foundDrawerKeys.has(String(index + 1)) ? chunk : "__",
      );
      drawerCodeHint.textContent = `Fragmentos recuperados: ${fragments.join(" · ")}`;
    }
    releaseKeyIndicators.forEach((indicator, index) => {
      const isFound = foundDrawerKeys.has(String(index + 1));
      indicator.classList.toggle("is-found", isFound);
    });
    if (drawerKeyStatus) {
      drawerKeyStatus.textContent = allKeysFound
        ? "Las llaves revelaron un código"
        : `Encuentra las 3 llaves · ${foundDrawerKeys.size}/3`;
    }
    if (drawerCodeInput) drawerCodeInput.disabled = !allKeysFound;
    if (drawerCodeButton) drawerCodeButton.disabled = !allKeysFound;
    if (drawerRevealButton && !drawerReveal?.classList.contains("is-open")) {
      drawerRevealButton.disabled = !releaseUnlocked;
      drawerRevealButton.textContent = releaseUnlocked
        ? "Desbloquear release"
        : allKeysFound
          ? "Introduce el código"
          : `${foundDrawerKeys.size}/3 llaves encontradas`;
    }
  }

  releaseKeyButtons.forEach((keyButton) => {
    keyButton.addEventListener("click", () => {
      const keyId = keyButton.dataset.releaseKey;
      if (!keyId || foundDrawerKeys.has(keyId)) return;

      foundDrawerKeys.add(keyId);
      keyButton.classList.add("is-found");
      keyButton.disabled = true;
      drawerCountdownCard?.classList.remove("is-glitching");
      void drawerCountdownCard?.offsetWidth;
      drawerCountdownCard?.classList.add("is-glitching");
      updateDrawerKeyState();
    });
  });

  function validateReleaseCode() {
    if (!drawerCodeInput || foundDrawerKeys.size !== releaseKeyButtons.length) {
      return;
    }

    const enteredCode = drawerCodeInput.value.trim().toUpperCase();
    const isValid = enteredCode === SECRET_RELEASE_CODE;
    drawerCodeFeedback?.classList.toggle("is-error", !isValid);
    drawerCodeFeedback?.classList.toggle("is-success", isValid);

    if (isValid) {
      releaseUnlocked = true;
      if (drawerCodeFeedback) {
        drawerCodeFeedback.textContent = "Código aceptado · acceso concedido";
      }
      updateDrawerKeyState();
      drawerCountdownCard?.classList.remove("is-glitching");
      void drawerCountdownCard?.offsetWidth;
      drawerCountdownCard?.classList.add("is-glitching");
    } else {
      if (drawerCodeFeedback) {
        drawerCodeFeedback.textContent =
          "Código incorrecto · vuelve a intentarlo";
      }
      drawerCodeInput.value = "";
      drawerCountdownCard?.classList.remove("is-glitching");
      void drawerCountdownCard?.offsetWidth;
      drawerCountdownCard?.classList.add("is-glitching");
    }
  }

  drawerCodeButton?.addEventListener("click", validateReleaseCode);
  drawerCodeInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") validateReleaseCode();
  });

  const setDrawerRevealState = (isOpen) => {
    if (!drawerReveal) return;
    drawerReveal.classList.toggle("is-open", isOpen);
    drawerReveal.classList.remove("is-opening");
    if (isOpen) {
      void drawerReveal.offsetWidth;
      drawerReveal.classList.add("is-opening");
      window.setTimeout(() => drawerReveal.classList.remove("is-opening"), 500);
    }
    document.body.classList.toggle("release-is-open", isOpen);
    drawerReveal.style.opacity = isOpen ? "1" : "0";
    drawerReveal.style.visibility = isOpen ? "visible" : "hidden";
    drawerReveal.style.pointerEvents = isOpen ? "auto" : "none";
    drawerRevealButton?.setAttribute("aria-expanded", String(isOpen));
    drawerRevealButton.disabled = !isOpen && !releaseUnlocked;
    drawerRevealButton.textContent = isOpen
      ? "Cerrar release"
      : releaseUnlocked
        ? "Desbloquear release"
        : foundDrawerKeys.size === releaseKeyButtons.length
          ? "Introduce el código"
          : `${foundDrawerKeys.size}/3 llaves encontradas`;

    const video = drawerReveal.querySelector(".drawer__video");
    if (video) {
      if (isOpen) {
        video.play().catch(() => {});
      } else {
        video.pause();
        video.currentTime = 0;
      }
    }
  };

  updateDrawerKeyState();
  setDrawerRevealState(false);

  if (drawerReveal && drawerRevealButton) {
    drawerRevealButton.addEventListener("click", () => {
      const openNow = !drawerReveal.classList.contains("is-open");
      setDrawerRevealState(openNow);
    });
  }

  if (drawerCloseButton) {
    drawerCloseButton.addEventListener("click", () =>
      setDrawerRevealState(false),
    );
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && drawerReveal?.classList.contains("is-open")) {
      setDrawerRevealState(false);
    }
  });

  if (drawerSection && drawerPanel) {
    let ticking = false;

    function updateDrawer() {
      const rect = drawerSection.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = drawerSection.offsetHeight - vh;
      const scrolled = -rect.top;
      let progress = Math.min(Math.max(scrolled / total, 0), 1);

      // Se setea en la sección (no solo en el panel) para que también
      // lo puedan leer otros elementos dentro del cajón, como el
      // countdown, vía herencia de la custom property CSS.
      drawerSection.style.setProperty("--drawer-open", progress.toFixed(4));
      drawerPanel.style.setProperty("--drawer-open", progress.toFixed(4));
      ticking = false;
    }

    function onDrawerScroll() {
      if (!ticking) {
        requestAnimationFrame(updateDrawer);
        ticking = true;
      }
    }

    updateDrawer();
    window.addEventListener("scroll", onDrawerScroll, { passive: true });
    window.addEventListener("resize", updateDrawer);
  }
})();
