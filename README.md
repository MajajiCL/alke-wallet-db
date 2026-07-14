# AlkeWallet Database Schema & Testing Guide

Este proyecto contiene el diseño de base de datos relacional para **AlkeWallet**, una aplicación de billetera digital. Incluye la versión original del diseño, una versión mejorada con mejores prácticas de base de datos relacionales, y datos de prueba para validación.

---

## Estructura del Proyecto

El repositorio consta de los siguientes archivos:
*   [schema.sql](file:///C:/Users/mandr/.gemini/antigravity/scratch/alke-wallet-db/schema.sql): El diseño de base de datos original que nos proporcionaste.
*   [schema_improved.sql](file:///C:/Users/mandr/.gemini/antigravity/scratch/alke-wallet-db/schema_improved.sql): El diseño mejorado con correcciones lógicas, claves foráneas adecuadas, restricciones de integridad y semillas de datos (seeds) para pruebas rápidas.

---

## Análisis y Mejoras Aplicadas

### 1. Relación de la tabla `moneda`
*   **Problema Original**: La tabla `moneda` existía pero no estaba enlazada mediante claves foráneas a ninguna otra tabla del sistema. Esto hacía imposible saber en qué divisa estaba expresado el `saldo` de un usuario o el `importe` de una transacción.
*   **Solución**: Se añadió una relación de clave foránea `currency_id` en las tablas `usuario` (indicando la divisa de su balance) y `transaccion` (indicando la divisa del dinero transferido).

### 2. Integridad de los Datos y Reglas de Negocio (Constraints)
*   **Saldos Negativos**: En la tabla `usuario`, agregamos un `CONSTRAINT CHECK (saldo >= 0.00)`. Esto previene a nivel de base de datos que una billetera quede con saldo negativo por un sobregiro no permitido.
*   **Importes Negativos**: En la tabla `transaccion`, agregamos un `CONSTRAINT CHECK (importe > 0.00)`. Ninguna transacción válida en una billetera puede tener un monto negativo o de 0.
*   **Autotransacciones**: Agregamos la restricción `CONSTRAINT CHECK (sender_user_id <> receiver_user_id)` para asegurar que un usuario no se envíe dinero a sí mismo, previniendo errores de sistema o fraude básico.

### 3. Rendimiento y Seguridad Referencial
*   **Motor InnoDB**: Forzamos el uso de `ENGINE=InnoDB` para asegurar soporte completo a transacciones ACID y restricciones de llaves foráneas.
*   **Comportamiento Referential**: Agregamos directivas `ON DELETE RESTRICT ON UPDATE CASCADE` en las claves foráneas para evitar que se eliminen monedas o usuarios si existen transacciones asociadas a ellos.
*   **Seeders**: Se añadieron sentencias `INSERT` al final de [schema_improved.sql](file:///C:/Users/mandr/.gemini/antigravity/scratch/alke-wallet-db/schema_improved.sql) con monedas (CLP, USD, EUR), usuarios y transacciones de prueba.

---

## Cómo Probar la Base de Datos

Puedes probar este esquema de las siguientes maneras:

### Opción A: Base de Datos Local (MySQL)
Si tienes MySQL o MariaDB instalado localmente, puedes correr el script desde la terminal o usando interfaces como phpMyAdmin, DBeaver o MySQL Workbench:

```bash
mysql -u tu_usuario -p < schema_improved.sql
```

### Opción B: Cloud Database (Recomendado para pruebas rápidas)
Si deseas una base de datos gratuita en la nube para testear rápido:
1. Regístrate en plataformas como [Railway](https://railway.app), [Neon](https://neon.tech) o [Supabase](https://supabase.com) (aunque Supabase usa PostgreSQL, la lógica relacional es muy similar).
2. Crea una instancia de MySQL.
3. Copia y pega el contenido de [schema_improved.sql](file:///C:/Users/mandr/.gemini/antigravity/scratch/alke-wallet-db/schema_improved.sql) en su consola SQL o cliente conectado para ejecutarlo.

### Pruebas de Fallo Controlado
Al final del script [schema_improved.sql](file:///C:/Users/mandr/.gemini/antigravity/scratch/alke-wallet-db/schema_improved.sql), hay un bloque comentado llamado `PRUEBAS DE RESTRICCIONES`. Si descomentas cualquiera de estas líneas y vuelves a ejecutar el script, la base de datos debería arrojar un error bloqueando la inserción, demostrando que las reglas de negocio están activas y protegiendo tus datos.
