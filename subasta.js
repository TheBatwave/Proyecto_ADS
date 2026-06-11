// ============================================================
// Vista visitante
// Solo muestra productos con estado "aprobado" en localStorage
// ============================================================

const CATEGORIAS_INFO = [
  { nombre: "Inmuebles",            icono: "🏠" },
  { nombre: "Vehículos",            icono: "🚗" },
  { nombre: "Electrónicos",         icono: "💻" },
  { nombre: "Arte Coleccionable",   icono: "🎨" },
  { nombre: "Ropa y Accesorios",    icono: "👗" },
  { nombre: "Artículos Deportivos", icono: "⚽" },
  { nombre: "Libros",               icono: "📚" },
  { nombre: "Juguetes",             icono: "🧸" }
];

const PRODUCTOS_POR_CATEGORIA = 4;
let filtroTipoSubasta = "todos"; // "todos" | "Inglesa" | "Holandesa" | "Sellada"


// ---- Validar si una subasta sigue vigente ----
function estaVigente(p) {
  if (!p.fechaFin) return true;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fin = new Date(p.fechaFin);
  fin.setHours(23, 59, 59, 999);
  return fin >= hoy;
}

// ---- Solo productos aprobados, vigentes y no baneados ----
function productosAprobados() {
  const estados = StorageService.obtenerEstados();

  return productos.filter(p =>
        estados[p.id] === "aprobado" &&
        !StorageService.estaProductoBaneado(p.id) && // <--- Ahora usa el servicio
        estaVigente(p) &&
        (filtroTipoSubasta === "todos" || p.tipoSubasta.toLowerCase() === filtroTipoSubasta.toLowerCase())
    );
}

// ---- Construir página por categorías ----
function init() {
  filtroTipoSubasta = "todos";
  renderizarFiltros();
  renderizarCategorias();
}

// ---- Renderizar filtros de tipo de subasta ----
function renderizarFiltros() {
  let barra = document.getElementById("barraFiltros");
  if (!barra) {
    barra = document.createElement("div");
    barra.id = "barraFiltros";
    barra.className = "barra-filtros";
    const contenedor = document.getElementById("contenedorCategorias");
    contenedor.parentNode.insertBefore(barra, contenedor);
  }
  barra.innerHTML = `
    <span class="filtro-label">Filtrar por tipo de subasta:</span>
    <button class="btn-filtro ${filtroTipoSubasta === 'todos' ? 'activo' : ''}" onclick="aplicarFiltro('todos')">🔍 Todos</button>
    <button class="btn-filtro ${filtroTipoSubasta === 'Inglesa' ? 'activo' : ''}" onclick="aplicarFiltro('Inglesa')">📈 Inglesa</button>
    <button class="btn-filtro ${filtroTipoSubasta === 'Holandesa' ? 'activo' : ''}" onclick="aplicarFiltro('Holandesa')">📉 Holandesa</button>
    <button class="btn-filtro ${filtroTipoSubasta === 'Sellada' ? 'activo' : ''}" onclick="aplicarFiltro('Sellada')">✉️ Sellada</button>
  `;
}

function aplicarFiltro(tipo) {
  filtroTipoSubasta = tipo;
  renderizarFiltros();
  renderizarCategorias();
}

