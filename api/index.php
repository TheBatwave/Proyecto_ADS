<?php
// ============================================================
// index.php — API de SubastaNet (router por ?action=)
// Devuelve y recibe JSON. Reemplaza a localStorage + productos.js
// ============================================================

require_once __DIR__ . '/conexion.php';
session_start();
header('Content-Type: application/json; charset=utf-8');

$pdo    = conectarBD();
$accion = $_GET['action'] ?? $_POST['action'] ?? '';

// Lee el cuerpo JSON (para POST) y lo combina con $_POST
function cuerpo() {
    $raw = file_get_contents('php://input');
    $json = json_decode($raw, true);
    return is_array($json) ? array_merge($_POST, $json) : $_POST;
}

function responder($data) { echo json_encode($data); exit; }
function error($msg, $code = 400) {
    http_response_code($code);
    echo json_encode(['error' => $msg]);
    exit;
}

try {
    switch ($accion) {

        // ====================================================
        // SNAPSHOT — todo lo que el front necesita para arrancar
        // ====================================================
        case 'snapshot': {
            // Productos + categoría + vendedor
            $sql = "SELECT p.*, c.nombre AS categoria_nombre,
                           v.nombre AS vend_nombre, v.historial_ventas, v.calificacion
                    FROM productos p
                    JOIN categorias c ON c.id = p.categoria_id
                    LEFT JOIN vendedores v ON v.id = p.vendedor_id
                    ORDER BY p.id";
            $prods = $pdo->query($sql)->fetchAll();

            // Imágenes por producto
            $imgs = [];
            foreach ($pdo->query("SELECT producto_id, url FROM imagenes_producto ORDER BY producto_id, orden") as $r) {
                $imgs[$r['producto_id']][] = $r['url'];
            }

            // Atributos (infoExtra)
            $attrs = [];
            foreach ($pdo->query("SELECT producto_id, nombre, valor FROM producto_atributos") as $r) {
                $attrs[$r['producto_id']][$r['nombre']] = $r['valor'];
            }

            // Métodos de envío por vendedor
            $metodos = [];
            $sqlM = "SELECT vme.vendedor_id, me.nombre
                     FROM vendedor_metodo_envio vme
                     JOIN metodos_envio me ON me.id = vme.metodo_id";
            foreach ($pdo->query($sqlM) as $r) {
                $metodos[$r['vendedor_id']][] = $r['nombre'];
            }

            // Fechas editadas
            $fechas = [];
            foreach ($pdo->query("SELECT producto_id, fecha_inicio, fecha_fin FROM fechas_editadas") as $r) {
                $fechas[(string)$r['producto_id']] = [
                    'fechaInicio' => $r['fecha_inicio'],
                    'fechaFin'    => $r['fecha_fin']
                ];
            }

            // Offset de tiempo
            $stmt = $pdo->query("SELECT valor FROM configuracion WHERE clave = 'offset_tiempo'");
            $offset = (int)($stmt->fetchColumn() ?: 0);

            // Armar la respuesta con la MISMA forma que usaba productos.js
            $productos = [];
            $estados   = [];
            $baneados  = [];

            foreach ($prods as $p) {
                $id = (int)$p['id'];
                $estados[(string)$id] = $p['estado'];
                if ((int)$p['baneado'] === 1) $baneados[(string)$id] = true;

                $productos[] = [
                    'id'                 => $id,
                    'titulo'             => $p['titulo'],
                    'descripcion'        => $p['descripcion'],
                    'categoria'          => $p['categoria_nombre'],
                    'condicion'          => $p['condicion'],
                    'imagen'             => $p['imagen'],
                    'imagenes'           => $imgs[$id] ?? [],
                    'ubicacion'          => $p['ubicacion'],
                    'precioInicial'      => (float)$p['precio_inicial'],
                    'incrementoMinimo'   => (float)$p['incremento_minimo'],
                    'fechaInicio'        => $p['fecha_inicio'],
                    'fechaFin'           => $p['fecha_fin'],
                    'cantidadDisponible' => (int)$p['cantidad_disponible'],
                    'tipoSubasta'        => $p['tipo_subasta'],
                    'estado'             => $p['estado'],
                    'baneado'            => (int)$p['baneado'] === 1,
                    'documentoPropiedad'  => $p['documento_propiedad'],
                    'documentoVerificado' => (int)$p['documento_verificado'] === 1,
                    'vendedor'           => [
                        'id'              => $p['vendedor_id'],
                        'nombre'          => $p['vend_nombre'],
                        'historialVentas' => (int)$p['historial_ventas'],
                        'calificacion'    => (float)$p['calificacion'],
                        'metodosEnvio'    => $metodos[$p['vendedor_id']] ?? []
                    ],
                    'infoExtra'          => $attrs[$id] ?? new stdClass()
                ];
            }

            responder([
                'productos' => $productos,
                'estados'   => $estados,
                'baneados'  => $baneados,
                'fechas'    => (object)$fechas,
                'offset'    => $offset,
                'sesion'    => [
                    'logueado' => isset($_SESSION['rol']),
                    'rol'      => $_SESSION['rol'] ?? null,
                    'correo'   => $_SESSION['correo'] ?? null
                ]
            ]);
            break;
        }

        // ====================================================
        // LOGIN de administrador
        // ====================================================
        case 'login': {
            $d = cuerpo();
            $correo = trim($d['correo'] ?? '');
            $pass   = $d['password'] ?? '';
            if ($correo === '' || $pass === '') error('Faltan credenciales.');

            $stmt = $pdo->prepare(
                "SELECT id, rol FROM usuarios
                 WHERE correo = ? AND contrasena = SHA2(?, 256)
                   AND rol = 'administrador' AND activo = 1"
            );
            $stmt->execute([$correo, $pass]);
            $u = $stmt->fetch();
            if ($u) {
                $_SESSION['rol']    = $u['rol'];
                $_SESSION['correo'] = $correo;
                responder(['ok' => true, 'rol' => $u['rol']]);
            }
            responder(['ok' => false]);
            break;
        }

        // ====================================================
        // CERRAR SESIÓN
        // ====================================================
        case 'logout': {
            $_SESSION = [];
            session_destroy();
            responder(['ok' => true]);
            break;
        }

        // ====================================================
        // CAMBIAR ESTADO (aprobar / rechazar / pendiente)
        // ====================================================
        case 'estado': {
            $d = cuerpo();
            $id     = (int)($d['id'] ?? 0);
            $estado = $d['estado'] ?? '';
            if (!in_array($estado, ['pendiente', 'aprobado', 'rechazado'], true)) error('Estado inválido.');
            $stmt = $pdo->prepare("UPDATE productos SET estado = ? WHERE id = ?");
            $stmt->execute([$estado, $id]);
            responder(['ok' => true]);
            break;
        }

        // ====================================================
        // BANEAR / DESBANEAR (toggle)
        // ====================================================
        case 'baneo': {
            $d  = cuerpo();
            $id = (int)($d['id'] ?? 0);
            $pdo->prepare("UPDATE productos SET baneado = 1 - baneado WHERE id = ?")->execute([$id]);
            $b = $pdo->prepare("SELECT baneado FROM productos WHERE id = ?");
            $b->execute([$id]);
            responder(['ok' => true, 'baneado' => (int)$b->fetchColumn() === 1]);
            break;
        }

        // ====================================================
        // EDITAR FECHAS de un producto (override demo)
        // ====================================================
        case 'fechas': {
            $d   = cuerpo();
            $id  = (int)($d['id'] ?? 0);
            $ini = $d['fechaInicio'] ?: null;
            $fin = $d['fechaFin'] ?: null;
            $sql = "INSERT INTO fechas_editadas (producto_id, fecha_inicio, fecha_fin)
                    VALUES (?, ?, ?)
                    ON DUPLICATE KEY UPDATE fecha_inicio = VALUES(fecha_inicio), fecha_fin = VALUES(fecha_fin)";
            $pdo->prepare($sql)->execute([$id, $ini, $fin]);
            responder(['ok' => true]);
            break;
        }

        // ====================================================
        // RESTAURAR FECHAS originales
        // ====================================================
        case 'restaurarFechas': {
            $d  = cuerpo();
            $id = (int)($d['id'] ?? 0);
            $pdo->prepare("DELETE FROM fechas_editadas WHERE producto_id = ?")->execute([$id]);
            responder(['ok' => true]);
            break;
        }

        // ====================================================
        // VERIFICAR DOCUMENTACIÓN de propiedad (toggle)
        // ====================================================
        case 'verificarDoc': {
            $d  = cuerpo();
            $id = (int)($d['id'] ?? 0);
            $pdo->prepare("UPDATE productos SET documento_verificado = 1 - documento_verificado WHERE id = ?")->execute([$id]);
            $b = $pdo->prepare("SELECT documento_verificado FROM productos WHERE id = ?");
            $b->execute([$id]);
            responder(['ok' => true, 'verificado' => (int)$b->fetchColumn() === 1]);
            break;
        }

        // ====================================================
        // CONTROL DE TIEMPO — guardar offset global (ms)
        // ====================================================
        case 'offset': {
            $d   = cuerpo();
            $val = (int)($d['valor'] ?? 0);
            $sql = "INSERT INTO configuracion (clave, valor) VALUES ('offset_tiempo', ?)
                    ON DUPLICATE KEY UPDATE valor = VALUES(valor)";
            $pdo->prepare($sql)->execute([(string)$val]);
            responder(['ok' => true, 'offset' => $val]);
            break;
        }

        default:
            error('Acción no reconocida: ' . htmlspecialchars($accion), 404);
    }
} catch (PDOException $e) {
    error('Error de base de datos: ' . $e->getMessage(), 500);
}
