// ============================================================
// storageService.js — Capa de persistencia de datos (LocalStorage)
// Versión Mejorada: Incluye siembra automática (Seeding)
// ============================================================

const KEYS = {
    ESTADOS: "estadosProductos",
    BANEADOS: "productosBaneados",
    INICIALIZADO: "subastaNet_inicializado"
};

// --- Funciones Internas de Lectura/Escritura ---
function leerDeStorage(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || {};
    } catch (error) {
        console.error(`Error al leer la clave ${key}:`, error);
        return {};
    }
}

function guardarEnStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error(`Error al guardar la clave ${key}:`, error);
    }
}

// --- Métodos Públicos ---
const StorageService = {
    
    // Inicializa la "Base de Datos" la primera vez que se corre la app
    inicializarBaseDeDatos(listaProductos) {
        // Si ya se inicializó antes, no hacemos nada para no sobreescribir los cambios del usuario
        if (localStorage.getItem(KEYS.INICIALIZADO)) return;

        const estadosIniciales = {};
        const contadoresPorCategoria = {};

        listaProductos.forEach(producto => {
            const cat = producto.categoria;
            
            // Inicializar el contador de la categoría si no existe
            if (!contadoresPorCategoria[cat]) {
                contadoresPorCategoria[cat] = 0;
            }

            // Si es uno de los primeros 3 de su categoría, nace "aprobado"
            if (contadoresPorCategoria[cat] < 3) {
                estadosIniciales[producto.id] = "aprobado";
                contadoresPorCategoria[cat]++;
            } else {
                // Todos los demás nacen como "pendiente" para que el admin los gestione
                estadosIniciales[producto.id] = "pendiente";
            }
        });

        // Guardamos los estados calculados en el localStorage
        guardarEnStorage(KEYS.ESTADOS, estadosIniciales);
        guardarEnStorage(KEYS.BANEADOS, {}); // Inicialmente nadie está baneado
        
        // Marcamos la app como inicializada
        localStorage.setItem(KEYS.INICIALIZADO, "true");
        console.log("🌱 Base de datos simulada inicializada con éxito (3 productos aprobados por categoría).");
    },

    obtenerEstados() {
        return leerDeStorage(KEYS.ESTADOS);
    },

    actualizarEstadoProducto(id, nuevoEstado) {
        const estados = this.obtenerEstados();
        estados[id] = nuevoEstado;
        guardarEnStorage(KEYS.ESTADOS, estados);
    },

    obtenerBaneados() {
        return leerDeStorage(KEYS.BANEADOS);
    },

    estaProductoBaneado(id) {
        const baneados = this.obtenerBaneados();
        return !!baneados[id];
    },

    conmutarBaneoProducto(id) {
        const baneados = this.obtenerBaneados();
        if (baneados[id]) {
            delete baneados[id];
        } else {
            baneados[id] = true;
        }
        guardarEnStorage(KEYS.BANEADOS, baneados);
    }
};

window.StorageService = StorageService;