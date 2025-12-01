'use strict';

// ===== Helper ready(): corre init tanto si el DOM ya está listo como si no
const ready = (fn) => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  } else {
    fn();
  }
};

ready(() => {
  document.documentElement.classList.add('js-ready');

  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  // Número de WhatsApp destino
  const RAW_WHATSAPP = '931436146';
  const formatPeruNumber = (raw) => {
    const only = String(raw).replace(/[^\d]/g, '');
    if (only.startsWith('51')) return only;
    if (only.length === 9) return '51' + only;
    return only;
  };
  const WA_NUMBER = formatPeruNumber(RAW_WHATSAPP);

  /* ===================== Reveal en scroll ===================== */
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

  /* ================= Focus reactivo de iconos ================= */
  (() => {
    $$('#contactForm .input-group').forEach(group => {
      const input = $('input, textarea', group);
      if (!input) return;
      input.addEventListener('focus', () => group.classList.add('focused'));
      input.addEventListener('blur',  () => group.classList.remove('focused'));
    });
  })();

  /* ================= Contador de caracteres =================== */
  (() => {
    const ta = $('#mensaje');
    const counter = $('#msgCount');
    if (!ta || !counter) return;
    const max = Number(ta.getAttribute('maxlength')) || 600;
    const update = () => counter.textContent = `${(ta.value||'').length} / ${max}`;
    update(); ta.addEventListener('input', update);
  })();

  /* ========== Validación + redirección a WhatsApp ============ */
  (() => {
    const form = $('#contactForm');
    const alertBox = $('#formAlert');
    const submitBtn = $('#contactForm button[type="submit"]');

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
      el.classList.remove('is-valid','is-invalid');
      el.classList.add(valid ? 'is-valid' : 'is-invalid');
      if (!valid) { el.classList.add('shake'); setTimeout(()=>el.classList.remove('shake'),360); }
    };
    const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

    // Lógica común para enviar a WhatsApp
    const goWhatsApp = () => {
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

      let ok = true;
      if (!nombre.value.trim())         { mark(nombre, false);  ok = false; } else mark(nombre, true);
      if (!validateEmail(email.value))  { mark(email, false);   ok = false; } else mark(email, true);
      if (!motivo.value)                { mark(motivo, false);  ok = false; } else mark(motivo, true);
      if (!asunto.value.trim())         { mark(asunto, false);  ok = false; } else mark(asunto, true);
      if (!mensaje.value.trim())        { mark(mensaje, false); ok = false; } else mark(mensaje, true);
      if (!acepto.checked)              { acepto.classList.add('shake'); setTimeout(()=>acepto.classList.remove('shake'),360); ok = false; }

      if (!ok) { showAlert(false, 'Revisa los campos marcados en rojo.'); return; }

      const lines = [
        'Hola Digital Loot 👋',
        `Nombre: ${nombre.value.trim()}`,
        `Email: ${email.value.trim()}`,
        `Motivo: ${motivo.value}`,
        `Asunto: ${asunto.value.trim()}`,
        'Mensaje:',
        mensaje.value.trim()
      ];
      const text = encodeURIComponent(lines.join('\n'));

      // URL compatible y antibloqueador (misma pestaña)
      const apiUrl = `https://api.whatsapp.com/send?phone=${WA_NUMBER}&text=${text}`;
      window.location.href = apiUrl;

      showAlert(true, 'Redirigiendo a WhatsApp…');
      setTimeout(() => {
        form.reset();
        $$('.is-valid', form).forEach(el => el.classList.remove('is-valid'));
        const mc = $('#msgCount'); if (mc) mc.textContent = '0 / 600';
      }, 250);
    };

    // Submit del formulario
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      goWhatsApp();
    });

    // Además, fallback: click directo en el botón de enviar
    submitBtn?.addEventListener('click', (e) => {
      // Si el navegador ignora submit programático, forzamos nuestra lógica
      if (form.checkValidity && !form.checkValidity()) return; // deja que HTML5 marque invalidos
      e.preventDefault();
      goWhatsApp();
    });

    // Botón limpiar
    $('#btnClear')?.addEventListener('click', () => {
      form.reset(); resetAlert();
      $$('.is-valid, .is-invalid', form).forEach(el => el.classList.remove('is-valid','is-invalid'));
      const mc = $('#msgCount'); if (mc) mc.textContent = '0 / 600';
    });
  })();

  /* ============== Copiar email + toast ============== */
  (() => {
    const btn = $('#copyEmailBtn');
    const toastEl = $('#copyToast');
    if (!btn || !toastEl) return;
    const bsToast = window.bootstrap ? new bootstrap.Toast(toastEl, { delay: 1500 }) : null;
    btn.addEventListener('click', async () => {
      try {
        const toCopy = btn.getAttribute('data-copy') || 'soporte@digitalloot.com';
        await navigator.clipboard.writeText(toCopy);
        if (bsToast) bsToast.show(); else alert('Email copiado: ' + toCopy);
      } catch {
        alert('Email copiado: ' + (btn.getAttribute('data-copy') || 'soporte@digitalloot.com'));
      }
    });
  })();
});
