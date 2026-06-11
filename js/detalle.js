// ============================================================
// Página de detalle de producto tipo ML
// Lee el id de la URL: detalle.html?id=151
// ============================================================

let imagenesProducto = [];
let imgActual = 0;

// ---- Obtener parámetro id de la URL ----
function getIdUrl() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("id");
  // El id puede ser número o string (ej: "VEH-001")
  const asNum = parseInt(raw);
  return isNaN(asNum) ? raw : asNum;
}

// ---- Iniciar ----
function init() {
  const id = getIdUrl();
  if (!id) {
    mostrarError("No se especificó un producto.");
    return;
  }

  const p = productos.find(x => x.id == id);
  if (!p) {
    mostrarError("Producto no encontrado.");
    return;
  }

  // Breadcrumb
  document.getElementById("breadcrumb").innerHTML = `
    <a href="subasta.html">Inicio</a>
    <span>›</span>
    <a href="subasta.html" onclick="sessionStorage.setItem('filtroCategoria','${p.categoria}');return true;">${p.categoria}</a>
    <span>›</span>
    <span>${p.titulo}</span>
  `;

  // Título de la pestaña
  document.title = `${p.titulo} — SubastaNet`;

  // Construir imágenes (principal + extras si existen)
  imagenesProducto = [];
  if (p.imagen) imagenesProducto.push(p.imagen);
  if (Array.isArray(p.imagenes)) {
    p.imagenes.forEach(img => {
      if (img && !imagenesProducto.includes(img)) imagenesProducto.push(img);
    });
  }

  renderizarProducto(p);
}

// ---- Renderizar página completa ----
function renderizarProducto(p) {
  // Campos extra — soporta tanto campos directos como dentro de infoExtra
  const ie = p.infoExtra || {};
  let extrasHTML = "";

  // Vehículos
  const marca    = p.marca    || ie.marca;
  const modelo   = p.modelo   || ie.modelo;
  const anio     = p.anio     || ie.anio;
  const km       = p.kilometraje    || ie.kilometraje;
  const numSerie = p.numeroSerie    || ie.numeroSerie;
  const condMec  = p.condicionMecanica || ie.condicionMecanica;
  const placas   = p.placas   || ie.placas;

  if (marca)    extrasHTML += fila("Marca / Modelo", `${marca} ${modelo || ""} ${anio || ""}`);
  if (km)       extrasHTML += fila("Kilometraje", Number(km).toLocaleString("es-MX") + " km");
  if (numSerie) extrasHTML += fila("No. de serie", numSerie);
  if (condMec)  extrasHTML += fila("Condición mecánica", condMec);
  if (placas)   extrasHTML += fila("Placas", placas);

  // Inmuebles
  const tipoProp  = p.tipoPropiedad        || ie.tipoPropiedad;
  const supCons   = p.superficieConstruida || ie.superficieConstruida;
  const supTerr   = p.superficieTerreno    || ie.superficieTerreno;
  const habitac   = p.habitaciones         || ie.habitaciones;
  const ubDetalle = ie.ubicacionDetallada;
  const docLegal  = p.documentacionLegal   !== undefined ? p.documentacionLegal : ie.documentacionLegal;

  if (tipoProp)  extrasHTML += fila("Tipo de propiedad", tipoProp);
  if (supCons)   extrasHTML += fila("Superficie construida", supCons);
  if (supTerr)   extrasHTML += fila("Superficie terreno", supTerr);
  if (habitac)   extrasHTML += fila("Recámaras", habitac);
  if (ubDetalle) extrasHTML += fila("Dirección exacta", ubDetalle);
  if (docLegal)  extrasHTML += fila("Documentación legal", typeof docLegal === "boolean"
    ? (docLegal ? "✅ Completa" : "⚠️ Pendiente")
    : docLegal
  );

  const metodos = p.vendedor?.metodosEnvio?.join(" · ") || "No especificado";
  const calif   = p.vendedor?.calificacion || 0;
  const estrellas = "⭐".repeat(Math.round(calif));

  // Galería
  const galeriaHTML = imagenesProducto.length > 1
    ? `<div class="galeria-thumbs">
        ${imagenesProducto.map((img, i) => `
          <img src="${img}" class="thumb ${i === 0 ? 'thumb-activa' : ''}"
               onclick="cambiarImagen(${i})"
               onerror="this.style.display='none'"
               alt="imagen ${i+1}">
        `).join("")}
       </div>`
    : "";

  document.getElementById("detContenido").innerHTML = `
    <div class="det-layout">

      <!-- COLUMNA IZQUIERDA: galería -->
      <div class="det-galeria">
        <div class="img-principal-wrap">
          <img id="imgPrincipal"
               src="${imagenesProducto[0] || ''}"
               alt="${p.titulo}"
               onclick="abrirLightbox(0)"
               onerror="this.src='https://via.placeholder.com/600x420?text=Sin+imagen'">
          <span class="img-zoom-hint">🔍 Clic para ampliar</span>
        </div>
        ${galeriaHTML}
      </div>

      <!-- COLUMNA DERECHA: info -->
      <div class="det-info">

        <div class="det-badges">
          <span class="badge-cat">${p.categoria}</span>
          <span class="badge-cond ${p.condicion === 'Nuevo' ? 'badge-nuevo' : 'badge-usado'}">${p.condicion}</span>
          <span class="badge-subasta">Subasta ${p.tipoSubasta}</span>
        </div>

        <h1 class="det-titulo">${p.titulo}</h1>
        <p class="det-ubicacion">📍 ${p.ubicacion}</p>

        <div class="det-precio-box">
          <div class="det-precio">$${p.precioInicial.toLocaleString("es-MX")} <span>MXN</span></div>
          <p class="det-incremento">Incremento mínimo: $${(p.incrementoMinimo || 0).toLocaleString("es-MX")} MXN</p>
        </div>

        <button class="btn-pujar-det" onclick="abrirModal()">
          🔨 Participar en la subasta
        </button>

        <!-- Fechas -->
        <div class="det-fechas">
          ${p.fechaInicio ? `<div class="fecha-item"><span>Inicio</span><strong>${p.fechaInicio}</strong></div>` : ""}
          ${p.fechaFin    ? `<div class="fecha-item"><span>Cierre</span><strong>${p.fechaFin}</strong></div>` : ""}
          <div class="fecha-item"><span>Disponibles</span><strong>${p.cantidadDisponible || 1}</strong></div>
        </div>

        <!-- Descripción -->
        <div class="det-seccion">
          <h3>📋 Descripción</h3>
          <p class="det-descripcion">${p.descripcion}</p>
        </div>

        <!-- Características -->
        <div class="det-seccion">
          <h3>📌 Características</h3>
          <div class="det-tabla">
            ${fila("Condición", p.condicion)}
            ${fila("Tipo de subasta", p.tipoSubasta)}
            ${extrasHTML}
          </div>
        </div>

        <!-- Vendedor -->
        <div class="vendedor-box">
          <h3> Vendedor</h3>
          <p class="vend-nombre">${p.vendedor?.nombre || "Desconocido"}</p>
          <div class="vend-stars">${estrellas} <span>${calif} / 5</span></div>
          ${p.vendedor?.historialVentas ? `<p class="vend-ventas">${p.vendedor.historialVentas} ventas realizadas</p>` : ""}
          <p class="vend-envio">📦 Envío: ${metodos}</p>
        </div>

      </div>
    </div>
  `;
}

