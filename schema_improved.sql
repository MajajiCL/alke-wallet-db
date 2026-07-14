-- ==========================================
-- SCRIPT DE BASE DE DATOS MEJORADO: AlkeWallet
-- ==========================================

-- 1. CREACIÓN DE LA BASE DE DATOS Y SELECCIÓN
CREATE DATABASE IF NOT EXISTS AlkeWallet;
USE AlkeWallet;

-- Limpieza preventiva de tablas para permitir re-ejecución del script (testing)
DROP TABLE IF EXISTS transaccion;
DROP TABLE IF EXISTS usuario;
DROP TABLE IF EXISTS moneda;

-- 2. CREACIÓN DE LA TABLA MONEDA
-- Almacena las monedas soportadas por la plataforma.
CREATE TABLE moneda (
    currency_id INT AUTO_INCREMENT PRIMARY KEY,
    currency_name VARCHAR(50) NOT NULL,
    currency_symbol VARCHAR(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. CREACIÓN DE LA TABLA USUARIO
-- Incluye la relación con 'moneda' para definir en qué divisa está expresado su saldo,
-- y una restricción CHECK para asegurar que el saldo nunca sea negativo.
CREATE TABLE usuario (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo_electronico VARCHAR(100) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL, -- Almacena contraseñas hasheadas (e.g. Bcrypt)
    saldo DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    currency_id INT NOT NULL,
    
    -- Relaciones (Claves Foráneas)
    CONSTRAINT fk_usuario_moneda 
        FOREIGN KEY (currency_id) REFERENCES moneda(currency_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
        
    -- Restricciones de Integridad Lógica (Requiere MySQL 8.0.16+)
    CONSTRAINT chk_usuario_saldo 
        CHECK (saldo >= 0.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. CREACIÓN DE LA TABLA TRANSACCION
-- Registra los movimientos entre usuarios, forzando que el importe sea positivo,
-- que el emisor y receptor sean distintos, y asociando la moneda de la transacción.
CREATE TABLE transaccion (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    sender_user_id INT NOT NULL,
    receiver_user_id INT NOT NULL,
    currency_id INT NOT NULL,
    importe DECIMAL(15, 2) NOT NULL,
    transaction_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Relaciones (Claves Foráneas)
    CONSTRAINT fk_transaccion_sender 
        FOREIGN KEY (sender_user_id) REFERENCES usuario(user_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
        
    CONSTRAINT fk_transaccion_receiver 
        FOREIGN KEY (receiver_user_id) REFERENCES usuario(user_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
        
    CONSTRAINT fk_transaccion_moneda 
        FOREIGN KEY (currency_id) REFERENCES moneda(currency_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
        
    -- Restricciones de Integridad Lógica (Requiere MySQL 8.0.16+)
    CONSTRAINT chk_transaccion_importe 
        CHECK (importe > 0.00),
        
    CONSTRAINT chk_transaccion_diferentes_usuarios 
        CHECK (sender_user_id <> receiver_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- DATOS DE PRUEBA (SEEDS) PARA TESTEAR EL ESQUEMA
-- ==========================================

-- Insertar Monedas
INSERT INTO moneda (currency_name, currency_symbol) VALUES 
('Peso Chileno', 'CLP'),
('Dólar Estadounidense', 'USD'),
('Euro', 'EUR');

-- Insertar Usuarios de Prueba (Nota: contrasena es un hash de ejemplo)
INSERT INTO usuario (nombre, correo_electronico, contrasena, saldo, currency_id) VALUES 
('Juan Pérez', 'juan.perez@email.com', '$2b$10$xyz...', 50000.00, 1),      -- Saldo en CLP
('María Gómez', 'maria.gomez@email.com', '$2b$10$abc...', 120.50, 2),       -- Saldo en USD
('Carlos Plaza', 'carlos.plaza@email.com', '$2b$10$def...', 0.00, 1),       -- Saldo en CLP (comienza en 0)
('Ana López', 'ana.lopez@email.com', '$2b$10$ghi...', 300.00, 2);           -- Saldo en USD

-- Insertar Transacciones de Prueba
INSERT INTO transaccion (sender_user_id, receiver_user_id, currency_id, importe) VALUES 
(1, 3, 1, 15000.00),  -- Juan Pérez envía 15,000 CLP a Carlos Plaza (Moneda 1 = CLP)
(2, 4, 2, 50.00);     -- María Gómez envía 50 USD a Ana López (Moneda 2 = USD)

-- ==========================================
-- PRUEBAS DE RESTRICCIONES (Descomentar para testear fallos controlados)
-- ==========================================
-- 1. Intentar enviar saldo negativo (Debe fallar: chk_transaccion_importe)
-- INSERT INTO transaccion (sender_user_id, receiver_user_id, currency_id, importe) VALUES (1, 3, 1, -100.00);

-- 2. Intentar enviarse dinero a uno mismo (Debe fallar: chk_transaccion_diferentes_usuarios)
-- INSERT INTO transaccion (sender_user_id, receiver_user_id, currency_id, importe) VALUES (1, 1, 1, 100.00);

-- 3. Intentar crear usuario con saldo negativo (Debe fallar: chk_usuario_saldo)
-- INSERT INTO usuario (nombre, correo_electronico, contrasena, saldo, currency_id) VALUES ('Usuario Fallido', 'fail@email.com', '123', -50.00, 1);
