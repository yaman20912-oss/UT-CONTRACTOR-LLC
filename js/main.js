/* UT Contractor — main.js
   Handles: mobile menu toggle, smooth scroll for anchor links,
   simple form validation + mailto guard.
*/

// 1) Mobile nav toggle
const btn = document.querySelector('.menu-btn');
const mobile = document.getElementById('mobile-nav');
btn?.addEventListener('click', () => {
  mobile?.classList.toggle('open');
  btn.setAttribute('aria-expanded', mobile.classList.contains('open'));
});

// 2) Smooth-scroll for on-page anchors (nav links)
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      mobile?.classList.remove('open');
      btn?.setAttribute('aria-expanded', 'false');
    }
  });
});

// 3) Simple client-side validation for the estimate form
const form = document.getElementById('estimate-form');
form?.addEventListener('submit', (e) => {
  const required = form.querySelectorAll('[required]');
  for (const el of required) {
    if (!el.value.trim()) {
      e.preventDefault();
      alert('Please fill all required fields (Name, Phone, Email, Service).');
      el.focus();
      return;
    }
  }

  // Optional: guard so mailto opens with a subject line
  if (form.getAttribute('action')?.startsWith('mailto:')) {
    const name = form.querySelector('[name="Name"]')?.value || 'Estimate Request';
    form.setAttribute('action', form.getAttribute('action') + `?subject=UT Contractor — ${encodeURIComponent(name)}`);
  }
});

// 4) Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
