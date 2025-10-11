'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // Marca que hay JS activo (para los fallbacks de CSS)
  document.documentElement.classList.add('js-ready');

  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  /* ======================================================
     1) Reveal en scroll (animación de entrada)
  ====================================================== */
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
  })();

  /* ======================================================
     2) Input-group: estado de focus (para icono)
  ====================================================== */
  (() => {
    $$('#contactForm .input-group').forEach(group => {
      const input = $('input, textarea', group);
      if (!input) return;
      input.addEventListener('focus', () => group.classList.add('focused'));
      input.addEventListener('blur',  () => group.classList.remove('focused'));
    });
  })();

  /* ======================================================
     3) Contador de caracteres del mensaje
  ====================================================== */
  (() => {
    const ta = $('#mensaje');
    const counter = $('#msgCount');
    if (!ta || !counter) return;
    const max = Number(ta.getAttribute('maxlength')) || 600;

    const update = () => {
      const len = (ta.value || '').length;
      counter.textContent = `${len} / ${max}`;
    };
    update();
    ta.addEventListener('input', update);
  })();

  /* ======================================================
     4) Validación + envío simulado + limpiar
  ====================================================== */
  (() => {
    const form = $('#contactForm');
    const alertBox = $('#formAlert');
    if (!form || !alertBox) return;

    const showAlert = (ok, msg) => {
      alertBox.className = `alert mt-3 ${ok ? 'alert-success' : 'alert-danger'}`;
      alertBox.textContent = msg;
    };
    const resetAlert = () => {
      alertBox.className = 'alert mt-3 d-none';
      alertBox.textContent = '';
    };

    const mark = (el, valid) => {
      el.classList.remove('is-valid', 'is-invalid');
      el.classList.add(valid ? 'is-valid' : 'is-invalid');
      if (!valid) {
        el.classList.add('shake');
        setTimeout(() => el.classList.remove('shake'), 360);
      }
    };

    const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      resetAlert();

      // Honeypot anti-spam
      const honey = $('#website');
      if (honey && honey.value.trim() !== '') {
        showAlert(false, 'No se pudo enviar. (SPAM detectado)');
        return;
      }

      const nombre  = $('#nombre');
      const email   = $('#email');
      const motivo  = $('#motivo');
      const asunto  = $('#asunto');
      const mensaje = $('#mensaje');
      const acepto  = $('#acepto');

      // Validaciones básicas
      let ok = true;

      if (!nombre.value.trim()) { mark(nombre, false); ok = false; } else mark(nombre, true);
      if (!validateEmail(email.value.trim())) { mark(email, false); ok = false; } else mark(email, true);
      if (!motivo.value) { mark(motivo, false); ok = false; } else mark(motivo, true);
      if (!asunto.value.trim()) { mark(asunto, false); ok = false; } else mark(asunto, true);
      if (!mensaje.value.trim()) { mark(mensaje, false); ok = false; } else mark(mensaje, true);

      if (!acepto.checked) {
        acepto.classList.add('shake');
        setTimeout(() => acepto.classList.remove('shake'), 360);
        ok = false;
      }

      if (!ok) {
        showAlert(false, 'Revisa los campos marcados en rojo.');
        return;
      }

      // “Envío” simulado
      const data = {
        nombre: nombre.value.trim(),
        email: email.value.trim(),
        motivo: motivo.value,
        asunto: asunto.value.trim(),
        mensaje: mensaje.value.trim(),
        fecha: new Date().toISOString()
      };

      // Aquí podrías usar fetch() hacia tu backend (Formspree, Supabase, etc.)
      // fetch('/api/contact', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) })

      console.log('Contacto enviado:', data);
      showAlert(true, '¡Gracias! Tu mensaje fue enviado. Te responderemos pronto.');

      // Limpiar luego de un pequeño delay para que se lea la alerta
      setTimeout(() => {
        form.reset();
        $$('.is-valid', form).forEach(el => el.classList.remove('is-valid'));
        $('#msgCount') && ($('#msgCount').textContent = '0 / 600');
      }, 300);
    });

    // Botón limpiar
    $('#btnClear')?.addEventListener('click', () => {
      form.reset();
      resetAlert();
      $$('.is-valid, .is-invalid', form).forEach(el => el.classList.remove('is-valid','is-invalid'));
      $('#msgCount') && ($('#msgCount').textContent = '0 / 600');
    });
  })();

  /* ======================================================
     5) Copiar email con toast
  ====================================================== */
  (() => {
    const btn = $('#copyEmailBtn');
    const toastEl = $('#copyToast');
    if (!btn || !toastEl) return;

    const bsToast = window.bootstrap ? new bootstrap.Toast(toastEl, { delay: 1500 }) : null;

    btn.addEventListener('click', async () => {
      try {
        const toCopy = btn.getAttribute('data-copy') || 'soporte@digitalloot.com';
        await navigator.clipboard.writeText(toCopy);
        if (bsToast) bsToast.show();
      } catch {
        // Fallback simple
        alert('Email copiado: ' + (btn.getAttribute('data-copy') || 'soporte@digitalloot.com'));
      }
    });
  })();

});
