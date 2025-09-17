/* UT Contractor — main.js
   - Mobile menu (toggle, ESC/Outside close, basic focus trap)
   - Smooth scroll (with header offset & reduced-motion support)
   - Estimate form validation + mailto builder
   - Footer year & subtle header shadow
*/

(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------------------------------------
     Header shadow on scroll
  --------------------------------------- */
  const hdr = $('header');
  const onScroll = () => hdr && hdr.classList.toggle('header-scrolled', window.scrollY > 6);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------
     Mobile menu
  --------------------------------------- */
  const btn = $('.menu-btn');
  const mobile = $('#mobile-nav');

  const getFocusable = (root) =>
    $$('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])', root)
      .filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));

  let lastFocused = null;

  function openMenu() {
    if (!mobile) return;
    lastFocused = document.activeElement;
    mobile.classList.add('open');
    mobile.setAttribute('aria-hidden', 'false');
    btn?.setAttribute('aria-expanded', 'true');
    // focus first link
    const first = getFocusable(mobile)[0];
    first?.focus();
    document.addEventListener('keydown', trapTab);
    document.addEventListener('keydown', escClose);
    document.addEventListener('click', outsideClose, true);
  }

  function closeMenu() {
    if (!mobile) return;
    mobile.classList.remove('open');
    mobile.setAttribute('aria-hidden', 'true');
    btn?.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', trapTab);
    document.removeEventListener('keydown', escClose);
    document.removeEventListener('click', outsideClose, true);
    btn?.focus({ preventScroll: true });
    // restore focus if needed
    if (lastFocused && lastFocused instanceof HTMLElement) {
      lastFocused = null;
    }
  }

  function trapTab(e) {
    if (!mobile?.classList.contains('open') || e.key !== 'Tab') return;
    const focusables = getFocusable(mobile);
    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  function escClose(e) {
    if (e.key === 'Escape') closeMenu();
  }

  function outsideClose(e) {
    if (!mobile?.classList.contains('open')) return;
    if (mobile.contains(e.target) || btn?.contains(e.target)) return;
    closeMenu();
  }

  btn?.addEventListener('click', () => {
    mobile?.classList.contains('open') ? closeMenu() : openMenu();
  });

  /* ---------------------------------------
     Smooth scroll (with sticky header offset)
  --------------------------------------- */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function scrollToId(id) {
    const target = document.getElementById(id);
    if (!target) return;

    const headerH = hdr ? hdr.offsetHeight : 0;
    const rect = target.getBoundingClientRect();
    const y = rect.top + window.scrollY - headerH - 8; // 8px breathing room

    window.scrollTo({
      top: y < 0 ? 0 : y,
      behavior: prefersReduced ? 'auto' : 'smooth'
    });
  }

  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const raw = a.getAttribute('href') || '';
      const id = raw.slice(1);
      if (!id) return;
      const t = document.getElementById(id);
      if (!t) return;

      e.preventDefault();
      scrollToId(id);
      // close mobile menu after nav
      if (mobile?.classList.contains('open')) closeMenu();
    });
  });

  // If page opens with a hash, adjust to offset
  if (location.hash.length > 1) {
    requestAnimationFrame(() => scrollToId(location.hash.substring(1)));
  }

  /* ---------------------------------------
     Estimate form: validate + mailto builder
  --------------------------------------- */
  const form = $('#estimate-form');
  let submitting = false;

  function isEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }
  function cleanPhone(v) {
    return v.replace(/[^\d+()-\s]/g, '').trim();
  }

  form?.addEventListener('submit', e => {
    if (submitting) { e.preventDefault(); return; }

    const required = $$('#estimate-form [required]');
    for (const el of required) {
      if (!el.value || !el.value.trim()) {
        e.preventDefault();
        alert('Please fill all required fields (Name, Phone, Email, Service).');
        el.focus();
        return;
      }
    }

    const email = form.querySelector('[name="Email"]')?.value || '';
    const phone = form.querySelector('[name="Phone"]')?.value || '';
    if (!isEmail(email)) {
      e.preventDefault();
      alert('Please enter a valid email address.'); 
      form.querySelector('[name="Email"]')?.focus();
      return;
    }
    if (!cleanPhone(phone)) {
      e.preventDefault();
      alert('Please enter a valid phone number.');
      form.querySelector('[name="Phone"]')?.focus();
      return;
    }

    // Build a friendly mailto (subject + body) so all fields arrive
    const name = form.querySelector('[name="Name"]')?.value?.trim() || 'Estimate Request';
    const city = form.querySelector('[name="City"]')?.value || '';
    const zip = form.querySelector('[name="Zip"]')?.value || '';
    const service = form.querySelector('[name="Service"]')?.value || '';
    const budget = form.querySelector('[name="Budget"]')?.value || '';
    const desc = form.querySelector('[name="Description"]')?.value || '';

    const lines = [
      `Name: ${name}`,
      `Phone: ${cleanPhone(phone)}`,
      `Email: ${email}`,
      city ? `City: ${city}` : '',
      zip ? `ZIP: ${zip}` : '',
      service ? `Service: ${service}` : '',
      budget ? `Budget: ${budget}` : '',
      '',
      desc ? `Project details:\n${desc}` : ''
    ].filter(Boolean);

    // Respect existing action mailto: if present, use that address; else default
    const action = form.getAttribute('action');
    const to = (action && action.startsWith('mailto:'))
      ? action.replace(/^mailto:/i, '')
      : 'Utcontr@gmail.com';

    const subject = `UT Contractor — ${name}`;
    const body = lines.join('\n');

    // Send via mailto and prevent default submit (friendlier on most clients)
    e.preventDefault();
    submitting = true;
    window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    // allow another try after a short delay in case user cancels email client
    setTimeout(() => { submitting = false; }, 2000);
  });

  /* ---------------------------------------
     Footer year
  --------------------------------------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
