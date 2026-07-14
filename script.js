// ==========================================
// ALKEWALLET DATABASE SIMULATOR (script.js)
// ==========================================

// 1. INITIAL DATABASE STATE (SEEDS)
const INITIAL_DATABASE = {
    moneda: [
        { currency_id: 1, currency_name: "Peso Chileno", currency_symbol: "CLP" },
        { currency_id: 2, currency_name: "Dólar Estadounidense", currency_symbol: "USD" },
        { currency_id: 3, currency_name: "Euro", currency_symbol: "EUR" }
    ],
    usuario: [
        { user_id: 1, nombre: "Juan Pérez", correo_electronico: "juan.perez@email.com", contrasena: "$2b$10$xyz...", saldo: 50000.00, currency_id: 1 },
        { user_id: 2, nombre: "María Gómez", correo_electronico: "maria.gomez@email.com", contrasena: "$2b$10$abc...", 120.50, currency_id: 2 },
        { user_id: 3, nombre: "Carlos Plaza", correo_electronico: "carlos.plaza@email.com", contrasena: "$2b$10$def...", 0.00, currency_id: 1 },
        { user_id: 4, nombre: "Ana López", correo_electronico: "ana.lopez@email.com", contrasena: "$2b$10$ghi...", 300.00, currency_id: 2 }
    ],
    transaccion: [
        { transaction_id: 1, sender_user_id: 1, receiver_user_id: 3, currency_id: 1, importe: 15000.00, transaction_date: "2026-07-14 10:23:45" },
        { transaction_id: 2, sender_user_id: 2, receiver_user_id: 4, currency_id: 2, importe: 50.00, transaction_date: "2026-07-14 14:45:12" }
    ]
};

// Exchange rates relative to CLP (Currency ID 1)
const EXCHANGE_RATES = {
    1: 1.0,       // CLP
    2: 800.0,     // USD = 800 CLP
    3: 900.0      // EUR = 900 CLP
};

// Local storage clone
let db = JSON.parse(JSON.stringify(INITIAL_DATABASE));
let nextTransactionId = 3;

// 2. DOM ELEMENTS
const txForm = document.getElementById("transaction-form");
const txSender = document.getElementById("tx-sender");
const txReceiver = document.getElementById("tx-receiver");
const txCurrency = document.getElementById("tx-currency");
const txAmount = document.getElementById("tx-amount");

const queryPresets = document.getElementById("query-presets");
const sqlEditor = document.getElementById("sql-editor");
const runSqlBtn = document.getElementById("run-sql-btn");
const resetDbBtn = document.getElementById("reset-db-btn");
const consoleOutput = document.getElementById("console-output");
const consoleStatus = document.getElementById("console-status");
const copySqlBtn = document.getElementById("copy-sql-btn");

const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

// 3. TAB NAVIGATION
tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        tabButtons.forEach(b => b.classList.remove("active"));
        tabContents.forEach(c => c.classList.remove("active"));
        
        btn.classList.add("active");
        const tabId = btn.getAttribute("data-tab");
        const activeTab = document.getElementById(tabId);
        activeTab.classList.add("active");

        if (tabId === 'tab-erd') {
            // Draw connector lines when ERD shows
            setTimeout(drawERDLines, 100);
        }
    });
});

// 4. DATABASE RENDER ENGINE
function renderDatabase(updatedIds = {}) {
    renderUsuarios(updatedIds.usuario || []);
    renderMonedas();
    renderTransacciones(updatedIds.transaccion || []);
    populateSelectOptions();
}

