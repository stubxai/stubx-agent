# Contribuir

El correo público es stubxai.hq@gmail.com. La cuenta prevista en GitHub es @stubxai.

1. No añadas wallets, claves, firmas, custodia ni escritura en la red.
2. No añadas dependencias de ejecución. Si hace falta una herramienta de desarrollo, dilo en el PR y actualiza el test que fija la lista.
3. Un límite nuevo se escribe en `src/limits.ts`, en `policy/limits.json` y en `LIMITS.md`, con un test que intenta violarlo y comprueba el rechazo.
4. No marques casillas del PPM. `ppm:print` debe seguir siendo honesto.
5. `npm ci && npm run typecheck && npm test && npm run ppm:print` tiene que pasar.
6. No subas secretos. Ni de prueba realistas.

Los textos de cara al público van primero en español, con un resumen corto en inglés.

## English

Do not add signing, custody, or network writes. Keep runtime dependencies empty. New limits need a failing attempt in tests and the same text in `LIMITS.md` and `policy/limits.json`. Do not mark PPM boxes.
