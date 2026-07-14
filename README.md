# AlkeWallet Database Schema & Interactive Playground

Este proyecto contiene el diseño de base de datos relacional para **AlkeWallet**, una aplicación de billetera digital. Incluye la versión original del diseño, una versión mejorada con mejores prácticas de base de datos relacionales, datos de prueba para validación y un **simulador web interactivo en tiempo real**.

🚀 **[Ver el Simulador Interactivo Online (GitHub Pages)](https://MajajiCL.github.io/alke-wallet-db/)**

---

## Estructura del Proyecto

El repositorio consta de los siguientes archivos:
*   [index.html](file:///C:/Users/mandr/.gemini/antigravity/scratch/alke-wallet-db/index.html), [style.css](file:///C:/Users/mandr/.gemini/antigravity/scratch/alke-wallet-db/style.css), [script.js](file:///C:/Users/mandr/.gemini/antigravity/scratch/alke-wallet-db/script.js): Código de la interfaz interactiva web y del motor de simulación de base de datos.
*   [schema.sql](file:///C:/Users/mandr/.gemini/antigravity/scratch/alke-wallet-db/schema.sql): El diseño de base de datos original que nos proporcionaste.
*   [schema_improved.sql](file:///C:/Users/mandr/.gemini/antigravity/scratch/alke-wallet-db/schema_improved.sql): El diseño mejorado con correcciones lógicas, claves foráneas adecuadas, restricciones de integridad y semillas de datos (seeds) para pruebas rápidas.

---

## Características de la Aplicación Web (Simulador)

Para que puedas evaluar y probar la base de datos de inmediato sin instalar nada localmente, creamos un playground interactivo con:
1.  **Simulación del Motor SQL**: Un motor simulado en memoria escrito en JavaScript que replica las restricciones e inserciones de MySQL.
2.  **Validación de Restricciones (Constraints)**:
    *   `chk_transaccion_importe`: Comprueba que no puedas realizar transacciones con importes menores o iguales a `0.00`.
    *   `chk_transaccion_diferentes_usuarios`: Valida que no puedas transferir saldo a tu propia cuenta.
    *   `chk_usuario_saldo`: Evita sobregiros impidiendo que el saldo de un emisor quede por debajo de `0.00`.
3.  **Conversión de Divisas en Tiempo Real**: Si transfieres dólares (`USD`) a un usuario con pesos (`CLP`), el simulador realiza la conversión automáticamente utilizando tasas de cambio integradas, reflejando saldos exactos en las respectivas tablas.
4.  **Consola SQL de Lectura**: Puedes seleccionar consultas preparadas (e.g. balances por divisa, transacciones ordenadas) o ingresar comandos personalizados sobre las tablas del sistema y ver el resultado formateado en formato tabla ASCII.
5.  **Diagrama Entidad-Relación (ERD)**: Visualiza las tablas de forma gráfica con conexiones dinámicas que unen las claves primarias (`PK`) y secundarias (`FK`).

---

## Análisis y Mejoras Aplicadas en SQL

### 1. Relación de la tabla `moneda`
*   **Problema Original**: La tabla `moneda` existía pero no estaba enlazada mediante claves foráneas a ninguna otra tabla del sistema. Esto hacía imposible saber en qué divisa estaba expresado el `saldo` de un usuario o el `importe` de una transacción.
*   **Solución**: Se añadió una relación de clave foránea `currency_id` en las tablas `usuario` (indicando la divisa de su balance) y `transaccion` (indicando la divisa del dinero transferido).

### 2. Integridad de los Datos y Reglas de Negocio (Constraints)
*   **Saldos Negativos**: En la tabla `usuario`, agregamos un `CONSTRAINT CHECK (saldo >= 0.00)`. Esto previene a nivel de base de datos que una billetera quede con saldo negativo.
*   **Importes Negativos**: En la tabla `transaccion`, agregamos un `CONSTRAINT CHECK (importe > 0.00)`. Ninguna transacción puede tener un monto negativo o de cero.
*   **Autotransacciones**: Agregamos la restricción `CONSTRAINT CHECK (sender_user_id <> receiver_user_id)` para asegurar que un usuario no se envíe dinero a sí mismo.

### 3. Rendimiento y Seguridad Referencial
*   **Motor InnoDB**: Forzamos el uso de `ENGINE=InnoDB` para asegurar soporte completo a transacciones ACID y restricciones de llaves foráneas.
*   **Comportamiento Referential**: Agregamos directivas `ON DELETE RESTRICT ON UPDATE CASCADE` en las claves foráneas.
*   **Seeders**: Se añadieron sentencias `INSERT` para poblar monedas (CLP, USD, EUR), usuarios y transacciones de prueba.

---

## Cómo Probar en MySQL Local
Si tienes MySQL o MariaDB instalado localmente:

```bash
mysql -u tu_usuario -p < schema_improved.sql
```

Puedes descomentar el bloque `PRUEBAS DE RESTRICCIONES` al final del archivo para ver cómo el motor de base de datos aborta las transacciones inválidas con un código de error, demostrando que tu base de datos está protegida.