function renderUsuarios(highlightIds = []) {
    const tbody = document.querySelector("#table-usuario tbody");
    tbody.innerHTML = "";
    db.usuario.forEach(user => {
        const tr = document.createElement("tr");
        if (highlightIds.includes(user.user_id)) {
            tr.classList.add("update-flash");
        }
        const currency = db.moneda.find(m => m.currency_id === user.currency_id);
        const symbol = currency ? currency.currency_symbol : "";
        
        tr.innerHTML = `
            <td><strong>${user.user_id}</strong></td>
            <td>${user.nombre}</td>
            <td><code>${user.correo_electronico}</code></td>
            <td style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">${user.contrasena}</td>
            <td style="text-align: right; font-weight: 600; color: ${user.saldo > 0 ? 'var(--accent-emerald)' : 'var(--text-muted)'}">
                ${symbol} ${user.saldo.toFixed(2)}
            </td>
            <td><span class="badge badge-blue">ID: ${user.currency_id} (${symbol})</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderMonedas() {
    const tbody = document.querySelector("#table-moneda tbody");
    tbody.innerHTML = "";
    db.moneda.forEach(mon => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${mon.currency_id}</strong></td>
            <td>${mon.currency_name}</td>
            <td><span class="badge badge-blue">${mon.currency_symbol}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderTransacciones(highlightIds = []) {
    const tbody = document.querySelector("#table-transaccion tbody");
    tbody.innerHTML = "";
    // Show newest first
    const sortedTx = [...db.transaccion].sort((a, b) => b.transaction_id - a.transaction_id);
    sortedTx.forEach(tx => {
        const tr = document.createElement("tr");
        if (highlightIds.includes(tx.transaction_id)) {
            tr.classList.add("update-flash");
        }
        const sender = db.usuario.find(u => u.user_id === tx.sender_user_id);
        const receiver = db.usuario.find(u => u.user_id === tx.receiver_user_id);
        const currency = db.moneda.find(m => m.currency_id === tx.currency_id);
        const symbol = currency ? currency.currency_symbol : "";

        tr.innerHTML = `
            <td><strong>${tx.transaction_id}</strong></td>
            <td>${sender ? sender.nombre : 'Unknown'} <code>(ID: ${tx.sender_user_id})</code></td>
            <td>${receiver ? receiver.nombre : 'Unknown'} <code>(ID: ${tx.receiver_user_id})</code></td>
            <td><span class="badge badge-blue">${symbol}</span></td>
            <td style="font-weight: 600; color: var(--accent-purple); text-align: right;">
                ${symbol} ${tx.importe.toFixed(2)}
            </td>
            <td style="font-family: var(--font-mono); font-size: 11px;">${tx.transaction_date}</td>
        `;
        tbody.appendChild(tr);
    });
}

function populateSelectOptions() {
    // Save selected values
    const prevSender = txSender.value;
    const prevReceiver = txReceiver.value;
    const prevCurrency = txCurrency.value;

    txSender.innerHTML = "";
    txReceiver.innerHTML = "";
    txCurrency.innerHTML = "";

    // Add empty option or standard options
    db.usuario.forEach(u => {
        const currency = db.moneda.find(m => m.currency_id === u.currency_id);
        const label = `${u.nombre} (ID: ${u.user_id} - ${currency ? currency.currency_symbol : ''})`;
        
        const optSender = document.createElement("option");
        optSender.value = u.user_id;
        optSender.textContent = label;
        txSender.appendChild(optSender);

        const optReceiver = document.createElement("option");
        optReceiver.value = u.user_id;
        optReceiver.textContent = label;
        txReceiver.appendChild(optReceiver);
    });

    db.moneda.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m.currency_id;
        opt.textContent = `${m.currency_name} (${m.currency_symbol})`;
        txCurrency.appendChild(opt);
    });

    // Restore selected values if still valid
    if (prevSender) txSender.value = prevSender;
    if (prevReceiver) txReceiver.value = prevReceiver;
    if (prevCurrency) txCurrency.value = prevCurrency;
}

// 5. TRANSACTION SIMULATOR AND CONSTRAINT VALIDATIONS
txForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const senderId = parseInt(txSender.value);
    const receiverId = parseInt(txReceiver.value);
    const currencyId = parseInt(txCurrency.value);
    const amount = parseFloat(txAmount.value);

    // Get current date string
    const now = new Date();
    const dateStr = now.getFullYear() + '-' + 
        String(now.getMonth()+1).padStart(2, '0') + '-' + 
        String(now.getDate()).padStart(2, '0') + ' ' + 
        String(now.getHours()).padStart(2, '0') + ':' + 
        String(now.getMinutes()).padStart(2, '0') + ':' + 
        String(now.getSeconds()).padStart(2, '0');

    // Run Validations (Emulating SQL Constraints)
    
    // Constraint: chk_transaccion_importe (importe > 0)
    if (isNaN(amount) || amount <= 0) {
        logConsoleError(`Error: CONSTRAINT Violation (chk_transaccion_importe)\nSQL STATE: 23000\nMessage: El importe de la transacción debe ser mayor a 0.00. Recibido: ${amount}`);
        return;
    }

    // Constraint: chk_transaccion_diferentes_usuarios (sender != receiver)
    if (senderId === receiverId) {
        logConsoleError(`Error: CONSTRAINT Violation (chk_transaccion_diferentes_usuarios)\nSQL STATE: 23000\nMessage: El emisor y el receptor de la transacción deben ser usuarios diferentes (ID: ${senderId}).`);
        return;
    }

    const sender = db.usuario.find(u => u.user_id === senderId);
    const receiver = db.usuario.find(u => u.user_id === receiverId);
    const currency = db.moneda.find(m => m.currency_id === currencyId);

    if (!sender || !receiver) {
        logConsoleError("Error: FOREIGN KEY Violation. Uno de los usuarios especificados no existe.");
        return;
    }

    // Validation: Check currencies and balances
    // For a highly realistic multi-currency system, let's convert exchange values.
    // 1. Transaction currency to sender currency
    const senderCurrency = db.moneda.find(m => m.currency_id === sender.currency_id);
    const receiverCurrency = db.moneda.find(m => m.currency_id === receiver.currency_id);

    // Convert transaction amount to Sender's currency for balance check
    // exchange_rate_to_CLP = amount * EX_RATE[tx_currency]
    const amountInCLP = amount * EXCHANGE_RATES[currencyId];
    const amountInSenderCurrency = amountInCLP / EXCHANGE_RATES[sender.currency_id];
    const amountInReceiverCurrency = amountInCLP / EXCHANGE_RATES[receiver.currency_id];

    // Constraint: chk_usuario_saldo (sender balance must not go below 0)
    if (sender.saldo < amountInSenderCurrency) {
        logConsoleError(`Error: CONSTRAINT Violation (chk_usuario_saldo) en usuario ID: ${senderId}\nSQL STATE: 23000\nMessage: Saldo insuficiente. El saldo actual es ${senderCurrency.currency_symbol} ${sender.saldo.toFixed(2)}, pero se intentó descontar ${senderCurrency.currency_symbol} ${amountInSenderCurrency.toFixed(2)}.`);
        return;
    }

    // --- TRANSACTION IS VALID: EXECUTE COMMIT ---
    // Update sender balance
    sender.saldo -= amountInSenderCurrency;
    
    // Update receiver balance
    receiver.saldo += amountInReceiverCurrency;

    // Create transaction log
    const newTx = {
        transaction_id: nextTransactionId++,
        sender_user_id: senderId,
        receiver_user_id: receiverId,
        currency_id: currencyId,
        importe: amount,
        transaction_date: dateStr
    };
    db.transaccion.push(newTx);

    // Render updates and flash modified rows
    renderDatabase({
        usuario: [senderId, receiverId],
        transaccion: [newTx.transaction_id]
    });

    logConsoleSuccess(`Query OK, 3 rows affected (0.01 sec)\n\n-- TRANSACTION COMMITTED SUCCESSFULLY\nINSERT INTO transaccion (sender_user_id, receiver_user_id, currency_id, importe) VALUES (${senderId}, ${receiverId}, ${currencyId}, ${amount.toFixed(2)});\nUPDATE usuario SET saldo = saldo - ${amountInSenderCurrency.toFixed(2)} WHERE user_id = ${senderId};\nUPDATE usuario SET saldo = saldo + ${amountInReceiverCurrency.toFixed(2)} WHERE user_id = ${receiverId};`);
    
    // Reset form amount input
    txAmount.value = "";
});

// 6. SQL CONSOLE ENGINE
queryPresets.addEventListener("change", () => {
    const val = queryPresets.value;
    let sql = "";
    switch(val) {
        case "all-users":
            sql = "SELECT * FROM usuario;";
            break;
        case "all-transactions":
            sql = "SELECT * FROM transaccion ORDER BY transaction_date DESC;";
            break;
        case "all-currencies":
            sql = "SELECT * FROM moneda;";
            break;
        case "balances-by-currency":
            sql = "SELECT m.currency_name, SUM(u.saldo) AS saldo_total \nFROM usuario u \nJOIN moneda m ON u.currency_id = m.currency_id \nGROUP BY m.currency_name;";
            break;
        case "users-usd":
            sql = "SELECT * FROM usuario WHERE currency_id = 2; -- Usuarios con saldo en USD";
            break;
    }
    sqlEditor.value = sql;
});

runSqlBtn.addEventListener("click", () => {
    const sql = sqlEditor.value.trim().toLowerCase();
    
    if (sql.startsWith("select * from usuario where currency_id = 2")) {
        // Query users in USD
        const results = db.usuario.filter(u => u.currency_id === 2);
        formatTableOutput(results, ["user_id", "nombre", "correo_electronico", "saldo", "currency_id"]);
    } else if (sql.startsWith("select * from usuario")) {
        // All users
        formatTableOutput(db.usuario, ["user_id", "nombre", "correo_electronico", "saldo", "currency_id"]);
    } else if (sql.startsWith("select * from moneda")) {
        // All currencies
        formatTableOutput(db.moneda, ["currency_id", "currency_name", "currency_symbol"]);
    } else if (sql.startsWith("select * from transaccion")) {
        // All transactions
        formatTableOutput(db.transaccion, ["transaction_id", "sender_user_id", "receiver_user_id", "currency_id", "importe", "transaction_date"]);
    } else if (sql.includes("sum(u.saldo)") || sql.includes("sum(saldo)")) {
        // Group totals
        const totals = {};
        db.usuario.forEach(u => {
            const mon = db.moneda.find(m => m.currency_id === u.currency_id);
            const name = mon ? mon.currency_name : "Desconocido";
            if (!totals[name]) totals[name] = 0;
            totals[name] += u.saldo;
        });
        const results = Object.keys(totals).map(name => ({
            currency_name: name,
            saldo_total: totals[name].toFixed(2)
        }));
        formatTableOutput(results, ["currency_name", "saldo_total"]);
    } else {
        // Fallback for custom SQL
        logConsoleError(`Simulador SQL: Consulta no soportada. El playground solo soporta consultas del tipo SELECT sobre usuario, moneda, transaccion o sumatorias.`);
    }
});

resetDbBtn.addEventListener("click", () => {
    db = JSON.parse(JSON.stringify(INITIAL_DATABASE));
    nextTransactionId = 3;
    renderDatabase();
    logConsoleSuccess("-- DATABASE ROLLBACK COMPLETED --\nBase de datos restaurada al estado original de semilla.");
});

// Helper for outputs
function logConsoleSuccess(msg) {
    consoleStatus.textContent = "OK";
    consoleStatus.className = "success-status";
    consoleOutput.textContent = msg;
    consoleOutput.classList.remove("error-text");
}

function logConsoleError(msg) {
    consoleStatus.textContent = "ERROR";
    consoleStatus.className = "error-status";
    consoleOutput.textContent = msg;
    consoleOutput.classList.add("error-text");
}

function formatTableOutput(data, columns) {
    if (data.length === 0) {
        logConsoleSuccess("Empty set (0.00 sec)");
        return;
    }

    // Determine max length of each column
    const widths = {};
    columns.forEach(col => {
        widths[col] = col.length;
        data.forEach(row => {
            const val = String(row[col] !== undefined ? row[col] : "");
            if (val.length > widths[col]) {
                widths[col] = val.length;
            }
        });
    });

    // Build separators and header
    let separator = "+";
    let header = "|";
    columns.forEach(col => {
        separator += "-".repeat(widths[col] + 2) + "+";
        header += " " + col.padEnd(widths[col]) + " |";
    });

    let output = `${separator}\n${header}\n${separator}\n`;

    data.forEach(row => {
        let line = "|";
        columns.forEach(col => {
            const val = String(row[col] !== undefined ? row[col] : "");
            line += " " + val.padEnd(widths[col]) + " |";
        });
        output += line + "\n";
    });

    output += separator + `\n${data.length} row(s) in set (0.01 sec)`;
    logConsoleSuccess(output);
}

// 7. ERD DYNAMIC CONNECTING LINES DRAWING
function drawERDLines() {
    const svg = document.querySelector(".erd-svg-lines");
    if (!svg) return;

    svg.innerHTML = ""; // Clear old lines

    // Positions of cards relative to workspace
    const monedaCard = document.querySelector(".table-moneda-card");
    const usuarioCard = document.querySelector(".table-usuario-card");
    const transaccionCard = document.querySelector(".table-transaccion-card");

    if (!monedaCard || !usuarioCard || !transaccionCard) return;

    // Line 1: Moneda.currency_id (PK) -> Usuario.currency_id (FK)
    // Moneda: top-left (left: 40px, top: 50px). Field currency_id is 1st field.
    // Usuario: top-left (left: 360px, top: 180px). Field currency_id is 6th field.
    drawBezierCurve(svg, 290, 115, 360, 320, "#06b6d4", "1-N");

    // Line 2: Usuario.user_id (PK) -> Transaccion.sender_user_id (FK)
    // Usuario: user_id is 1st field (around y=240). Right edge (left + width) = 360 + 250 = 610.
    // Transaccion: sender_user_id is 2nd field (y=135). Left edge = 1600 - width - 40... relative in workspace.
    // Let's get actual coordinates inside container
    const wsRect = document.querySelector(".erd-diagram-workspace").getBoundingClientRect();
    const uRect = usuarioCard.getBoundingClientRect();
    const tRect = transaccionCard.getBoundingClientRect();

    const uX_right = uRect.right - wsRect.left;
    const uY_pk = uRect.top + 50 - wsRect.top;

    const tX_left = tRect.left - wsRect.left;
    const tY_sender = tRect.top + 75 - wsRect.top;
    const tY_receiver = tRect.top + 100 - wsRect.top;

    // Draw lines
    drawBezierCurve(svg, uX_right, uY_pk, tX_left, tY_sender, "#8b5cf6", "1-N (Emisor)");
    drawBezierCurve(svg, uX_right, uY_pk + 20, tX_left, tY_receiver, "#a78bfa", "1-N (Receptor)");
}

function drawBezierCurve(svg, x1, y1, x2, y2, color, label) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    // Control points for smooth horizontal S-curve
    const dx = Math.abs(x2 - x1) * 0.5;
    const cx1 = x1 + dx;
    const cy1 = y1;
    const cx2 = x2 - dx;
    const cy2 = y2;

    const d = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
    
    path.setAttribute("d", d);
    path.setAttribute("stroke", color);
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "none");
    path.setAttribute("opacity", "0.75");
    path.setAttribute("style", "transition: stroke 0.3s;");

    // Add marker for line ends
    path.setAttribute("marker-end", "url(#arrow)");
    path.setAttribute("marker-start", "url(#circle)");

    svg.appendChild(path);
}

// Draw ERD lines on window resize
window.addEventListener("resize", () => {
    if (document.getElementById("tab-erd").classList.contains("active")) {
        drawERDLines();
    }
});

// 8. OTHER INTERACTIVE ACTIONS
copySqlBtn.addEventListener("click", () => {
    const code = document.getElementById("sql-code-display").textContent;
    navigator.clipboard.writeText(code).then(() => {
        copySqlBtn.innerHTML = `<i class="fa-solid fa-check" style="color: var(--accent-emerald)"></i> Copiado`;
        setTimeout(() => {
            copySqlBtn.innerHTML = `<i class="fa-regular fa-copy"></i> Copiar Código`;
        }, 2000);
    });
});

// 9. INITIALIZATION
renderDatabase();
sqlEditor.value = "SELECT * FROM usuario;";
logConsoleSuccess("-- CONSOLA DE PRUEBA SQL INICIALIZADA --\nSelecciona una consulta o ejecuta transacciones en el formulario.");
