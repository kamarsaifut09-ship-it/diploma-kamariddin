(() => {
  const list = document.querySelector('[data-bag-items]');
  const totalNode = document.querySelector('[data-bag-total]');
  if (!list || !totalNode) return;

  const api = window.weproApi;
  const checkout = document.querySelector('[data-checkout]');
  const notice = document.querySelector('[data-checkout-notice]');
  const money = (amount) => `$${Number(amount).toFixed(2)}`;
  const runCartAction = async (button, action) => {
    button.disabled = true;
    notice.hidden = true;
    try {
      await action();
    } catch (error) {
      notice.textContent = error.message;
      notice.hidden = false;
    } finally {
      if (button.isConnected) button.disabled = false;
    }
  };

  const render = (cart) => {
    list.replaceChildren();
    totalNode.textContent = money(cart.total);
    checkout.disabled = cart.items.length === 0;

    if (!cart.items.length) {
      const empty = document.createElement('p');
      empty.className = 'bag-empty';
      empty.textContent = 'Your bag is empty.';
      list.append(empty);
      return;
    }

    for (const item of cart.items) {
      const row = document.createElement('article');
      row.className = 'bag-item';
      const image = document.createElement('img');
      image.className = 'bag-item__image';
      image.src = item.image;
      image.alt = item.name;
      const details = document.createElement('div');
      details.className = 'bag-item__details';
      const name = document.createElement('h2');
      name.textContent = item.name;
      const price = document.createElement('p');
      price.textContent = money(item.price);
      details.append(name, price);

      const remove = document.createElement('button');
      remove.className = 'bag-item__remove';
      remove.type = 'button';
      remove.setAttribute('aria-label', `Remove ${item.name} from bag`);
      remove.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m-9 0 1 13h10l1-13M10 10v7m4-7v7"/></svg>';
      remove.addEventListener('click', () => runCartAction(remove, () => window.removeFromBag(item.id)));

      const quantity = document.createElement('div');
      quantity.className = 'bag-quantity';
      const decrease = document.createElement('button');
      decrease.type = 'button';
      decrease.textContent = '−';
      decrease.setAttribute('aria-label', `Decrease ${item.name} quantity`);
      decrease.disabled = item.quantity <= 1;
      decrease.addEventListener('click', () => runCartAction(decrease, () => window.updateBagItem(item.id, item.quantity - 1)));
      const value = document.createElement('span');
      value.textContent = String(item.quantity);
      value.setAttribute('aria-label', 'Quantity');
      const increase = document.createElement('button');
      increase.type = 'button';
      increase.textContent = '+';
      increase.setAttribute('aria-label', `Increase ${item.name} quantity`);
      increase.disabled = item.quantity >= 20;
      increase.addEventListener('click', () => runCartAction(increase, () => window.updateBagItem(item.id, item.quantity + 1)));
      quantity.append(decrease, value, increase);
      row.append(image, details, remove, quantity);
      list.append(row);
    }
  };

  checkout.addEventListener('click', async () => {
    checkout.disabled = true;
    notice.hidden = true;
    try {
      await window.placeOrder();
      location.assign('account.html?order=placed');
    } catch (error) {
      if (error.status === 401) location.assign(api.loginUrl('bag.html'));
      else {
        notice.textContent = error.message;
        notice.hidden = false;
        checkout.disabled = false;
      }
    }
  });

  window.addEventListener('bag:updated', (event) => render(event.detail.cart));
  window.getBag()
    .then(render)
    .catch((error) => {
      if (error.status === 401) location.replace(api.loginUrl('bag.html'));
      else {
        list.textContent = 'Your bag could not be loaded.';
        checkout.disabled = true;
      }
    });
})();