// ---- Renderizar categorías ----
function renderizarCategorias() {
  const contenedor = document.getElementById("contenedorCategorias");
  contenedor.innerHTML = "";

  const aprobados = productosAprobados();

  if (aprobados.length === 0) {
    contenedor.innerHTML = `
      <div style="text-align:center;padding:80px 20px;color:#94a3b8">
        <div style="font-size:48px;margin-bottom:16px">🏷️</div>
        <h2 style="font-size:20px;margin-bottom:8px;color:#64748b">No hay productos disponibles</h2>
        <p style="font-size:14px">No se encontraron subastas con los filtros seleccionados.</p>
      </div>`;
    return;
  }

  CATEGORIAS_INFO.forEach(cat => {
    const lista = aprobados.filter(p => p.categoria === cat.nombre);
    if (lista.length === 0) return;

    const muestra = lista.slice(0, PRODUCTOS_POR_CATEGORIA);
    const seccion = document.createElement("section");
    seccion.className = "seccion-categoria";

    seccion.innerHTML = `
      <div class="cat-header">
        <h2 class="cat-titulo">${cat.icono} ${cat.nombre}</h2>
        <button class="btn-ver-todos" onclick="filtrarCategoria('${cat.nombre}')">
          Ver todos (${lista.length}) →
        </button>
      </div>
      <div class="grid-productos" id="grid-${cat.nombre.replace(/\s+/g,'_')}"></div>
    `;
    contenedor.appendChild(seccion);

    const grid = seccion.querySelector(".grid-productos");
    muestra.forEach(p => grid.appendChild(crearCard(p)));
  });
}

