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

  /* ---------- Fondos por sección: igualar la altura de la sección
     a la proporción real de su imagen (ancho/alto de archivo) ---------- */
  document.querySelectorAll("[data-bg]").forEach((section) => {
    const src = section.dataset.bgSrc;
    if (!src) return;
    const probe = new Image();
    probe.onload = () => {
      if (probe.naturalWidth && probe.naturalHeight) {
        section.style.setProperty(
          "--bg-ratio",
          `${probe.naturalWidth} / ${probe.naturalHeight}`,
        );
      }
    };
    probe.src = src;
  });

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

  /* ---------- Countdown to Sept 13 ---------- */
  const els = {
    days: document.getElementById("cd-days"),
    hours: document.getElementById("cd-hours"),
    min: document.getElementById("cd-min"),
    sec: document.getElementById("cd-sec"),
  };

  function getTargetDate() {
    const now = new Date();
    let year = now.getFullYear();
    let target = new Date(year, 8, 13, 0, 0, 0); // month 8 = septiembre
    if (target.getTime() < now.getTime()) {
      target = new Date(year + 1, 8, 13, 0, 0, 0);
    }
    return target;
  }

  const targetDate = getTargetDate();

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function updateCountdown() {
    const now = new Date().getTime();
    const diff = targetDate.getTime() - now;

    if (diff <= 0) {
      els.days.textContent = "00";
      els.hours.textContent = "00";
      els.min.textContent = "00";
      els.sec.textContent = "00";
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    if (els.days) els.days.textContent = pad(days);
    if (els.hours) els.hours.textContent = pad(hours);
    if (els.min) els.min.textContent = pad(minutes);
    if (els.sec) els.sec.textContent = pad(seconds);
  }

  if (els.days) {
    updateCountdown();
    setInterval(updateCountdown, 1000);
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
    const closeCta = modal?.querySelector("[data-close-modal]");

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

    // Clic en el botón CTA dentro del modal (Cierra y te lleva a #contacto)
    closeCta?.addEventListener("click", () => {
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

  // Cerrar carta al presionar la tecla Escape
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      serviceCards.forEach((c) => c.classList.remove("is-expanded"));
      document.body.style.overflow = "";
    }
  });

  /* ---------- Showcase carousel (marcas / propios) ---------- */
  document.querySelectorAll("[data-showcase]").forEach((root) => {
    const track = root.querySelector(".showcase__track");
    const slides = Array.from(root.querySelectorAll(".showcase__slide"));
    const bgs = Array.from(root.querySelectorAll(".showcase__bg"));
    const prevBtn = root.querySelector("[data-prev]");
    const nextBtn = root.querySelector("[data-next]");
    const dotsWrap = root.querySelector("[data-dots]");
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
      bgs.forEach((bg, bi) => bg.classList.toggle("is-active", bi === index));
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

  /* ---------- PHRASE: tina de pelotas interactiva (canvas + física simple) ---------- */
  const pit = document.getElementById("phrasePit");
  const canvas = document.getElementById("ballPitCanvas");

  if (pit && canvas) {
    const ctx = canvas.getContext("2d");
    const COLORS = ["#8c82f5", "#9ddf49", "#3c1b72", "#ffffff", "#c9c2ff"];
    const GRAVITY = 0.45;
    const FRICTION = 0.985; // resistencia del aire
    const WALL_BOUNCE = 0.7; // energía que conserva al chocar con paredes/piso
    const BALL_BOUNCE = 0.9; // energía que conserva entre pelotas
    const MOUSE_RADIUS = 110;
    const MOUSE_FORCE = 2.6;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let balls = [];
    let raf = null;

    const mouse = { x: -9999, y: -9999, active: false };

    function rand(min, max) {
      return Math.random() * (max - min) + min;
    }

    function buildBalls() {
      const area = width * height;
      // densidad pensada para que se vea "llena" sin ser excesiva en móvil
      const count = Math.max(16, Math.min(46, Math.round(area / 9000)));
      balls = [];
      for (let i = 0; i < count; i++) {
        const r = rand(16, 34);
        balls.push({
          x: rand(r, width - r),
          y: rand(-height, height * 0.6),
          vx: rand(-1, 1),
          vy: 0,
          r,
          color: COLORS[i % COLORS.length],
        });
      }
    }

    function resize() {
      const rect = pit.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildBalls();
    }

    function resolveBallCollision(a, b) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy) || 0.0001;
      const overlap = a.r + b.r - dist;
      if (overlap <= 0) return;

      const nx = dx / dist;
      const ny = dy / dist;

      // separar para que no se encimen
      const push = overlap / 2;
      a.x -= nx * push;
      a.y -= ny * push;
      b.x += nx * push;
      b.y += ny * push;

      // impulso elástico simple (masas ~ proporcionales al radio)
      const ma = a.r;
      const mb = b.r;
      const rvx = b.vx - a.vx;
      const rvy = b.vy - a.vy;
      const velAlongNormal = rvx * nx + rvy * ny;
      if (velAlongNormal > 0) return; // ya se están separando

      const restitution = BALL_BOUNCE;
      const impulse = (-(1 + restitution) * velAlongNormal) / (1 / ma + 1 / mb);
      const ix = impulse * nx;
      const iy = impulse * ny;
      a.vx -= ix / ma;
      a.vy -= iy / ma;
      b.vx += ix / mb;
      b.vy += iy / mb;
    }

    function step() {
      for (const ball of balls) {
        // gravedad + fricción del aire
        ball.vy += GRAVITY;
        ball.vx *= FRICTION;
        ball.vy *= FRICTION;

        // repulsión del mouse: entre más cerca, más fuerte se empujan
        if (mouse.active) {
          const dx = ball.x - mouse.x;
          const dy = ball.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          const minDist = MOUSE_RADIUS + ball.r;
          if (dist < minDist && dist > 0.001) {
            const force = ((minDist - dist) / minDist) * MOUSE_FORCE;
            ball.vx += (dx / dist) * force;
            ball.vy += (dy / dist) * force;
          }
        }

        ball.x += ball.vx;
        ball.y += ball.vy;

        // paredes
        if (ball.x - ball.r < 0) {
          ball.x = ball.r;
          ball.vx *= -WALL_BOUNCE;
        } else if (ball.x + ball.r > width) {
          ball.x = width - ball.r;
          ball.vx *= -WALL_BOUNCE;
        }
        // piso
        if (ball.y + ball.r > height) {
          ball.y = height - ball.r;
          ball.vy *= -WALL_BOUNCE;
          ball.vx *= 0.98; // fricción con el "piso" de la tina
        }
        // techo (por si el impulso del mouse las manda muy arriba)
        if (ball.y - ball.r < 0) {
          ball.y = ball.r;
          ball.vy *= -WALL_BOUNCE;
        }
      }

      // colisiones entre pelotas (varias pasadas para que se sientan sólidas)
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < balls.length; i++) {
          for (let j = i + 1; j < balls.length; j++) {
            resolveBallCollision(balls[i], balls[j]);
          }
        }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      for (const ball of balls) {
        const gradient = ctx.createRadialGradient(
          ball.x - ball.r * 0.35,
          ball.y - ball.r * 0.4,
          ball.r * 0.1,
          ball.x,
          ball.y,
          ball.r,
        );
        gradient.addColorStop(0, "rgba(255,255,255,0.9)");
        gradient.addColorStop(0.25, ball.color);
        gradient.addColorStop(1, "rgba(0,0,0,0.35)");
        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function loop() {
      step();
      draw();
      raf = requestAnimationFrame(loop);
    }

    function updateMouseFromEvent(e) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
      pit.classList.add("is-touched");
    }

    pit.addEventListener("mousemove", updateMouseFromEvent);
    pit.addEventListener("mouseleave", () => {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    });
    pit.addEventListener(
      "touchmove",
      (e) => {
        if (!e.touches[0]) return;
        updateMouseFromEvent(e.touches[0]);
      },
      { passive: true },
    );
    pit.addEventListener(
      "touchend",
      () => {
        mouse.active = false;
      },
      { passive: true },
    );

    let resizeTimer = null;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    });

    resize();

    if (reducedMotion) {
      // sin animación continua: una sola pasada de física para acomodarlas
      // en el fondo y quedan estáticas, sin loop de requestAnimationFrame.
      for (let i = 0; i < 90; i++) step();
      draw();
    } else if ("IntersectionObserver" in window) {
      // solo corre la simulación mientras la sección es visible (ahorra batería)
      const pitObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !raf) {
              loop();
            } else if (!entry.isIntersecting && raf) {
              cancelAnimationFrame(raf);
              raf = null;
            }
          });
        },
        { threshold: 0.05 },
      );
      pitObserver.observe(pit);
    } else {
      loop();
    }
  }

  /* ---------- Contact form (front-end only placeholder) ---------- */
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        status.textContent = "Revisa los campos antes de enviar.";
        status.style.color = "#ff8c82";
        return;
      }
      // Espacio para conectar con un backend/servicio de envío real.
      status.style.color = "";
      status.textContent =
        "¡Gracias! Tu mensaje quedó registrado. Te contactaremos pronto.";
      form.reset();
    });
  }
  /* ---------- Drawer: cajón que sube con el scroll ---------- */
  const drawerSection = document.getElementById("drawer");
  const drawerPanel = document.getElementById("drawerPanel");

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
