(() => {
  const api = window.weproApi;
  const axios = window.axios;
  const productGrid = document.querySelector('[data-all-products]');
  if (!productGrid) return;
  if (!axios) {
    productGrid.textContent = 'The catalog service could not be loaded.';
    productGrid.setAttribute('aria-busy', 'false');
    return;
  }

  const categoryFilters = document.querySelector('[data-category-filters]');
  const minInput = document.querySelector('[data-min-price]');
  const maxInput = document.querySelector('[data-max-price]');
  const minOutput = document.querySelector('[data-min-output]');
  const maxOutput = document.querySelector('[data-max-output]');
  const priceRange = document.querySelector('[data-price-range]');
  const priceValues = document.querySelector('.price-values');
  const rangeFill = document.querySelector('[data-range-fill]');
  const applyButton = document.querySelector('[data-apply-filters]');
  const priceHeading = document.querySelector('.price-filter__heading');
  const filtersToggle = document.querySelector('.filters-toggle');
  const filterPanel = document.querySelector('#product-filter-panel');
  const filterBackdrop = document.querySelector('[data-filter-backdrop]');
  const mobileLayout = window.matchMedia('(max-width: 600px)');
  let selectedCategory = new URLSearchParams(location.search).get('category') || '';
  let appliedMin = Number(minInput.value);
  let appliedMax = Number(maxInput.value);

  const setFiltersOpen = (open) => {
    filtersToggle.setAttribute('aria-expanded', String(open));
    filtersToggle.setAttribute('aria-label', open ? 'Hide filters' : 'Show filters');
    filterPanel.classList.toggle('is-open', open);
    filterPanel.setAttribute('role', open ? 'dialog' : 'complementary');
    filterPanel.setAttribute('aria-modal', String(open));
    filterBackdrop.hidden = !open;
    document.body.classList.toggle('filters-open', open);
    if (open) filterPanel.querySelector('button')?.focus();
    else if (mobileLayout.matches) filtersToggle.focus();
    if (open) requestAnimationFrame(updatePriceLabels);
  };

  const createProductCard = (item) => {
    const product = { id: item._id, name: item.title, price: Number(item.price), image: item.image };
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

  const loadProducts = async () => {
    productGrid.setAttribute('aria-busy', 'true');
    productGrid.textContent = 'Loading products…';
    const params = new URLSearchParams({ minPrice: String(appliedMin), maxPrice: String(appliedMax), page: '1', limit: '12' });
    if (selectedCategory) params.set('category', selectedCategory);
    try {
      const { data } = await axios.get(api.url(`/products?${params}`));
      const cards = (data.products || []).map(createProductCard);
      productGrid.replaceChildren(...cards);
      if (!cards.length) productGrid.textContent = 'No products found.';
    } catch (error) {
      productGrid.textContent = error.response?.data?.message || 'Products could not be loaded.';
    }
    productGrid.setAttribute('aria-busy', 'false');
  };

  const updatePriceLabels = () => {
    const min = Number(minInput.value);
    const max = Number(maxInput.value);
    minOutput.value = `$${min}`;
    maxOutput.value = `$${max}`;

    const width = priceRange.getBoundingClientRect().width;
    if (!width) return;
    const thumbSize = parseFloat(getComputedStyle(priceRange).getPropertyValue('--thumb-size')) || 18;
    const position = (value) => thumbSize / 2 + (width - thumbSize) * value / 100;
    const labelPosition = (center, label) => Math.max(label.offsetWidth / 2, Math.min(width - label.offsetWidth / 2, center));
    const minPosition = position(min);
    const maxPosition = position(max);
    const minLabelPosition = labelPosition(minPosition, minOutput);
    const maxLabelPosition = labelPosition(maxPosition, maxOutput);

    minOutput.style.left = `${minLabelPosition}px`;
    maxOutput.style.left = `${maxLabelPosition}px`;
    priceValues.classList.toggle('is-overlapping', maxLabelPosition - minLabelPosition < (minOutput.offsetWidth + maxOutput.offsetWidth) / 2 + 4);
    rangeFill.style.left = `${minPosition}px`;
    rangeFill.style.width = `${Math.max(0, maxPosition - minPosition)}px`;
  };

  minInput.addEventListener('input', () => {
    if (+minInput.value > +maxInput.value) minInput.value = maxInput.value;
    updatePriceLabels();
  });
  maxInput.addEventListener('input', () => {
    if (+maxInput.value < +minInput.value) maxInput.value = minInput.value;
    updatePriceLabels();
  });
  window.addEventListener('resize', updatePriceLabels, { passive: true });
  applyButton.addEventListener('click', () => {
    appliedMin = Number(minInput.value);
    appliedMax = Number(maxInput.value);
    loadProducts();
    if (mobileLayout.matches) setFiltersOpen(false);
  });
  priceHeading.addEventListener('click', () => {
    const expanded = priceHeading.getAttribute('aria-expanded') === 'true';
    priceHeading.setAttribute('aria-expanded', String(!expanded));
    document.querySelector('#price-controls').hidden = expanded;
  });
  filtersToggle.addEventListener('click', () => {
    setFiltersOpen(filtersToggle.getAttribute('aria-expanded') !== 'true');
  });
  filterBackdrop.addEventListener('click', () => setFiltersOpen(false));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && filtersToggle.getAttribute('aria-expanded') === 'true') setFiltersOpen(false);
  });
  mobileLayout.addEventListener('change', () => {
    if (!mobileLayout.matches && filtersToggle.getAttribute('aria-expanded') === 'true') setFiltersOpen(false);
  });

  axios.get(api.url('/categories'))
    .then(({ data }) => {
      const buttons = (data.categories || []).map((category) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'category-filter';
        button.textContent = category.title;
        button.setAttribute('aria-pressed', String(category._id === selectedCategory));
        const arrow = document.createElement('span');
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = '›';
        button.append(arrow);
        button.addEventListener('click', () => {
          selectedCategory = selectedCategory === category._id ? '' : category._id;
          categoryFilters.querySelectorAll('button').forEach((item) => {
            item.setAttribute('aria-pressed', String(item === button && selectedCategory !== ''));
          });
          loadProducts();
        });
        return button;
      });
      categoryFilters.replaceChildren(...buttons);
      categoryFilters.setAttribute('aria-busy', 'false');
      loadProducts();
    })
    .catch((error) => {
      categoryFilters.textContent = error.response?.data?.message || 'Categories could not be loaded.';
      categoryFilters.setAttribute('aria-busy', 'false');
      loadProducts();
    });

  updatePriceLabels();
})();