// ---- Crear card ----
function crearCard(p) {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <div class="card-img-wrap">
      <img src="${p.imagen}" alt="${p.titulo}" loading="lazy"
           onerror="this.src='https://via.placeholder.com/320x200?text=Sin+imagen'">
      <span class="badge-estado ${p.condicion === 'Nuevo' ? 'badge-nuevo' : 'badge-usado'}">${p.condicion}</span>
    </div>
    <div class="content">
      <h2 class="card-titulo">${p.titulo}</h2>
      <p class="location">📍 ${p.ubicacion}</p>
      <div class="price">$${p.precioInicial.toLocaleString("es-MX")} MXN</div>
      <p class="tipo-subasta">Subasta: ${p.tipoSubasta}</p>
      <button class="btn-ver" onclick="sessionStorage.setItem('volverCategoria','${p.categoria}'); window.location.href='detalle.html?id=${p.id}'">Ver producto</button>
    </div>
  `;
  return card;
}

// ---- Ver todos de una categoría ----
function filtrarCategoria(nombre) {
  const contenedor = document.getElementById("contenedorCategorias");
  contenedor.innerHTML = "";

  const catInfo = CATEGORIAS_INFO.find(c => c.nombre === nombre);
  const lista = productosAprobados().filter(p => p.categoria === nombre);

  const seccion = document.createElement("section");
  seccion.className = "seccion-categoria";
  seccion.innerHTML = `
    <div class="cat-header">
      <h2 class="cat-titulo">${catInfo ? catInfo.icono : ""} ${nombre}</h2>
      <button class="btn-ver-todos btn-volver" onclick="init()">← Volver</button>
    </div>
    <div class="grid-productos" id="grid-filtro"></div>
  `;
  contenedor.appendChild(seccion);

  const grid = seccion.querySelector(".grid-productos");
  if (lista.length === 0) {
    grid.innerHTML = '<p style="color:#94a3b8;padding:20px;font-size:14px">No hay productos de este tipo de subasta en esta categoría.</p>';
  } else {
    lista.forEach(p => grid.appendChild(crearCard(p)));
  }
}

// ---- Abrir panel lateral ----
function abrirPanel(id) {
  const p = productos.find(x => x.id === id);
  if (!p) return;

  const overlay = document.getElementById("overlay");
  const panel   = document.getElementById("panelDetalle");
  const cuerpo  = document.getElementById("panelCuerpo");

  let extrasHTML = "";
  if (p.marca)               extrasHTML += `<div class="det-fila"><span>Vehículo</span><strong>${p.marca} ${p.modelo || ""} ${p.anio || ""}</strong></div>`;
  if (p.kilometraje)         extrasHTML += `<div class="det-fila"><span>Kilometraje</span><strong>${p.kilometraje.toLocaleString()} km</strong></div>`;
  if (p.condicionMecanica)   extrasHTML += `<div class="det-fila"><span>Mecánica</span><strong>${p.condicionMecanica}</strong></div>`;
  if (p.tipoPropiedad)       extrasHTML += `<div class="det-fila"><span>Tipo propiedad</span><strong>${p.tipoPropiedad}</strong></div>`;
  if (p.superficieConstruida)extrasHTML += `<div class="det-fila"><span>Sup. construida</span><strong>${p.superficieConstruida} m²</strong></div>`;
  if (p.superficieTerreno)   extrasHTML += `<div class="det-fila"><span>Sup. terreno</span><strong>${p.superficieTerreno} m²</strong></div>`;
  if (p.habitaciones)        extrasHTML += `<div class="det-fila"><span>Recámaras</span><strong>${p.habitaciones}</strong></div>`;

  const metodos = p.vendedor?.metodosEnvio?.join(", ") || "No especificado";
  const calif   = p.vendedor?.calificacion;
  const estrellas = calif ? "⭐".repeat(Math.round(calif)) + ` (${calif})` : "";

  cuerpo.innerHTML = `
    <img class="panel-img" src="${p.imagen}" alt="${p.titulo}"
         onerror="this.src='https://via.placeholder.com/600x300?text=Sin+imagen'">
    <div class="panel-info">
      <span class="badge-estado ${p.condicion === 'Nuevo' ? 'badge-nuevo' : 'badge-usado'}"
            style="margin-bottom:8px;display:inline-block">${p.condicion}</span>
      <h2 class="panel-titulo">${p.titulo}</h2>
      <p class="panel-ubicacion">📍 ${p.ubicacion}</p>
      <div class="panel-precio">$${p.precioInicial.toLocaleString("es-MX")} MXN</div>
      <p class="panel-desc">${p.descripcion}</p>

      <div class="det-tabla">
        <div class="det-fila"><span>Categoría</span><strong>${p.categoria}</strong></div>
        <div class="det-fila"><span>Condición</span><strong>${p.condicion}</strong></div>
        <div class="det-fila"><span>Tipo subasta</span><strong>${p.tipoSubasta}</strong></div>
        <div class="det-fila"><span>Incremento mínimo</span><strong>$${(p.incrementoMinimo||0).toLocaleString("es-MX")} MXN</strong></div>
        <div class="det-fila"><span>Disponibles</span><strong>${p.cantidadDisponible || 1}</strong></div>
        ${p.fechaInicio ? `<div class="det-fila"><span>Inicio</span><strong>${p.fechaInicio}</strong></div>` : ""}
        ${p.fechaFin    ? `<div class="det-fila"><span>Cierre</span><strong>${p.fechaFin}</strong></div>` : ""}
        ${extrasHTML}
      </div>

      <div class="vendedor-box">
        <h4> Vendedor</h4>
        <p><strong>${p.vendedor?.nombre || "Desconocido"}</strong></p>
        ${estrellas ? `<p>${estrellas}</p>` : ""}
        ${p.vendedor?.historialVentas ? `<p>${p.vendedor.historialVentas} ventas realizadas</p>` : ""}
        <p>Envío: ${metodos}</p>
      </div>

      <button class="btn-pujar-panel" onclick="mostrarModalLogin()">
        🔨 Participar en la subasta
      </button>
    </div>
  `;

  overlay.classList.add("activo");
  panel.classList.add("activo");
  document.body.style.overflow = "hidden";
}

// ---- Cerrar panel ----
function cerrarPanel() {
  document.getElementById("overlay").classList.remove("activo");
  document.getElementById("panelDetalle").classList.remove("activo");
  document.body.style.overflow = "";
}

// ---- Modal login ----
function mostrarModalLogin() {
  document.getElementById("modalLogin").classList.add("activo");
}
function cerrarModalLogin() {
  document.getElementById("modalLogin").classList.remove("activo");
}

// ---- ESC cierra todo ----
document.addEventListener("keydown", e => {
  if (e.key === "Escape") { cerrarPanel(); cerrarModalLogin(); }
});

// ---- Iniciar ----
init();
// ---- Al cargar, revisar si hay categoría pendiente de sessionStorage ----
(function revisarCategoriaPendiente() {
  const cat = sessionStorage.getItem("volverCategoria");
  if (cat) {
    sessionStorage.removeItem("volverCategoria");
    filtrarCategoria(cat);
  }
})();