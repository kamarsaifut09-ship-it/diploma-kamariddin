(() => {
  const baseUrl = 'https://api.wepro.uz/sandbox-shop';
  const tokenKey = 'sandbox-shop-token';
  const allowedPages = new Set(['home.html', 'products.html', 'product-page.html', 'account.html', 'bag.html']);
  const readToken = () => localStorage.getItem(tokenKey);
  const saveToken = (token) => localStorage.setItem(tokenKey, token);
  const clearToken = () => localStorage.removeItem(tokenKey);

  const url = (path) => `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const request = async (path, options = {}) => {
    const headers = new Headers(options.headers || {});
    const token = readToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (options.body && typeof options.body !== 'string') {
      headers.set('Content-Type', 'application/json');
      options.body = JSON.stringify(options.body);
    }

    let response;
    try {
      response = await fetch(url(path), { ...options, headers, cache: 'no-store' });
    } catch {
      throw new Error('Could not connect to the Sandbox Shop API. Check your internet connection.');
    }
    const result = await response.json().catch(() => ({}));
    if (response.status === 401 && token) clearToken();
    if (!response.ok) {
      const error = new Error(result.message || result.error || `Request failed (${response.status}).`);
      error.status = response.status;
      throw error;
    }
    return result;
  };

  const safeReturnTo = (target) => {
    try {
      const parsed = new URL(target || 'account.html', location.origin);
      const page = parsed.pathname.split('/').pop();
      if (parsed.origin !== location.origin || !allowedPages.has(page)) return 'account.html';
      const params = new URLSearchParams();
      if (page === 'product-page.html' && /^[a-f\d]{24}$/i.test(parsed.searchParams.get('id') || '')) {
        params.set('id', parsed.searchParams.get('id'));
        if (parsed.searchParams.get('review') === '1') params.set('review', '1');
      }
      if (page === 'account.html' && parsed.searchParams.get('order') === 'placed') params.set('order', 'placed');
      const search = params.toString();
      return `${page}${search ? `?${search}` : ''}`;
    } catch {
      return 'account.html';
    }
  };

  const loginUrl = (returnTo = `${location.pathname.split('/').pop()}${location.search}`) =>
    `login.html?returnTo=${encodeURIComponent(safeReturnTo(returnTo))}`;

  window.weproApi = { baseUrl, url, request, readToken, saveToken, clearToken, loginUrl, safeReturnTo };
})();
