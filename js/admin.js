// ============================================================
// admin.js — Panel administración SubastaNet (Refactorizado)
// ============================================================

const ORDEN_CATEGORIAS = [
  "Inmuebles", "Vehículos", "Electrónicos", "Arte Coleccionable",
  "Ropa y Accesorios", "Artículos Deportivos", "Libros", "Juguetes"
];

const ICONOS_CAT = {
  "Inmuebles": "🏠", "Vehículos": "🚗", "Electrónicos": "💻",
  "Arte Coleccionable": "🎨", "Ropa y Accesorios": "👗",
  "Artículos Deportivos": "⚽", "Libros": "📚", "Juguetes": "🧸"
};

// ---- Estado Actual del Producto (Llamada al Servicio) ----
function estadoActual(id) { 
  return StorageService.obtenerEstados()[id] || "pendiente"; 
}

// ---- Crear Tarjeta de Producto (Card) ----
function crearCard(p) {
  const estado  = estadoActual(p.id);
  const baneado = StorageService.estaProductoBaneado(p.id);

  // Determinar botones de acción según el estado en el que se encuentre el producto
  let botones = "";
  if (estado === "pendiente") {
    botones = `<button class="btn-aprobar"  onclick="aprobar(${p.id})">Aprobar</button>
               <button class="btn-rechazar" onclick="rechazar(${p.id})">Rechazar</button>`;
  } else if (estado === "aprobado") {
    botones = `<button class="btn-rechazar" onclick="rechazar(${p.id})">Rechazar</button>
               <button class="btn-revertir" onclick="revertir(${p.id})">↩ Pendiente</button>`;
  } else {
    botones = `<button class="btn-aprobar"  onclick="aprobar(${p.id})">Aprobar</button>
               <button class="btn-revertir" onclick="revertir(${p.id})">↩ Pendiente</button>`;
  }

  // El botón de baneo solo se muestra si el producto está aprobado o pendiente
  const btnBaneo = (estado === "aprobado" || estado === "pendiente")
    ? `<button class="btn-baneo" onclick="alternarBaneo(${p.id})">
         ${baneado ? "🔓 Quitar baneo" : "🚫 Banear"}
       </button>`
    : "";

  const card = document.createElement("div");
  card.className = "admin-card" + (baneado ? " card-baneada" : "");
  card.id = "card-" + p.id;
  card.innerHTML = `
    <img src="${p.imagen}" alt="${p.titulo}"
         onerror="this.src='https://via.placeholder.com/320x160?text=Sin+imagen'">
    <div class="admin-card-body">
      <span class="badge badge-${estado}">${estado}</span>
      ${baneado ? '<span class="badge badge-baneado">🚫 baneado</span>' : ""}
      <p class="admin-card-titulo">${p.titulo}</p>
      <p class="admin-card-cat">${p.condicion}</p>
      <p class="admin-card-precio">$${p.precioInicial.toLocaleString("es-MX")} MXN</p>
      <div class="admin-acciones">${botones}</div>
      ${btnBaneo}
      <button class="btn-detalle" onclick="window.open('detalle.html?id=${p.id}','_blank')">
        🔍 Ver detalle
      </button>
    </div>`;
  return card;
}

// ---- Renderizar sección por categorías ----
function renderizarSeccion(contenedorEl, lista) {
  contenedorEl.innerHTML = "";

  if (lista.length === 0) {
    contenedorEl.innerHTML = '<div class="empty-msg"><span>📭</span>Sin productos aquí</div>';
    return;
  }

  ORDEN_CATEGORIAS.forEach(cat => {
    const grupo = lista.filter(p => p.categoria === cat);
    if (grupo.length === 0) return;

    const seccion = document.createElement("div");
    seccion.className = "admin-seccion";
    seccion.innerHTML = `
      <div class="admin-cat-header">
        <div class="admin-cat-titulo">
          <span>${ICONOS_CAT[cat] || ""}</span>
          ${cat}
        </div>
        <span class="admin-cat-badge">${grupo.length}</span>
      </div>
      <div class="admin-grid" id="grid-${cat.replace(/\s+/g,'_')}"></div>
    `;
    contenedorEl.appendChild(seccion);

    const grid = seccion.querySelector(".admin-grid");
    grupo.forEach(p => grid.appendChild(crearCard(p)));
  });
}

// ---- Renderizar la interfaz completa ----
function renderizar() {
  const pend = productos.filter(p => estadoActual(p.id) === "pendiente");
  const apro = productos.filter(p => estadoActual(p.id) === "aprobado");
  const rech = productos.filter(p => estadoActual(p.id) === "rechazado");

  renderizarSeccion(document.getElementById("grid-pendientes"), pend);
  renderizarSeccion(document.getElementById("grid-aprobados"),  apro);
  renderizarSeccion(document.getElementById("grid-rechazados"), rech);

  document.getElementById("cnt-pendientes").textContent = pend.length;
  document.getElementById("cnt-aprobados").textContent  = apro.length;
  document.getElementById("cnt-rechazados").textContent = rech.length;
}

// ---- Eventos de Control conectados al Servicio de Almacenamiento ----
function aprobar(id)   { StorageService.actualizarEstadoProducto(id, "aprobado");  renderizar(); }
function jsonRechazar(id) { StorageService.actualizarEstadoProducto(id, "rechazado"); renderizar(); } // alias interno
function rechazar(id) { StorageService.actualizarEstadoProducto(id, "rechazado"); renderizar(); }
function revertir(id) { StorageService.actualizarEstadoProducto(id, "pendiente"); renderizar(); }
function alternarBaneo(id) { StorageService.conmutarBaneoProducto(id); renderizar(); }

function cambiarTab(nombre) {
  document.querySelectorAll(".tab-btn").forEach((btn, i) => {
    btn.classList.toggle("activo", ["pendientes","aprobados","rechazados"][i] === nombre);
  });
  document.querySelectorAll(".tab-panel").forEach(panel => {
    panel.classList.toggle("activo", panel.id === "panel-" + nombre);
  });
}

// Arrancar la vista
renderizar();