'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // Marca que hay JS (para el failsafe del CSS)
  document.documentElement.classList.add('js-ready');

  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  /* ============================================
     A) Reveal en scroll (cascada)
  ============================================ */
  (() => {
    const els = $$('[data-reveal]');
    if (!els.length) return;

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('is-shown');
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.12 });

      els.forEach((el, i) => {
        el.style.transitionDelay = `${Math.min(i*60, 360)}ms`;
        io.observe(el);
      });
    } else {
      els.forEach(el => el.classList.add('is-shown'));
    }

    // Failsafe por si algo bloquea el IO
    setTimeout(() => els.forEach(el => el.classList.add('is-shown')), 1200);
  })();

  /* ============================================
     B) Contadores (KPI) al entrar en viewport
  ============================================ */
  (() => {
    const counters = $$('[data-counter]');
    if (!counters.length) return;

    const easeOutQuad = (t) => t * (2 - t);
    const formatNum = (n) => {
      // Para miles grandes, mostrar con separador; si quieres "10k", reemplaza por lógica de sufijos
      return new Intl.NumberFormat('es-PE').format(Math.round(n));
    };

    const animate = (el) => {
      const target = Number(el.getAttribute('data-target') || '0');
      const dur = Number(el.getAttribute('data-duration') || '1400');
      const start = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - start) / dur);
        const val = target * easeOutQuad(p);
        el.textContent = formatNum(val);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = formatNum(target);
      };
      requestAnimationFrame(step);
    };

    if ('IntersectionObserver' in window) {
      const once = new WeakSet();
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting && !once.has(e.target)) {
            once.add(e.target);
            animate(e.target);
          }
        });
      }, { threshold: 0.3 });

      counters.forEach(c => io.observe(c));
    } else {
      counters.forEach(animate);
    }
  })();

  /* ============================================
     C) Parallax tilt MUY sutil para la imagen
  ============================================ */
  (() => {
    const wrap = $('.tilt-wrap');
    const img  = $('.tilt-img');
    if (!wrap || !img) return;

    const maxTilt = 6; // grados
    let raf = null;

    const onMove = (e) => {
      const r = wrap.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const cx = r.left + r.width/2;
      const cy = r.top + r.height/2;
      const dx = (e.clientX - cx) / (r.width/2);
      const dy = (e.clientY - cy) / (r.height/2);
      const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
      const tx = clamp(dx, -1, 1), ty = clamp(dy, -1, 1);

      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        img.style.transform = `rotateY(${tx*maxTilt}deg) rotateX(${-ty*maxTilt}deg) translateZ(0)`;
      });
    };
    const reset = () => {
      if (raf) cancelAnimationFrame(raf);
      img.style.transform = '';
    };

    wrap.addEventListener('pointermove', onMove);
    wrap.addEventListener('pointerleave', reset);
    wrap.addEventListener('blur', reset);
  })();

  /* ============================================
     D) Timeline: línea de progreso + items en cascada
  ============================================ */
  (() => {
    const tl = $('.tl');
    if (!tl) return;
    const items = $$('.tl-item', tl);

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          tl.classList.add('in-view');
          items.forEach((el, i) => setTimeout(() => el.classList.add('is-shown'), 120 + i*140));
          io.disconnect();
        }
      }, { threshold: 0.15 });
      io.observe(tl);
    } else {
      tl.classList.add('in-view');
      items.forEach(el => el.classList.add('is-shown'));
    }
  })();

  /* ============================================
     E) Micro realce de iconos (hover) – ya soportado por CSS,
        aquí solo reforzamos el filtro de luz
  ============================================ */
  (() => {
    $$('.bi').forEach(icon => {
      icon.addEventListener('mouseenter', () => icon.style.filter = 'drop-shadow(0 4px 12px rgba(0,224,255,.35))');
      icon.addEventListener('mouseleave', () => icon.style.filter = '');
    });
  })();

  /* ============================================
     F) Ripple sutil en CTA final (opcional)
  ============================================ */
  (() => {
    const cta = $('.cta-final');
    if (!cta) return;
    cta.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn');
      if (!btn) return;
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.position = 'absolute';
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size/2}px`;
      ripple.style.top  = `${e.clientY - rect.top  - size/2}px`;
      ripple.style.borderRadius = '50%';
      ripple.style.background = 'rgba(255,255,255,.18)';
      ripple.style.pointerEvents = 'none';
      ripple.style.transform = 'scale(0)';
      ripple.style.transition = 'transform .45s ease, opacity .6s ease';
      ripple.style.opacity = '1';
      btn.style.position = 'relative';
      btn.appendChild(ripple);
      requestAnimationFrame(() => ripple.style.transform = 'scale(1.2)');
      setTimeout(() => { ripple.style.opacity = '0'; }, 360);
      setTimeout(() => ripple.remove(), 720);
    });
  })();

});
