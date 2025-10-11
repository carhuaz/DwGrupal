document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  const alertBox = document.getElementById('formAlert');

  // Etiquetas flotantes (visuales): si quieres usar, añade <small class="floating">…</small> tras inputs
  // Ya está soportado por CSS si usas placeholder.

  // Envío simulado + confeti
  form.addEventListener('submit', e => {
    e.preventDefault();

    const nombre = form.nombre.value.trim();
    const email  = form.email.value.trim();
    const asunto = form.asunto.value.trim();
    const mensaje= form.mensaje.value.trim();

    // Validación simple
    const invalids = [];
    if (!nombre)  invalids.push('nombre');
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) invalids.push('email');
    if (!asunto)  invalids.push('asunto');
    if (!mensaje) invalids.push('mensaje');

    // Reset estilos
    ['nombre','email','asunto','mensaje'].forEach(id => form[id].classList.remove('invalid-shake','is-invalid'));

    if (invalids.length){
      invalids.forEach(id => {
        form[id].classList.add('is-invalid','invalid-shake');
        setTimeout(() => form[id].classList.remove('invalid-shake'), 400);
      });
      showAlert('Por favor, completa los campos correctamente.', 'danger');
      return;
    }

    // Simula envío
    setTimeout(() => {
      showAlert('¡Tu mensaje fue enviado con éxito! Te responderemos pronto. 🎉', 'success');
      burstConfetti();
      form.reset();
    }, 500);
  });

  function showAlert(msg, type){
    alertBox.className = `alert alert-${type}`;
    alertBox.textContent = msg;
    alertBox.classList.remove('d-none');
    // forzar transición
    requestAnimationFrame(() => alertBox.classList.add('show'));
    setTimeout(() => {
      alertBox.classList.remove('show');
      setTimeout(() => alertBox.classList.add('d-none'), 250);
    }, 4000);
  }

  /* --------- Confeti vanilla (ligero) ---------- */
  function burstConfetti(){
    const container = document.body;
    const count = 60;
    for (let i = 0; i < count; i++){
      const bit = document.createElement('span');
      bit.className = 'confetti-bit';
      const size = 6 + Math.random()*6;
      bit.style.width = bit.style.height = `${size}px`;
      bit.style.left = `${50 + (Math.random()*30 - 15)}%`;
      bit.style.top  = `calc(${window.scrollY + 80}px)`;
      bit.style.setProperty('--tx', `${(Math.random() * 2 - 1) * 120}px`);
      bit.style.setProperty('--ty', `${- (80 + Math.random()*160)}px`);
      bit.style.setProperty('--rz', `${(Math.random() * 2 - 1) * 140}deg`);
      bit.style.background = i % 3 ? 'var(--primary)' : 'var(--accent)';
      container.appendChild(bit);
      // cleanup
      setTimeout(() => bit.remove(), 1200);
    }
  }
});
