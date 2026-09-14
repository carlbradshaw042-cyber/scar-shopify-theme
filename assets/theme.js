document.documentElement.classList.remove('no-js');

const body = document.body;
const drawer = document.querySelector('#CartDrawer');
const openCart = () => { if (!drawer) return; drawer.setAttribute('aria-hidden', 'false'); body.classList.add('drawer-open'); drawer.querySelector('[data-cart-close]')?.focus(); };
const closeCart = () => { if (!drawer) return; drawer.setAttribute('aria-hidden', 'true'); body.classList.remove('drawer-open'); };
document.querySelectorAll('[data-cart-open]').forEach((button) => button.addEventListener('click', openCart));
document.querySelectorAll('[data-cart-close]').forEach((button) => button.addEventListener('click', closeCart));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeCart(); });

const menuButton = document.querySelector('[data-menu-toggle]');
const menu = document.querySelector('#mobile-menu');
menuButton?.addEventListener('click', () => { const expanded = menuButton.getAttribute('aria-expanded') === 'true'; menuButton.setAttribute('aria-expanded', String(!expanded)); menu.hidden = expanded; });

const productSection = document.querySelector('[data-product-section]');
if (productSection) {
  const variants = JSON.parse(productSection.querySelector('[data-product-json]').textContent);
  const form = productSection.querySelector('[data-product-form]');
  const radios = [...form.querySelectorAll('[data-option-position]')];
  const idInput = form.querySelector('[data-variant-id]');
  const addButton = form.querySelector('[data-add-button]');
  const addText = form.querySelector('[data-add-text]');
  const selectedPrice = form.querySelector('[data-selected-price]');
  const moneyFormat = (cents) => new Intl.NumberFormat(document.documentElement.lang, { style: 'currency', currency: window.Shopify?.currency?.active || 'USD' }).format(cents / 100);
  radios.forEach((radio) => radio.addEventListener('change', () => {
    const selected = [];
    radios.filter((input) => input.checked).forEach((input) => { selected[Number(input.dataset.optionPosition) - 1] = input.value; });
    const variant = variants.find((item) => item.options.every((value, index) => value === selected[index]));
    if (!variant) { addButton.disabled = true; addText.textContent = 'Unavailable'; return; }
    idInput.value = variant.id;
    addButton.disabled = !variant.available;
    addText.textContent = variant.available ? 'Add to cart' : 'Sold out';
    selectedPrice.textContent = moneyFormat(variant.price);
    history.replaceState({}, '', `${location.pathname}?variant=${variant.id}`);
  }));
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); addButton.disabled = true;
    try {
      const response = await fetch(`${window.Shopify.routes.root}cart/add.js`, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) });
      if (!response.ok) throw new Error('Unable to add item');
      const cart = await fetch(`${window.Shopify.routes.root}cart.js`).then((result) => result.json());
      document.querySelectorAll('[data-cart-count]').forEach((el) => { el.textContent = cart.item_count; });
      const drawerResponse = await fetch(`${window.Shopify.routes.root}?section_id=cart-drawer`).then((result) => result.text());
      const parsed = new DOMParser().parseFromString(drawerResponse, 'text/html');
      const content = parsed.querySelector('[data-cart-content]');
      if (content) drawer.querySelector('[data-cart-content]').replaceWith(content);
      openCart();
    } catch (error) { addText.textContent = error.message; }
    finally { addButton.disabled = false; }
  });
}

document.querySelectorAll('[data-recommendations-url]').forEach(async (container) => {
  const html = await fetch(container.dataset.recommendationsUrl).then((response) => response.text());
  const section = new DOMParser().parseFromString(html, 'text/html').querySelector('.section-pad');
  if (section) container.replaceWith(section);
});

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
}

const overlayHeader = document.querySelector('.site-header--overlay');
if (overlayHeader) {
  const updateHeader = () => overlayHeader.classList.toggle('is-scrolled', window.scrollY > 24);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });
}

const sizeGuide = document.querySelector('[data-size-guide]');
let sizeGuideOpener;
const closeSizeGuide = () => {
  if (!sizeGuide) return;
  sizeGuide.setAttribute('aria-hidden', 'true');
  body.classList.remove('drawer-open');
  sizeGuideOpener?.focus();
};
document.querySelector('[data-size-guide-open]')?.addEventListener('click', (event) => {
  sizeGuideOpener = event.currentTarget;
  sizeGuide.setAttribute('aria-hidden', 'false');
  body.classList.add('drawer-open');
  sizeGuide.querySelector('[data-size-guide-close]')?.focus();
});
sizeGuide?.querySelectorAll('[data-size-guide-close]').forEach((button) => button.addEventListener('click', closeSizeGuide));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && sizeGuide?.getAttribute('aria-hidden') === 'false') closeSizeGuide(); });
