(() => {
  'use strict';

  const root = document.documentElement;
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const reducedMotion = reducedMotionQuery.matches;
  let lenis = null;
  let lenisTicker = null;

  if (finePointerQuery.matches && !reducedMotion) root.classList.add('has-fine-pointer');
  if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  if (gsap && ScrollTrigger && !reducedMotion) {
    const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
    intro.from('.eyebrow', { y: 16, autoAlpha: 0, duration: .65 })
      .from('.hero-title > span', { yPercent: 110, autoAlpha: 0, duration: .9, stagger: .09 }, '-=.32')
      .from(['.hero-name', '.hero-intro', '.hero-actions'], { y: 18, autoAlpha: 0, duration: .65, stagger: .08 }, '-=.45')
      .from('.hero-aside', { autoAlpha: 0, duration: .7 }, '-=.45');

    const revealGroups = [
      '.manifesto-title', '.about-section .section-lead', '.about-body',
      '.craft-section .section-lead', '.craft-item', '.journey-section .section-lead', '.journey-entry',
      '.work-section .section-lead', '.project-row', '.milestones-section .section-lead', '.milestone-item',
      '.motto-inner h2', '.contact-inner h2', '.contact-email'
    ];
    revealGroups.forEach(selector => {
      gsap.utils.toArray(selector).forEach((element, index) => {
        gsap.from(element, {
          y: 28,
          autoAlpha: 0,
          duration: .8,
          delay: Math.min(index, 5) * .035,
          ease: 'power3.out',
          scrollTrigger: { trigger: element, start: 'top 88%', once: true }
        });
      });
    });

    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }

  const finePointer = finePointerQuery.matches && !reducedMotion;
  if (finePointer && gsap) {
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    if (dot && ring) {
      const dotX = gsap.quickTo(dot, 'x', { duration: .08, ease: 'power2.out' });
      const dotY = gsap.quickTo(dot, 'y', { duration: .08, ease: 'power2.out' });
      const ringX = gsap.quickTo(ring, 'x', { duration: .2, ease: 'power3.out' });
      const ringY = gsap.quickTo(ring, 'y', { duration: .2, ease: 'power3.out' });
      window.addEventListener('pointermove', event => {
        dotX(event.clientX); dotY(event.clientY); ringX(event.clientX); ringY(event.clientY);
      }, { passive: true });
      document.querySelectorAll('a, button, .project-visual').forEach(element => {
        element.addEventListener('pointerenter', () => ring.classList.add('is-hover'));
        element.addEventListener('pointerleave', () => ring.classList.remove('is-hover'));
        element.addEventListener('focus', () => ring.classList.add('is-hover'));
        element.addEventListener('blur', () => ring.classList.remove('is-hover'));
      });
    }

    document.querySelectorAll('.magnetic').forEach(element => {
      const xTo = gsap.quickTo(element, 'x', { duration: .42, ease: 'elastic.out(1, .45)' });
      const yTo = gsap.quickTo(element, 'y', { duration: .42, ease: 'elastic.out(1, .45)' });
      element.addEventListener('pointermove', event => {
        const bounds = element.getBoundingClientRect();
        xTo((event.clientX - bounds.left - bounds.width / 2) * .12);
        yTo((event.clientY - bounds.top - bounds.height / 2) * .12);
      });
      element.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
      element.addEventListener('blur', () => { xTo(0); yTo(0); });
    });
  }

  let lastGlitch = 0;
  document.querySelectorAll('[data-glitch]').forEach(element => {
    const trigger = () => {
      if (reducedMotion || performance.now() - lastGlitch < 320) return;
      lastGlitch = performance.now();
      element.classList.remove('glitch-active');
      void element.offsetWidth;
      element.classList.add('glitch-active');
      window.setTimeout(() => element.classList.remove('glitch-active'), 320);
    };
    element.addEventListener('pointerenter', trigger);
    element.addEventListener('focusin', trigger);
  });

  let worldStarted = false;
  let worldStarting = false;
  let lenisStarting = false;

  const stopLenis = () => {
    if (lenisTicker && gsap) gsap.ticker.remove(lenisTicker);
    lenis?.destroy();
    lenis = null;
    lenisTicker = null;
    root.dataset.smoothScroll = 'native';
  };

  const bootLenis = async () => {
    if (!gsap || !ScrollTrigger || reducedMotionQuery.matches || lenis || lenisStarting) return;
    lenisStarting = true;
    try {
      const { default: Lenis } = await import('./vendor/lenis/lenis.js');
      if (document.hidden || reducedMotionQuery.matches || lenis) return;
      lenis = new Lenis({ autoRaf: false, anchors: true, lerp: .085, smoothWheel: true, syncTouch: false, wheelMultiplier: .92 });
      lenis.on('scroll', ScrollTrigger.update);
      lenisTicker = time => lenis?.raf(time * 1000);
      gsap.ticker.add(lenisTicker);
      gsap.ticker.lagSmoothing(0);
      root.dataset.smoothScroll = 'ready';
    } catch (error) {
      root.dataset.smoothScroll = 'fallback';
    } finally {
      lenisStarting = false;
    }
  };

  const bootWorld = async () => {
    if (reducedMotionQuery.matches || worldStarted || worldStarting) return;
    worldStarting = true;
    try {
      const { initPortfolioWorld } = await import('./portfolio-world.js?v=20261118-scenes4');
      if (reducedMotionQuery.matches || worldStarted) return;
      initPortfolioWorld({ gsap, ScrollTrigger, reducedMotionQuery, finePointerQuery });
      worldStarted = true;
    } catch (error) {
      root.dataset.worldFallback = 'true';
    } finally {
      worldStarting = false;
    }
  };

  if (!reducedMotion) {
    bootLenis();
    if ('requestIdleCallback' in window) window.requestIdleCallback(bootWorld, { timeout: 1200 });
    else window.setTimeout(bootWorld, 160);
  }

  reducedMotionQuery.addEventListener('change', event => {
    if (event.matches) {
      stopLenis();
      gsap?.globalTimeline.pause();
      root.dataset.worldReady = 'false';
    } else {
      gsap?.globalTimeline.resume();
      ScrollTrigger?.refresh();
      bootLenis();
      bootWorld();
    }
  });

  const onVisibility = () => {
    if (document.hidden) lenis?.stop();
    else if (!reducedMotionQuery.matches) lenis?.start();
  };
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', () => {
    stopLenis();
  }, { once: true });
})();
