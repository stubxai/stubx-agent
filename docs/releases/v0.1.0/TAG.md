# Tag `v0.1.0`

Estado: **preparado y no creado**. Esta entrega no ejecuta `git tag` ni `git push` de tags.

El mensaje anotado ya está en [tag-message.txt](tag-message.txt). Las notas están en [NOTAS.es.md](NOTAS.es.md) y [NOTAS.en.md](NOTAS.en.md).

## Comprobar que no existe

En un clon al día:

```bash
git tag -l 'v0.1.0'
git ls-remote --tags origin 'refs/tags/v0.1.0'
```

Las dos órdenes tienen que salir vacías hasta que alguien cree el tag a propósito.

## Crearlo más adelante

Solo con autorización, y solo sobre el commit de `main` que ya contenga estas notas. Sustituye `SHA` por ese commit. No uses `HEAD` de una rama de trabajo.

```bash
git fetch origin main
git rev-parse origin/main
git tag -a v0.1.0 SHA -F docs/releases/v0.1.0/tag-message.txt
git show v0.1.0 --no-patch
```

Subir el tag es otro paso, también con autorización:

```bash
git push origin v0.1.0
```

No hay un workflow que cree este tag. El script [scripts/prepare-v0.1.0-tag.mjs](../../../scripts/prepare-v0.1.0-tag.mjs) imprime estas instrucciones y se niega a crearlo, también si se le pasa `--create`.
