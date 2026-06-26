// Portfolio interactions
(function () {
  "use strict";

  var FRAME_W = 588; // internal coordinate width of the case-study frames

  // Scale each case-study frame to fit its (responsive) column, keeping the
  // measurement guides/overlays pixel-aligned to the original 588x545 artwork.
  function scaleFrames() {
    var visuals = document.querySelectorAll(".case__visual");
    visuals.forEach(function (visual) {
      var frame = visual.querySelector(".frame");
      if (!frame) return;
      var available = visual.clientWidth;
      var scale = Math.min(1, available / FRAME_W);
      frame.style.transform = "scale(" + scale + ")";
      // collapse the wrapper height to the scaled frame so layout flows correctly
      visual.style.height = frame.offsetHeight * scale + "px";
    });
  }

  // Live pixel readout in the footer: each bracket reports the actual rendered
  // width of the span it measures ("843 px" in the design), updating on resize.
  function updatePxCounters() {
    document.querySelectorAll(".footer__measure").forEach(function (measure) {
      var counter = measure.querySelector(".px-counter");
      if (counter) counter.textContent = Math.round(measure.getBoundingClientRect().width);
    });
  }

  function onResize() {
    scaleFrames();
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

  function init() {
    onResize();
    wireNavAnchors();
    wireScrollReveal();
    wireScrollSpy();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.addEventListener("resize", onResize);
  window.addEventListener("load", scaleFrames); // re-measure after fonts/images settle
})();
