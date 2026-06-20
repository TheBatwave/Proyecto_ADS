# SubastaNet — Sistema de Subastas (PHP + MySQL)

Proyecto de Análisis y Diseño de Sistemas. Casa de subastas en línea con dos
actores: **Administrador** (gestiona productos, baneos y control de tiempo) y
**Visitante** (solo explora las subastas aprobadas).

> **Cambio importante de esta versión:** los datos ya **NO** viven en el archivo
> `js/productos.js`. Ahora están en una **base de datos MySQL normalizada**
> (`subastanet`). El frontend habla con la base de datos a través de una pequeña
> API en PHP (`api/index.php`).

---

## 1. Requisitos
- **XAMPP** (Apache + MySQL/MariaDB + PHP). Descarga: https://www.apachefriends.org

---

## 2. Instalación rápida (3 pasos)

1. **Copiar el proyecto**
   Copia la carpeta `Proyecto_ADS` dentro de `C:\xampp\htdocs\`.
   Debe quedar: `C:\xampp\htdocs\Proyecto_ADS\index.html`

2. **Encender XAMPP**
   Abre el *XAMPP Control Panel* y dale **Start** a **Apache** y a **MySQL**.

3. **Importar la base de datos**
   - Entra a `http://localhost/phpmyadmin`
   - Pestaña **Importar** -> elige `Proyecto_ADS/database/subastanet_completo.sql` -> **Continuar**.
   - Eso crea la base `subastanet` con sus tablas y los 240 productos.

Listo. Abre: **`http://localhost/Proyecto_ADS/index.html`**

> ADVERTENCIA: ábrelo siempre por `http://localhost/...` (servido por Apache),
> **no** con doble clic al archivo (`file:///...`), porque el sistema necesita
> PHP para hablar con la base de datos.

---

## 3. Accesos

**Administrador** (botón *Iniciar sesión*):
- Correo: `admin.central@subastanet.com`
- Contraseña: `SubastaAdmin2026`

**Visitante:** botón *Entrar como visitante* (sin cuenta).

Las contraseñas se guardan en la tabla `usuarios` con hash **SHA2-256**.

---

## 4. Estructura del proyecto

```
Proyecto_ADS/
├── index.html        Pantalla de inicio + login
├── subasta.html      Vista del visitante (explorar por categoría)
├── detalle.html      Detalle de un producto
├── admin.html        Panel del administrador
├── api/
│   ├── conexion.php  Conexión PDO a MySQL (ajusta usuario/clave si hace falta)
│   └── index.php     API: snapshot, login, estado, baneo, fechas, offset
├── css/              Estilos
├── js/
│   ├── storageService.js  Carga datos de MySQL y guarda cambios (capa de datos)
│   ├── script.js          Login del admin
│   ├── subasta.js / detalle.js / admin.js   Controladores de cada vista
│   └── productos.js        (deprecado: los datos ahora están en MySQL)
├── Img/              imágenes locales (funciona sin internet)
└── database/
    ├── 01_esquema.sql          Solo las tablas (CREATE TABLE)
    ├── 02_datos.sql            Solo los datos (INSERT)
    └── subastanet_completo.sql Esquema + datos en un solo archivo (RECOMENDADO)
```

---

## 5. Modelo de datos (para el diagrama del Capítulo 5)

Base de datos `subastanet`, **11 tablas** normalizadas:

| Tabla | Descripción | Relaciones |
|-------|-------------|------------|
| categorias | Las 8 categorías | 1:N con productos |
| vendedores | Datos del vendedor (V001…) | 1:N con productos; N:M con métodos |
| metodos_envio | Catálogo de métodos de envío | N:M con vendedores |
| vendedor_metodo_envio | Tabla puente (N:M) | vendedores <-> metodos_envio |
| usuarios | Admin y visitantes (rol) | 1:N con pujas |
| productos | Artículo en subasta | FK a categorias y vendedores |
| imagenes_producto | Galería (1:N) | FK a productos |
| producto_atributos | infoExtra variable (modelo Entidad-Atributo-Valor) | FK a productos |
| pujas | Ofertas de usuarios (preparada) | FK a productos y usuarios |
| fechas_editadas | Override de fechas para la demo | FK a productos |
| configuracion | Clave-valor (offset del control de tiempo) | — |

**Relaciones clave:**
- categorias 1—N productos
- vendedores 1—N productos
- vendedores N—M metodos_envio (vía vendedor_metodo_envio)
- productos 1—N imagenes_producto
- productos 1—N producto_atributos
- productos 1—N pujas  /  usuarios 1—N pujas
- productos 1—1 fechas_editadas

---


**Novedad — Documento de propiedad:** la tabla `productos` tiene dos columnas
nuevas: `documento_propiedad` (imagen de la escritura / factura / certificado) y
`documento_verificado` (el administrador valida la propiedad). Aplica a Inmuebles,
Vehículos y Arte Coleccionable. Los documentos vectoriales están en `Img/docs/`.

---

## 6. ¿Cómo funciona por dentro?

1. Al abrir cualquier página, `storageService.js` llama a
   `api/index.php?action=snapshot` y carga todos los productos + estados desde
   MySQL (los deja en `window.productos`).
2. Cuando el admin aprueba/rechaza/banea un producto o edita fechas/tiempo, se
   manda un POST a la API que guarda el cambio en MySQL. Por eso los cambios se
   conservan aunque recargues o cambies de computadora.

---

## 7. Problemas comunes

- **"No se pudo conectar con la base de datos"**: revisa que MySQL esté en Start
  en XAMPP y que importaste `subastanet_completo.sql`.
- **No cargan imágenes / no funciona el login**: abriste el `.html` con doble
  clic. Entra por `http://localhost/Proyecto_ADS/`.
- **Tu MySQL de root tiene contraseña**: edítala en `api/conexion.php` (DB_PASS).

---

## 8. Cambios recientes (sesión, fotos pendientes y tiempo)

- **Sesión real de administrador:** el login usa sesiones de PHP. El panel
  `admin.html` queda protegido (si no hay sesión, redirige al inicio) y hay botón
  **Cerrar sesión**. Al abrir el detalle de un producto desde el panel, el admin
  **ya no pierde la sesión** y puede previsualizar productos pendientes/rechazados.
- **Fotos pendientes:** los 40 productos nuevos muestran un marcador "📷 Falta foto"
  con el nombre del producto (carpeta `Img/pendientes/`). Para poner la foto real:
  copia tu imagen a la carpeta `Img/` de la categoría y actualiza la ruta del
  producto en la BD (tabla `productos`, columna `imagen`, e `imagenes_producto`).
- **Tiempo de subastas:** en el panel de tiempo, además de avanzar el reloj global,
  cada subasta tiene atajos **"Terminar ya"** y **"Extender +7d"** para cambiar su
  estado al instante durante la presentación (sin esperar en tiempo real).
