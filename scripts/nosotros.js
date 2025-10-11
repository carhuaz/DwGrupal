/* ================================================================
   10) EFECTOS EXCLUSIVOS DE LA PÁGINA "NOSOTROS"
================================================================ */
document.addEventListener('DOMContentLoaded', () => {

  // --- Activar animaciones Reveal (ya compatibles con CSS existente)
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-shown');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  } else {
    // fallback sin IntersectionObserver
    revealEls.forEach(el => el.classList.add('is-shown'));
  }

  // --- Animación sutil del ícono al pasar el mouse (sección servicios)
  document.querySelectorAll('section .bi').forEach(icon => {
    icon.addEventListener('mouseenter', () => icon.style.transform = 'scale(1.2)');
    icon.addEventListener('mouseleave', () => icon.style.transform = 'scale(1)');
  });

  // --- Scroll automático al inicio al cargar la página
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
