(() => {
  const api = window.weproApi;
  const countNode = document.querySelector('[data-cart-count]');
  const normalizeCart = (response) => {
    const cart = response.cart || response;
    const items = (cart.items || []).map((item) => ({
      id: item.productId,
      name: item.title,
      price: Number(item.price),
      image: item.image,
      quantity: Number(item.qty),
      sum: Number(item.sum),
    }));
    return { items, total: Number(cart.total) || 0, count: items.reduce((sum, item) => sum + item.quantity, 0) };
  };
  const publish = (rawCart) => {
    const cart = normalizeCart(rawCart);
    if (countNode) countNode.textContent = String(cart.count);
    window.dispatchEvent(new CustomEvent('bag:updated', { detail: { cart } }));
    return cart;
  };
  const saveCartChange = async (path, options) => {
    const result = await api.request(path, options);
    return publish(Array.isArray((result.cart || result).items) ? result : await api.request('/cart'));
  };
  const redirectOnAuthError = (error, returnTo) => {
    if (error.status !== 401) return false;
    location.assign(api.loginUrl(returnTo));
    return true;
  };

  window.getBag = async () => normalizeCart(await api.request('/cart'));
  window.addToBag = async (product, quantity = 1) => {
    if (!api.readToken()) {
      location.assign(api.loginUrl(`product-page.html?id=${product.id}`));
      return;
    }
    try {
      return await saveCartChange('/cart', { method: 'POST', body: { productId: product.id, qty: quantity } });
    } catch (error) {
      if (!redirectOnAuthError(error, `product-page.html?id=${product.id}`)) throw error;
    }
  };
  window.updateBagItem = async (id, quantity) => {
    try {
      return await saveCartChange(`/cart/${encodeURIComponent(id)}`, { method: 'PATCH', body: { qty: quantity } });
    } catch (error) {
      if (!redirectOnAuthError(error, 'bag.html')) throw error;
    }
  };
  window.removeFromBag = async (id) => {
    try {
      return await saveCartChange(`/cart/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (error) {
      if (!redirectOnAuthError(error, 'bag.html')) throw error;
    }
  };
  window.placeOrder = () => api.request('/orders', { method: 'POST' });

  const refreshCount = async () => {
    if (!countNode) return;
    if (!api.readToken()) {
      countNode.textContent = '0';
      return;
    }
    try {
      countNode.textContent = String((await window.getBag()).count);
    } catch {
      countNode.textContent = '0';
    }
  };
  refreshCount();
  window.setInterval(refreshCount, 30000);
})();
