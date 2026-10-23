(() => {
  'use strict';
  const input = document.querySelector('[name="direccion"]');
  const results = document.querySelector('#address-results');
  const status = document.querySelector('#address-status');
  if (!input || !results || !status) return;
  let timer;
  let controller;
  let selected = '';
  input.addEventListener('input', () => {
    clearTimeout(timer);
    controller?.abort();
    results.replaceChildren();
    results.hidden = true;
    delete input.dataset.latitude;
    delete input.dataset.longitude;
    const query = input.value.trim();
    status.textContent = '';
    if (query.length < 3 || query === selected) return;
    const request = new AbortController();
    controller = request;
    timer = setTimeout(async () => {
      status.textContent = 'Buscando direcciones…';
      try {
        const response = await fetch(`/api/address-search?${new URLSearchParams({ q: query })}`, { signal: request.signal });
        if (!response.ok) throw new Error();
        const places = await response.json();
        if (request.signal.aborted) return;
        status.textContent = places.length ? 'Selecciona una dirección o continúa escribiendo.' : 'Sin coincidencias. Puedes escribir la dirección completa.';
        places.forEach((place) => {
          const item = document.createElement('li');
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'w-full px-3 py-2 text-left text-sm text-ink hover:bg-page focus-visible:outline-2 focus-visible:outline-wine';
          button.textContent = place.label;
          button.addEventListener('click', () => {
            // El servicio no informa si las coordenadas corresponden al número exterior.
            if (/\d/.test(query)) {
              selected = query;
              input.value = query;
              delete input.dataset.latitude;
              delete input.dataset.longitude;
              results.replaceChildren();
              results.hidden = true;
              status.textContent = 'El resultado no confirma el número. Conservamos tu dirección; agrega referencias para la entrega.';
              input.focus();
              return;
            }
            selected = place.label;
            input.value = selected;
            input.dataset.latitude = String(place.latitude);
            input.dataset.longitude = String(place.longitude);
            results.replaceChildren();
            results.hidden = true;
            status.textContent = 'Dirección seleccionada.';
            input.focus();
          });
          item.append(button);
          results.append(item);
        });
        results.hidden = places.length === 0;
      } catch {
        if (!request.signal.aborted) status.textContent = 'No pudimos buscar. Puedes escribir la dirección manualmente.';
      }
    }, 350);
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' && !results.hidden) {
      event.preventDefault();
      results.querySelector('button')?.focus();
    }
    if (event.key === 'Escape') { controller?.abort(); clearTimeout(timer); results.hidden = true; status.textContent = ''; }
  });
  results.addEventListener('keydown', (event) => {
    const buttons = [...results.querySelectorAll('button')];
    const index = buttons.indexOf(document.activeElement);
    if (event.key === 'Escape') { results.hidden = true; input.focus(); }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      buttons[(index + (event.key === 'ArrowDown' ? 1 : buttons.length - 1)) % buttons.length]?.focus();
    }
  });
})();
