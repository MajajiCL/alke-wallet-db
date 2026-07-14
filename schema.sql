-- 1. CREACIÓN DE LA BASE DE DATOS Y SELECCIÓN
CREATE DATABASE AlkeWallet;
USE AlkeWallet;

-- 2. CREACIÓN DE LA TABLA MONEDA
-- Creamos esta primero porque no depende de ninguna otra tabla.
CREATE TABLE moneda (
    currency_id INT AUTO_INCREMENT PRIMARY KEY,
    currency_name VARCHAR(50) NOT NULL,
    currency_symbol VARCHAR(10) NOT NULL
);

-- 3. CREACIÓN DE LA TABLA USUARIO
-- Incluimos el saldo y los datos básicos del usuario.
CREATE TABLE usuario (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo_electronico VARCHAR(100) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    saldo DECIMAL(15, 2) NOT NULL DEFAULT 0.00
);

-- 4. CREACIÓN DE LA TABLA TRANSACCION
-- Esta se crea al final porque necesita enlazarse con los IDs de la tabla usuario.
CREATE TABLE transaccion (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    sender_user_id INT NOT NULL,
    receiver_user_id INT NOT NULL,
    importe DECIMAL(15, 2) NOT NULL,
    transaction_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
   -- Configuración de Llaves Foráneas (Relaciones)
    FOREIGN KEY (sender_user_id) REFERENCES usuario(user_id),
    FOREIGN KEY (receiver_user_id) REFERENCES usuario(user_id)
);
