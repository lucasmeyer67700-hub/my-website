/* Gestion du panier via localStorage — indépendant de tout backend. */
const CART_KEY = "boutique_cart";
const FREE_SHIPPING_THRESHOLD = 80;
const SHIPPING_COST = 4.90;

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(id, qty = 1) {
  const cart = getCart();
  const existing = cart.find(item => item.id === Number(id));
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id: Number(id), qty });
  }
  saveCart(cart);
}

function updateCartQty(id, qty) {
  let cart = getCart();
  if (qty <= 0) {
    cart = cart.filter(item => item.id !== Number(id));
  } else {
    const item = cart.find(item => item.id === Number(id));
    if (item) item.qty = qty;
  }
  saveCart(cart);
}

function removeFromCart(id) {
  const cart = getCart().filter(item => item.id !== Number(id));
  saveCart(cart);
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function getCartDetails() {
  return getCart().map(item => {
    const product = getProductById(item.id);
    return product ? { ...product, qty: item.qty, lineTotal: product.price * item.qty } : null;
  }).filter(Boolean);
}

function getCartSubtotal() {
  return getCartDetails().reduce((sum, item) => sum + item.lineTotal, 0);
}

function getShippingCost() {
  const subtotal = getCartSubtotal();
  if (subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return SHIPPING_COST;
}

function getCartTotal() {
  return getCartSubtotal() + getShippingCost();
}

function updateCartBadge() {
  document.querySelectorAll("[data-cart-count]").forEach(el => {
    const count = getCartCount();
    el.textContent = count;
    el.style.display = count > 0 ? "inline-flex" : "none";
  });
}

document.addEventListener("DOMContentLoaded", updateCartBadge);
