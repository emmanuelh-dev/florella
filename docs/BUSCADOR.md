# Buscador de direcciones en Cloudflare Workers

El campo «Dirección de envío o Capillas» consulta `/api/address-search` en el mismo dominio. El cliente puede seleccionar una sugerencia con clic, Tab/Enter o flechas; el texto elegido se conserva en el pedido de WhatsApp. Ante errores se permite escribir la dirección manualmente.

`worker.js` lee el Secret **TRACCAR_TOKEN** y consulta exclusivamente `https://gps.bysmax.com/api/routing/search`. La región está en la constante **REGION = 'Nuevo León'**: no se necesita SEARCH_REGION. El navegador no puede sustituir esa zona. El token no se incluye en los assets, las respuestas ni Git.

`wrangler.jsonc` configura el módulo y los assets de `dist`, con ejecución del Worker para `/api/address-search`; las demás rutas se sirven mediante ASSETS. Mantener el nombre del Worker existente en Cloudflare si difiere de `florella`. Compilar con `npm run build` y publicar con Wrangler desde la integración existente. Confirmar que el despliegue lee este archivo y ejecuta el módulo: una publicación sólo de assets no habilita el endpoint. El Secret debe estar en el entorno que atiende el dominio, incluidas previews si se usan. No requiere un servicio Node, CORS ni variables públicas.

El límite de cinco solicitudes/segundo y cuatro concurrentes es por instancia del Worker, no global. El presupuesto de Google y su bloqueo inicial siguen en Traccar. El filtro regional central se basa en componentes de dirección, no en polígonos.

## Validación

`npm test`: pruebas existentes y pruebas aisladas del Worker (secret saliente, región fija, entrada inválida, assets, filtrado de campos y errores sin exposición interna). `scripts/check-address-search.mjs`: navegador con respuestas interceptadas en escritorio/móvil y claro/oscuro; selección por teclado y escritura manual tras errores. Las capturas están en `docs/evidencias/buscador/`.

12 pruebas funcionales y 6 comprobaciones del build pasan. Capturas de los cuatro perfiles inspeccionadas.

`astro build` se comprobó con los snapshots existentes, sin sincronizar el catálogo real. No se usó la API de producción como backend de pruebas ni se verificaron los permisos reales de la cuenta. No se realizó una publicación manual en Cloudflare; un push puede activar el pipeline configurado por el propietario. El Secret fue actualizado por el propietario; su vigencia se administra en Traccar.

## Diagnóstico de consulta

Los errores 503 incluyen un `code` seguro: `UPSTREAM_HTTP_<estado>`, `UPSTREAM_TIMEOUT`, `UPSTREAM_CONNECTION_FAILED` o `UPSTREAM_INVALID_RESPONSE`. El mismo código aparece en logs de Cloudflare; no registra token, consulta ni cuerpo de la respuesta. El 23 de octubre se confirmó que el secret estaba presente y el token actualizado era aceptado por Traccar; una consulta operativa directa devolvió Capillas del Carmen con HTTP 200. La conexión desde el Worker seguía pendiente de diagnóstico con esta instrumentación.

## Corrección del 503 y del carrito

El Worker usaba `redirect: 'error'`, que Cloudflare no implementa y rechaza con TypeError antes de contactar al servidor. Se cambió a `manual`: las respuestas 3xx se rechazan por la comprobación HTTP existente sin reenviar el token. Referencia: https://developers.cloudflare.com/workers/runtime-apis/request/#properties. Una prueba comprueba explícitamente este comportamiento.

El carrito restaura la imagen del producto actual cuando está en el catálogo de la página, en lugar de preferir la URL con hash guardada antes de un despliegue. Conserva cantidades y pedido. La prueba de navegador reproduce un carrito con imagen antigua y verifica la recuperación; productos ausentes del catálogo de la página conservan la imagen guardada.
