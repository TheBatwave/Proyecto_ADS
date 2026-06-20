<?php
// ============================================================
// conexion.php — Conexión PDO a MySQL (XAMPP)
// ============================================================
// Ajusta estas constantes solo si tu XAMPP usa otra config.
// Por defecto XAMPP trae: usuario "root" SIN contraseña.
// ============================================================

define('DB_HOST', 'localhost');
define('DB_NAME', 'subastanet');
define('DB_USER', 'root');
define('DB_PASS', '');          // XAMPP por defecto: vacío
define('DB_PORT', '3306');

function conectarBD() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $opciones = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        return new PDO($dsn, DB_USER, DB_PASS, $opciones);
    } catch (PDOException $e) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'error' => 'No se pudo conectar a la base de datos.',
            'detalle' => $e->getMessage()
        ]);
        exit;
    }
}
