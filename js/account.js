(() => {
  const api = window.weproApi;
  const ordersGrid = document.querySelector('[data-orders]');
  const renderOrders = (orders) => {
    ordersGrid.replaceChildren();
    const entries = orders.flatMap((order) => order.items.map((item) => ({ order, item })));
    if (!entries.length) {
      const empty = document.createElement('p');
      empty.className = 'profile-orders__empty';
      empty.textContent = 'No orders yet.';
      ordersGrid.append(empty);
      return;
    }

    for (const { order, item } of entries) {
      const card = document.createElement('article');
      card.className = 'profile-order-card';
      const image = document.createElement('img');
      image.src = item.image;
      image.alt = item.name;
      const name = document.createElement('h3');
      name.textContent = item.name;
      card.append(image, name);
      ordersGrid.append(card);
    }
  };

  const loadAccount = async () => {
    try {
      const { user } = await api.request('/me');
      document.querySelector('.profile-name').textContent = [user.name, user.surname].filter(Boolean).join(' ');
      document.querySelector('.profile-contact').textContent = user.phone;
      document.querySelector('.profile-email').textContent = user.email;
      try {
        const { orders = [] } = await api.request('/orders');
        renderOrders(orders.map((order) => ({
          items: (order.items || []).map((item) => ({ name: item.title, image: item.image })),
        })));
      } catch (error) {
        if (error.status === 401) throw error;
        ordersGrid.textContent = 'Orders could not be loaded.';
      }
      if (new URLSearchParams(location.search).get('order') === 'placed') {
        document.querySelector('[data-order-confirmation]').hidden = false;
        history.replaceState(null, '', location.pathname);
      }
    } catch (error) {
      if (error.status === 401) location.replace(api.loginUrl('account.html'));
      else ordersGrid.textContent = 'Your profile could not be loaded. Try again later.';
    }
  };
  loadAccount();

  document.querySelector('.profile-logout').addEventListener('click', async (event) => {
    event.preventDefault();
    try { await api.request('/logout', { method: 'POST' }); }
    finally {
      api.clearToken();
      location.assign('login.html');
    }
  });
})();
