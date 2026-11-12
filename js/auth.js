(() => {
  const form = document.querySelector('[data-auth-form]');
  if (!form) return;

  const api = window.weproApi;
  const errorNode = document.querySelector('[data-auth-error]');
  const returnTo = api.safeReturnTo(new URLSearchParams(location.search).get('returnTo'));
  const registering = form.dataset.authForm === 'register';
  const contextNode = document.querySelector('[data-auth-context]');
  if (returnTo === 'bag.html' && contextNode) {
    contextNode.textContent = registering ? 'Create an account to view your bag.' : 'Log in to view your bag.';
    contextNode.hidden = false;
  }
  const switchLink = form.querySelector('[data-auth-switch]');
  if (switchLink) {
    const page = switchLink.getAttribute('href').split('?')[0];
    switchLink.href = `${page}?returnTo=${encodeURIComponent(returnTo)}`;
  }

  const showError = (message) => {
    errorNode.textContent = message;
    errorNode.hidden = false;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorNode.hidden = true;
    const data = new FormData(form);
    if (registering && data.get('password') !== data.get('password-confirm')) {
      showError('Passwords do not match.');
      return;
    }

    const body = registering
      ? { name: data.get('name'), surname: data.get('surname'), phone: data.get('phone'), email: data.get('email'), password: data.get('password') }
      : { email: data.get('email'), password: data.get('password') };
    try {
      const result = await api.request(registering ? '/register' : '/login', { method: 'POST', body });
      api.saveToken(result.token);
      location.assign(returnTo);
    } catch (error) {
      showError(error.message);
    }
  });

  if (api.readToken()) {
    const controls = form.querySelectorAll('input, button[type="submit"]');
    controls.forEach((control) => { control.disabled = true; });
    api.request('/me')
      .then(() => location.replace(returnTo))
      .catch(() => controls.forEach((control) => { control.disabled = false; }));
  }
})();
