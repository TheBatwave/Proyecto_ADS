// ============================================================
// storageService.js — Capa de persistencia de datos (LocalStorage)
// Este archivo es el ÚNICO que habla con el almacenamiento
// ============================================================

const KEYS = {
    ESTADOS: "estadosProductos",
    BANEADOS: "productosBaneados"
};

// --- Funciones Internas de Lectura/Escritura ---
function leerDeStorage(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || {};
    } catch (error) {
        console.error(`Error al leer la clave ${key} de localStorage:`, error);
        return {};
    }
}

function guardarEnStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error(`Error al guardar la clave ${key} en localStorage:`, error);
    }
}

// --- Métodos Públicos que usará el Administrador y el Visitante ---
const StorageService = {
    // Obtener todos los estados (aprobado/rechazado/pendiente)
    obtenerEstados() {
        return leerDeStorage(KEYS.ESTADOS);
    },

    // Cambiar el estado de un producto (ej. de pendiente a aprobado)
    actualizarEstadoProducto(id, nuevoEstado) {
        const estados = this.obtenerEstados();
        estados[id] = nuevoEstado;
        guardarEnStorage(KEYS.ESTADOS, estados);
    },

    // Obtener mapa de productos baneados
    obtenerBaneados() {
        return leerDeStorage(KEYS.BANEADOS);
    },

    // Validar si un producto en específico está baneado (devuelve true o false)
    estaProductoBaneado(id) {
        const baneados = this.obtenerBaneados();
        return !!baneados[id]; // Convierte a booleano estricto
    },

    // Alternar el baneo de un producto
    conmutarBaneoProducto(id) {
        const baneados = this.obtenerBaneados();
        if (baneados[id]) {
            delete baneados[id]; // Si estaba baneado, lo quita
        } else {
            boxBaneados = true;
            baneados[id] = true; // Si no, lo banea
        }
        guardarEnStorage(KEYS.BANEADOS, baneados);
    }
};

// Lo dejamos disponible globalmente para las otras pantallas
window.StorageService = StorageService;