// ---- Helper fila de tabla ----
function fila(label, valor) {
  return `<div class="det-fila"><span>${label}</span><strong>${valor}</strong></div>`;
}

// ---- Cambiar imagen principal ----
function cambiarImagen(idx) {
  imgActual = idx;
  const img = document.getElementById("imgPrincipal");
  if (img) img.src = imagenesProducto[idx];
  document.querySelectorAll(".thumb").forEach((t, i) => {
    t.classList.toggle("thumb-activa", i === idx);
  });
}

// ---- Lightbox ----
function abrirLightbox(idx) {
  imgActual = idx;
  document.getElementById("lightboxImg").src = imagenesProducto[idx];
  document.getElementById("lightbox").classList.add("activo");
  document.body.style.overflow = "hidden";
}

function cerrarLightbox() {
  document.getElementById("lightbox").classList.remove("activo");
  document.body.style.overflow = "";
}

function moverLightbox(dir) {
  imgActual = (imgActual + dir + imagenesProducto.length) % imagenesProducto.length;
  document.getElementById("lightboxImg").src = imagenesProducto[imgActual];
}

// ---- Modal login ----
function abrirModal()  { document.getElementById("modalLogin").classList.add("activo"); }
function cerrarModal() { document.getElementById("modalLogin").classList.remove("activo"); }

// ---- Error ----
function mostrarError(msg) {
  document.getElementById("detContenido").innerHTML = `
    <div style="text-align:center;padding:80px 20px;color:#94a3b8">
      <div style="font-size:48px;margin-bottom:16px">😕</div>
      <h2 style="color:#64748b;margin-bottom:8px">${msg}</h2>
      <a href="subasta.html"><button style="width:auto;padding:10px 24px;margin-top:16px">← Volver al inicio</button></a>
    </div>`;
}

// ---- ESC ----
document.addEventListener("keydown", e => {
  if (e.key === "Escape") { cerrarLightbox(); cerrarModal(); }
  if (e.key === "ArrowLeft")  moverLightbox(-1);
  if (e.key === "ArrowRight") moverLightbox(1);
});

init();