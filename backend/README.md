# Subscripciones y contratos (microservicios)

Repositorio contenedor de microservicios relacionados con suscripciones y contratos. En la raíz vive la **configuración común de Git** (hooks y validación de commits); cada microservicio puede vivir en **su propia carpeta** con su propio `package.json` y `node_modules` para mantener límites claros entre servicios.

## Requisitos

- **Node.js** `>= 18.18.0` (ver `package.json` → `engines`)

## Puesta en marcha

Tras clonar el repositorio, en la **raíz** del proyecto:

```bash
npm install
```

Eso instala las dependencias de desarrollo y ejecuta el script `prepare`, que configura **Husky** para que los hooks de Git queden activos en tu máquina.

> Si añades microservicios en subcarpetas con su propio `package.json`, entra en cada carpeta y ejecuta allí `npm install` cuando corresponda.

---

## Cómo hacer commits

Los mensajes se validan con **[Conventional Commits](https://www.conventionalcommits.org/)** mediante **Commitlint** (`@commitlint/config-conventional`), más una regla de equipo obligatoria.

### Formato obligatorio del encabezado

1. **Tipo** (`feat`, `fix`, `docs`, `chore`, etc.), dos puntos y un espacio.
2. En el mismo encabezado debe aparecer el ticket **`PDAE-` seguido de uno o más dígitos** (expresión regular: `PDAE-[0-9]+`).
3. El resto es la descripción breve del cambio.

**Ejemplos válidos:**

```text
feat: PDAE-123 login con JWT
fix: PDAE-456 corrige cálculo de vigencia
docs: PDAE-78 actualiza README de despliegue
```

**Ejemplos que fallarán la validación:**

```text
feat: login con JWT
```

Falta el ticket `PDAE-número`.

```text
Feat: PDAE-123 algo
```

El tipo debe ir en minúsculas según el preset convencional (salvo casos que el preset permita explícitamente).

### Nota sobre mayúsculas en el subject

El preset convencional suele ser estricto con el **estilo del subject**. Como el ticket va como **`PDAE-…`** (mayúsculas), en `commitlint.config.js` la regla **`subject-case` está desactivada** para no chocar con el formato del ticket.

### Probar el mensaje antes de commitear

Desde la raíz del repo:

```bash
echo "feat: PDAE-123 descripción" | npx --no commitlint
```

Si no hay salida de error y el código de salida es `0`, el mensaje cumple las reglas.

---

## Configuración de Git: Husky

**[Husky](https://typicode.github.io/husky/)** ejecuta scripts en momentos concretos del flujo de Git. Los hooks viven en `.husky/`.

| Hook         | Qué hace |
| ------------ | -------- |
| `commit-msg` | Ejecuta `npx --no -- commitlint --edit "$1"` para validar el mensaje del commit usando el archivo temporal que Git pasa al hook. |
| `pre-commit` | Ejecuta `npm run lint --if-present`: solo corre el linter si en `package.json` existe el script `lint`. |

Si el hook rechaza el commit, lee el mensaje en pantalla, corrige el texto del commit y vuelve a intentar.

---

## Archivos relevantes

| Archivo / carpeta        | Rol |
| ------------------------ | --- |
| `commitlint.config.js`   | Extiende `@commitlint/config-conventional`, regla `pdae-ticket` y ajuste de `subject-case`. |
| `.husky/commit-msg`      | Valida el mensaje con Commitlint. |
| `.husky/pre-commit`      | Opcional: lint antes del commit si defines `npm run lint`. |
| `package.json`           | Dependencias de desarrollo de Commitlint y Husky; script `prepare` para instalar hooks. |

---

## Estructura del repositorio

- **Raíz**: este `README`, configuración de commits (Commitlint + Husky) y `package.json` de soporte al repo.
- **Subcarpetas** (cuando existan): un microservicio por carpeta, cada uno con su propio Node y `node_modules` si así lo definís; eso no contradice microservicios: seguís evitando un monolito de aplicación, aunque el código comparta un mismo repositorio Git.

Para dudas sobre tipos de commit y buenas prácticas, consultá la [guía de Conventional Commits](https://www.conventionalcommits.org/) y la [documentación de Commitlint](https://commitlint.js.org/).
