(() => {
  const quantityNode = document.querySelector('[data-quantity]');
  const reviewsNode = document.querySelector('[data-reviews]');
  if (!quantityNode || !reviewsNode) return;

  const api = window.weproApi;
  const axios = window.axios;
  const titleNode = document.querySelector('#product-title');
  const priceNode = document.querySelector('.product-detail__price');
  const descriptionNode = document.querySelector('.product-detail__description');
  const mainImage = document.querySelector('.product-detail__image');
  const reviewCount = document.querySelector('[data-review-count]');
  const addButton = document.querySelector('[data-add-to-cart]');
  const cartNotice = document.querySelector('[data-cart-notice]');
  const dialog = document.querySelector('[data-review-dialog]');
  const form = document.querySelector('[data-review-form]');
  const commentInput = form.querySelector('textarea');
  const successContent = document.querySelector('[data-review-success]');
  const formError = document.querySelector('[data-review-error]');
  const quantityLimit = 20;
  let quantity = 1;
  let currentProduct = null;
  let comments = [];
  let totalComments = 0;

  const formatDate = (dateValue) => {
    const date = new Date(dateValue);
    return Number.isNaN(date.getTime())
      ? ''
      : `Posted on ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
  };
  const renderComments = () => {
    reviewsNode.replaceChildren(...comments.map((comment) => {
      const card = document.createElement('article');
      card.className = 'review-card';
      const author = document.createElement('h3');
      author.className = 'review-card__author';
      author.textContent = comment.author || 'Customer';
      const tick = document.createElement('span');
      tick.className = 'review-verified-mark';
      tick.setAttribute('aria-hidden', 'true');
      tick.textContent = '✓';
      author.append(tick);
      const body = document.createElement('p');
      body.className = 'review-card__text';
      body.textContent = comment.text;
      const date = document.createElement('p');
      date.className = 'review-card__date';
      date.textContent = formatDate(comment.at);
      card.append(author, body, date);
      return card;
    }));
    if (!comments.length) {
      const empty = document.createElement('p');
      empty.className = 'review-empty';
      empty.textContent = 'No comments yet.';
      reviewsNode.append(empty);
    }
    reviewCount.textContent = `(${totalComments})`;
  };
  const renderProduct = (product) => {
    currentProduct = {
      id: product._id,
      name: product.title,
      price: Number(product.price),
      image: product.image,
    };
    titleNode.textContent = currentProduct.name;
    priceNode.textContent = `$${currentProduct.price.toFixed(2)}`;
    document.title = `${currentProduct.name} | WEPRO`;
    descriptionNode.hidden = true;
    mainImage.src = currentProduct.image;
    mainImage.alt = currentProduct.name;
    document.querySelectorAll('.product-thumbnail img').forEach((image) => {
      image.src = currentProduct.image;
      image.alt = '';
    });
    addButton.disabled = false;
    comments = product.comments || [];
    totalComments = Number(product.commentsCount) || comments.length;
    renderComments();
  };
  const getProduct = async () => {
    const requestedId = new URLSearchParams(location.search).get('id');
    const id = requestedId && /^[a-f\d]{24}$/i.test(requestedId) ? requestedId : '';
    const response = id
      ? await axios.get(api.url(`/products/${encodeURIComponent(id)}`))
      : await axios.get(api.url('/products?limit=1'));
    const product = response.data.product || response.data.products?.[0];
    if (!product) throw new Error('Product could not be found.');
    if (!product.comments) {
      const detail = await axios.get(api.url(`/products/${encodeURIComponent(product._id)}`));
      return detail.data.product;
    }
    return product;
  };

  const loadProduct = async () => {
    try {
      if (!axios) throw new Error('The product service could not be loaded.');
      const product = await getProduct();
      renderProduct(product);
      if (!new URLSearchParams(location.search).has('id')) {
        history.replaceState(null, '', `${location.pathname}?id=${encodeURIComponent(product._id)}`);
      }
      if (new URLSearchParams(location.search).get('review') === '1') {
        if (api.readToken()) dialog.showModal();
        else location.replace(api.loginUrl(`product-page.html?id=${product._id}&review=1`));
      }
    } catch (error) {
      titleNode.textContent = error.response?.data?.message || error.message || 'Product could not be loaded.';
      addButton.disabled = true;
      reviewsNode.textContent = 'Comments could not be loaded.';
    }
  };

  document.querySelector('[data-quantity-decrease]').addEventListener('click', () => {
    quantity = Math.max(1, quantity - 1);
    quantityNode.textContent = String(quantity);
  });
  document.querySelector('[data-quantity-increase]').addEventListener('click', () => {
    quantity = Math.min(quantityLimit, quantity + 1);
    quantityNode.textContent = String(quantity);
  });
  addButton.addEventListener('click', async () => {
    if (!currentProduct) return;
    try {
      await window.addToBag(currentProduct, quantity);
      if (!api.readToken()) return;
      cartNotice.textContent = 'Added to bag';
      cartNotice.style.display = 'block';
      addButton.textContent = 'Added to bag';
      window.setTimeout(() => { addButton.textContent = 'Add to cart'; }, 1400);
    } catch (error) {
      cartNotice.textContent = error.message;
      cartNotice.style.display = 'block';
    }
  });

  document.querySelectorAll('.product-thumbnail').forEach((thumbnail) => {
    thumbnail.addEventListener('click', () => {
      document.querySelectorAll('.product-thumbnail').forEach((item) => {
        const selected = item === thumbnail;
        item.classList.toggle('is-selected', selected);
        item.setAttribute('aria-pressed', String(selected));
      });
      mainImage.src = thumbnail.querySelector('img').src;
    });
  });

  const reviewReturn = () => `product-page.html?id=${currentProduct.id}&review=1`;
  document.querySelector('[data-open-review]').addEventListener('click', () => {
    if (!api.readToken()) {
      location.assign(api.loginUrl(reviewReturn()));
      return;
    }
    dialog.showModal();
  });
  const resetDialog = () => {
    form.hidden = false;
    successContent.hidden = true;
    dialog.classList.remove('is-success');
    form.reset();
  };
  document.querySelector('[data-close-success]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', resetDialog);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    formError.hidden = true;
    if (!api.readToken()) {
      dialog.close();
      location.assign(api.loginUrl(reviewReturn()));
      return;
    }
    const text = String(new FormData(form).get('comment') || '').trim();
    if (text.length < 2 || text.length > 300) {
      formError.textContent = 'Write a comment between 2 and 300 characters.';
      formError.hidden = false;
      return;
    }
    try {
      const result = await api.request(`/products/${encodeURIComponent(currentProduct.id)}/comments`, { method: 'POST', body: { text } });
      const added = result.comment;
      comments.unshift(added);
      totalComments += 1;
      renderComments();
      form.hidden = true;
      successContent.hidden = false;
      dialog.classList.add('is-success');
    } catch (error) {
      if (error.status === 401) {
        dialog.close();
        location.assign(api.loginUrl(reviewReturn()));
      } else {
        formError.textContent = error.message;
        formError.hidden = false;
      }
    }
  });
  commentInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  addButton.disabled = true;
  reviewsNode.setAttribute('aria-busy', 'true');
  loadProduct().finally(() => reviewsNode.setAttribute('aria-busy', 'false'));
})();
