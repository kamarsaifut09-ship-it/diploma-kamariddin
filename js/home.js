(() => {
  const api = window.weproApi;
  const axios = window.axios;
  const productGrid = document.querySelector('[data-products]');
  const categoryGrid = document.querySelector('[data-categories]');
  const featuredGrid = document.querySelector('[data-featured-products]');
  if (!productGrid && !categoryGrid && !featuredGrid) return;
  if (!axios) {
    [productGrid, categoryGrid, featuredGrid].forEach((target) => {
      if (target) {
        target.textContent = 'The catalog service could not be loaded.';
        target.setAttribute('aria-busy', 'false');
      }
    });
    return;
  }

  const normalize = (product) => ({
    id: product._id,
    name: product.title,
    price: Number(product.price),
    image: product.image,
  });
  const renderList = (target, items, createCard) => {
    if (!target) return;
    target.replaceChildren(...items.map(createCard));
    target.setAttribute('aria-busy', 'false');
  };
  const showError = (target, message) => {
    if (!target) return;
    target.textContent = message;
    target.setAttribute('aria-busy', 'false');
  };
  const createProductCard = (product) => {
    const card = document.createElement('article');
    card.className = 'product-card';
    const image = document.createElement('img');
    image.src = product.image;
    image.alt = product.name;
    image.loading = 'lazy';
    const info = document.createElement('div');
    info.className = 'product-card__info';
    const name = document.createElement('h3');
    name.textContent = product.name;
    const price = document.createElement('span');
    price.textContent = `$${product.price.toFixed(2)}`;
    info.append(name, price);
    card.append(image, info);
    const link = document.createElement('a');
    link.className = 'product-card__detail-link';
    link.href = `product-page.html?id=${encodeURIComponent(product.id)}`;
    link.setAttribute('aria-label', `View ${product.name} details`);
    card.append(link);
    return card;
  };
  const createCategoryCard = (category) => {
    const card = document.createElement('article');
    card.className = 'category-card';
    const image = document.createElement('img');
    image.src = category.image;
    image.alt = category.title;
    image.loading = 'lazy';
    const link = document.createElement('a');
    link.className = 'category-card__link';
    link.href = `products.html?category=${encodeURIComponent(category._id)}`;
    link.textContent = category.title;
    card.append(image, link);
    return card;
  };

  const tasks = [];
  if (productGrid) {
    tasks.push(axios.get(api.url('/products/bestsellers?limit=4'))
      .then(({ data }) => renderList(productGrid, (data.products || []).map(normalize), createProductCard))
      .catch(() => showError(productGrid, 'Products could not be loaded.')));
  }
  if (featuredGrid) {
    tasks.push(axios.get(api.url('/products/newest?limit=12'))
      .then(({ data }) => renderList(featuredGrid, (data.products || []).map(normalize), createProductCard))
      .catch(() => showError(featuredGrid, 'Featured products could not be loaded.')));
  }
  if (categoryGrid) {
    tasks.push(axios.get(api.url('/categories'))
      .then(({ data }) => renderList(categoryGrid, data.categories || [], createCategoryCard))
      .catch(() => showError(categoryGrid, 'Categories could not be loaded.')));
  }
  Promise.all(tasks);
})();
