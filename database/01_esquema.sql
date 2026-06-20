-- ============================================================
-- SubastaNet — Esquema de Base de Datos (Normalizado, 3FN)
-- Motor: MySQL / MariaDB (XAMPP)
-- ============================================================
-- Orden de uso:
--   1) Ejecuta este archivo (01_esquema.sql)  -> crea la BD y las tablas
--   2) Ejecuta luego  02_datos.sql            -> inserta los 200 productos
-- ============================================================

CREATE DATABASE IF NOT EXISTS subastanet
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE subastanet;
SET NAMES utf8mb4;

-- Para poder re-ejecutar sin errores, eliminamos en orden inverso de dependencia
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS pujas;
DROP TABLE IF EXISTS producto_atributos;
DROP TABLE IF EXISTS imagenes_producto;
DROP TABLE IF EXISTS fechas_editadas;
DROP TABLE IF EXISTS vendedor_metodo_envio;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS metodos_envio;
DROP TABLE IF EXISTS vendedores;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS configuracion;
SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- CATEGORIAS
-- ------------------------------------------------------------
CREATE TABLE categorias (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  nombre  VARCHAR(60) NOT NULL UNIQUE,
  icono   VARCHAR(10)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- VENDEDORES
-- ------------------------------------------------------------
CREATE TABLE vendedores (
  id                VARCHAR(10) PRIMARY KEY,          -- p.ej. V001
  nombre            VARCHAR(120) NOT NULL,
  historial_ventas  INT DEFAULT 0,
  calificacion      DECIMAL(2,1) DEFAULT 0
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- METODOS DE ENVIO  (catálogo)
-- ------------------------------------------------------------
CREATE TABLE metodos_envio (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  nombre  VARCHAR(80) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- VENDEDOR <-> METODO DE ENVIO  (relación N:M)
-- ------------------------------------------------------------
CREATE TABLE vendedor_metodo_envio (
  vendedor_id  VARCHAR(10) NOT NULL,
  metodo_id    INT NOT NULL,
  PRIMARY KEY (vendedor_id, metodo_id),
  FOREIGN KEY (vendedor_id) REFERENCES vendedores(id) ON DELETE CASCADE,
  FOREIGN KEY (metodo_id)   REFERENCES metodos_envio(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- USUARIOS  (administrador / visitante)
-- ------------------------------------------------------------
CREATE TABLE usuarios (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  correo      VARCHAR(120) NOT NULL UNIQUE,
  contrasena  VARCHAR(64)  NOT NULL,                  -- hash SHA2-256
  rol         ENUM('administrador','visitante') NOT NULL DEFAULT 'visitante',
  activo      TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- PRODUCTOS  (artículo en subasta)
-- ------------------------------------------------------------
CREATE TABLE productos (
  id                  INT PRIMARY KEY,
  titulo              VARCHAR(200) NOT NULL,
  descripcion         TEXT,
  categoria_id        INT NOT NULL,
  condicion           VARCHAR(20),
  imagen              VARCHAR(255),                   -- imagen principal
  ubicacion           VARCHAR(200),
  precio_inicial      DECIMAL(12,2) NOT NULL,
  incremento_minimo   DECIMAL(12,2) DEFAULT 0,
  fecha_inicio        DATE,
  fecha_fin           DATE,
  cantidad_disponible INT DEFAULT 1,
  tipo_subasta        ENUM('Inglesa','Holandesa','Sellada') NOT NULL,
  estado              ENUM('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'pendiente',
  baneado             TINYINT(1) NOT NULL DEFAULT 0,
  documento_propiedad  VARCHAR(255) NULL,                -- imagen del documento (escritura/factura/certificado)
  documento_verificado TINYINT(1) NOT NULL DEFAULT 0,    -- el admin valida la propiedad
  motivo_cancelacion   VARCHAR(255) NULL,                -- motivo cuando el admin cancela/rechaza
  vendedor_id         VARCHAR(10),
  FOREIGN KEY (categoria_id) REFERENCES categorias(id),
  FOREIGN KEY (vendedor_id)  REFERENCES vendedores(id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- IMAGENES DE PRODUCTO  (galería 1:N)
-- ------------------------------------------------------------
CREATE TABLE imagenes_producto (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  producto_id  INT NOT NULL,
  url          VARCHAR(255) NOT NULL,
  orden        INT DEFAULT 0,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- ATRIBUTOS DE PRODUCTO  (infoExtra variable por categoría)
-- Modelo Entidad-Atributo-Valor: permite atributos distintos
-- para inmuebles, vehículos, etc. sin columnas vacías.
-- ------------------------------------------------------------
CREATE TABLE producto_atributos (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  producto_id  INT NOT NULL,
  nombre       VARCHAR(60) NOT NULL,
  valor        VARCHAR(255),
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- PUJAS / OFERTAS  (preparada para cuando el visitante registrado puje)
-- ------------------------------------------------------------
CREATE TABLE pujas (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  producto_id  INT NOT NULL,
  usuario_id   INT NOT NULL,
  monto        DECIMAL(12,2) NOT NULL,
  fecha        DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id)  REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- FECHAS EDITADAS  (override del admin para la demo, conserva originales)
-- ------------------------------------------------------------
CREATE TABLE fechas_editadas (
  producto_id   INT PRIMARY KEY,
  fecha_inicio  DATE,
  fecha_fin     DATE,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- CONFIGURACION  (clave-valor: control de tiempo global, etc.)
-- ------------------------------------------------------------
CREATE TABLE configuracion (
  clave  VARCHAR(50) PRIMARY KEY,
  valor  VARCHAR(255)
) ENGINE=InnoDB;
