/* Swagger UI local para a API Laravel/Sanctum do RockerStore. */
(() => {
  function csrfCookie() {
    const cookie = document.cookie
      .split('; ')
      .find((part) => part.startsWith('XSRF-TOKEN='));

    return cookie
      ? decodeURIComponent(cookie.substring('XSRF-TOKEN='.length))
      : null;
  }

  window.ui = SwaggerUIBundle({
    url: '/api/docs/openapi.yaml',
    dom_id: '#swagger-ui',
    deepLinking: true,
    displayRequestDuration: true,
    filter: true,
    validatorUrl: null,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset,
    ],
    layout: 'StandaloneLayout',
    requestInterceptor: async (request) => {
      const target = new URL(request.url, window.location.origin);

      if (target.origin !== window.location.origin) {
        return request;
      }

      request.credentials = 'include';

      const method = (request.method || 'GET').toUpperCase();

      if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        const csrfResponse = await fetch('/sanctum/csrf-cookie', {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });

        if (!csrfResponse.ok) {
          throw new Error('Não foi possível inicializar o cookie CSRF.');
        }

        const token = csrfCookie();

        if (!token) {
          throw new Error('Cookie XSRF-TOKEN ausente. Confirme o mesmo host e a configuração Sanctum.');
        }

        request.headers = request.headers || {};
        request.headers['X-XSRF-TOKEN'] = token;
      }

      return request;
    },
  });
})();
