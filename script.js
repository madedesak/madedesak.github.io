// Portfolio interactions
(function () {
  "use strict";

  // Live pixel readout in the footer: each bracket reports the actual rendered
  // width of the span it measures ("843 px" in the design), updating on resize.
  function updatePxCounters() {
    document.querySelectorAll(".footer__measure").forEach(function (measure) {
      var counter = measure.querySelector(".px-counter");
      if (counter) counter.textContent = Math.round(measure.getBoundingClientRect().width);
    });
  }

  function onResize() {
    updatePxCounters();
  }

  // Smooth-scroll for in-page nav anchors (CSS handles the easing; this just
  // guards against any anchor that can't be resolved).
  function wireNavAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function (e) {
        var id = link.getAttribute("href");
        if (id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  // Reveal elements (.reveal) with a blur-rise as they scroll into view.
  function wireScrollReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || prefersReducedMotion()) {
      els.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target); // play once
          }
        });
      },
      // threshold 0 so it fires on entry regardless of element height
      // (case-study sections can be far taller than the viewport)
      { threshold: 0, rootMargin: "0px 0px -12% 0px" }
    );
    els.forEach(function (el) { io.observe(el); });
  }

  // Highlight the section-nav (TOC) link for whatever section is in view.
  function wireScrollSpy() {
    var links = document.querySelectorAll(".cs-toc__link");
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    links.forEach(function (link) {
      var id = link.getAttribute("href");
      if (id && id.charAt(0) === "#") {
        var section = document.getElementById(id.slice(1));
        if (section) map[id.slice(1)] = link;
      }
    });
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (l) { l.classList.remove("is-active"); });
          if (map[entry.target.id]) map[entry.target.id].classList.add("is-active");
        });
      },
      { rootMargin: "-28% 0px -60% 0px", threshold: 0 }
    );
    Object.keys(map).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) spy.observe(s);
    });
  }

  function safePlay(video) {
    var p = video.play();
    if (p && typeof p.catch === "function") p.catch(function () {});
  }

  // Play each <video> only while it's in the viewport; pause it once it scrolls
  // out. Saves CPU/bandwidth versus autoplaying every clip on load.
  function wireVideoPlayback() {
    var videos = document.querySelectorAll("video");
    if (!videos.length) return;
    if (prefersReducedMotion()) return; // honour reduced-motion: leave paused
    if (!("IntersectionObserver" in window)) {
      videos.forEach(safePlay);
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) safePlay(entry.target);
          else entry.target.pause();
        });
      },
      // start as soon as any part enters, pause once fully out of view
      { threshold: 0, rootMargin: "0px 0px -5% 0px" }
    );
    videos.forEach(function (v) { io.observe(v); });
  }

  // Design-strategy stepper: auto-advances through the stages on a fixed cadence
  // (the connector fills like a progress bar over --cs-step-dur), looping. Each
  // stage un-dims its text and cross-fades the right-side image. Clicking a step
  // jumps to it and restarts the timer. Reduced-motion: no auto-advance.
  function wireStrategyStepper() {
    var stepsEl = document.querySelector(".cs-steps");
    var steps = Array.prototype.slice.call(document.querySelectorAll(".cs-step"));
    var shots = Array.prototype.slice.call(document.querySelectorAll(".cs-strategy__img"));
    if (!stepsEl || !steps.length || !shots.length) return;
    var reduce = prefersReducedMotion();
    var durMs = (parseFloat(getComputedStyle(stepsEl).getPropertyValue("--cs-step-dur")) || 5) * 1000;
    var current = 0, timer = null;
    function render() {
      steps.forEach(function (s, i) {
        s.classList.toggle("is-active", i === current);
        var btn = s.querySelector(".cs-step__btn");
        if (btn) btn.setAttribute("aria-pressed", i === current ? "true" : "false");
      });
      shots.forEach(function (s, i) { s.classList.toggle("is-active", i === current); });
    }
    function schedule() {
      if (reduce) return;                      // honour reduced-motion: stay put
      clearTimeout(timer);
      timer = setTimeout(function () {
        current = (current + 1) % steps.length;
        render();
        schedule();
      }, durMs);
    }
    function goTo(i) { current = i; render(); schedule(); }
    steps.forEach(function (step, i) {
      var btn = step.querySelector(".cs-step__btn") || step;
      btn.addEventListener("click", function () { goTo(i); });
    });
    render();
    schedule();
  }

  // Funnel curve: set the path's dash length to its own length, then add
  // .is-drawn when it scrolls into view so the line draws left→right.
  function wireFunnelDraw() {
    var svg = document.querySelector(".cs-funnel-svg");
    if (!svg) return;
    var path = svg.querySelector(".cs-funnel-svg__curve");
    if (path && path.getTotalLength) {
      var len = Math.ceil(path.getTotalLength());
      svg.style.setProperty("--len", len);
    }
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      svg.classList.add("is-drawn");
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { svg.classList.add("is-drawn"); io.unobserve(svg); }
        });
      },
      { threshold: 0.35 }
    );
    io.observe(svg);
  }

  // About page — testimonial selector. Hover→colour is CSS; click swaps the
  // quote body + attribution (name/role/avatar) from the hidden .ab-data store.
  // About page — testimonial slider: one at a time, chevrons step through (loops).
  function wireAboutTestimonials() {
    var root = document.querySelector("[data-testi]");
    var items = document.querySelectorAll(".ab-data > div");
    if (!root || !items.length) return;
    var quote = root.querySelector("[data-quote]");
    var av = root.querySelector("[data-av]");
    var nameEl = root.querySelector("[data-name]");
    var roleEl = root.querySelector("[data-role]");
    var prev = root.querySelector("[data-prev]");
    var next = root.querySelector("[data-next]");
    var n = items.length, i = 0;
    function show(k) {
      i = (k % n + n) % n;
      var it = items[i];
      if (quote) quote.innerHTML = it.innerHTML;
      if (nameEl) nameEl.textContent = it.getAttribute("data-name") || "";
      if (roleEl) roleEl.textContent = it.getAttribute("data-role") || "";
      if (av) { var src = it.getAttribute("data-av"); if (src) av.src = src; }
    }
    if (prev) prev.addEventListener("click", function () { show(i - 1); });
    if (next) next.addEventListener("click", function () { show(i + 1); });
    show(0);
  }

  // About page — photo carousel (prev/next + dots + drag/swipe; no loop).
  function wireAboutCarousel() {
    var track = document.querySelector("[data-track]");
    if (!track) return;
    var slides = Array.prototype.slice.call(track.children);
    var viewport = track.parentElement;
    // scope controls to the gallery — the testimonial slider also uses [data-prev]/[data-next]
    var gallery = track.closest(".ab-gallery") || document;
    var dotsWrap = gallery.querySelector("[data-dots]");
    var prev = gallery.querySelector("[data-prev]");
    var next = gallery.querySelector("[data-next]");
    var n = slides.length, idx = 0, dots = [];
    if (dotsWrap) {
      slides.forEach(function (_, i) {
        var b = document.createElement("button");
        b.className = "ab-dot"; b.type = "button";
        b.setAttribute("aria-label", "Go to slide " + (i + 1));
        b.addEventListener("click", function () { go(i); });
        dotsWrap.appendChild(b); dots.push(b);
      });
    }
    function render() {
      track.style.transform = "translateX(" + (-idx * 100) + "%)";
      if (prev) prev.disabled = idx === 0;
      if (next) next.disabled = idx === n - 1;
      dots.forEach(function (d, i) { d.classList.toggle("is-active", i === idx); });
    }
    function go(i) { idx = Math.max(0, Math.min(n - 1, i)); render(); }
    if (prev) prev.addEventListener("click", function () { go(idx - 1); });
    if (next) next.addEventListener("click", function () { go(idx + 1); });

    // drag / swipe
    var startX = 0, dragging = false, moved = 0;
    function down(e) {
      dragging = true; moved = 0;
      startX = e.touches ? e.touches[0].clientX : e.clientX;
      track.style.transition = "none";
    }
    function move(e) {
      if (!dragging) return;
      var x = e.touches ? e.touches[0].clientX : e.clientX;
      moved = x - startX;
      track.style.transform = "translateX(" + (-idx * 100 + moved / viewport.offsetWidth * 100) + "%)";
    }
    function up() {
      if (!dragging) return;
      dragging = false;
      track.style.transition = "";
      var threshold = viewport.offsetWidth * 0.18;
      if (moved < -threshold) go(idx + 1);
      else if (moved > threshold) go(idx - 1);
      else render();
    }
    viewport.addEventListener("mousedown", down);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    viewport.addEventListener("touchstart", down, { passive: true });
    viewport.addEventListener("touchmove", move, { passive: true });
    viewport.addEventListener("touchend", up);
    viewport.addEventListener("dragstart", function (e) { e.preventDefault(); });
    render();
  }

  function init() {
    onResize();
    wireNavAnchors();
    wireScrollReveal();
    wireScrollSpy();
    wireVideoPlayback();
    wireStrategyStepper();
    wireFunnelDraw();
    wireAboutTestimonials();
    wireAboutCarousel();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.addEventListener("resize", onResize);
  window.addEventListener("load", updatePxCounters); // re-measure after fonts settle
})();
