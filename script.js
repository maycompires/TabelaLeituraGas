// Elementos DOM
const screens = {
    login: document.getElementById('login-screen'),
    register: document.getElementById('register-screen'),
    dashboard: document.getElementById('dashboard-screen'),
    reading: document.getElementById('reading-screen'),
    report: document.getElementById('report-screen')
};

// Dados
let currentUser = null;
const apartmentsPerBlock = ['01', '02', '03', '101', '102', '103', '104', '105', '106', '107', '108', '109', '110', '111', '112', '201', '202', '203', '204', '205', '206', '207', '208', '209', '210', '211', '212', '301', '302'];
const totalApartments = 116;

// Função para alternar telas
function showScreen(screen) {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    screens[screen].classList.remove('hidden');
}

// Autenticação
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const credential = document.getElementById('login-credential').value;
    const password = document.getElementById('login-password').value;
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => (u.username === credential || u.email === credential) && u.password === password);
    if (user) {
        currentUser = user.username;
        showScreen('dashboard');
        updateProgress();
    } else {
        alert('Usuário/E-mail ou senha inválidos');
    }
});

document.getElementById('register-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.some(u => u.email === email || u.username === username)) {
        alert('E-mail ou usuário já registrado');
        return;
    }
    users.push({ email, username, password });
    localStorage.setItem('users', JSON.stringify(users));
    alert('Registrado com sucesso! Faça login.');
    showScreen('login');
});

document.getElementById('show-register').addEventListener('click', () => showScreen('register'));
document.getElementById('show-login').addEventListener('click', () => showScreen('login'));
document.getElementById('logout').addEventListener('click', () => {
    currentUser = null;
    showScreen('login');
});

// Esqueceu a senha
document.getElementById('forgot-password').addEventListener('click', (e) => {
    e.preventDefault();
    const email = prompt('Digite seu e-mail para recuperar a senha:');
    if (!email) return;
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email);
    if (user) {
        alert(`Um e-mail de recuperação foi enviado para ${email}. (Simulação - verifique seu console)`);
        console.log(`Simulação de envio de e-mail para ${email} com instruções de recuperação.`);
    } else {
        alert('E-mail não encontrado.');
    }
});

// Dashboard
document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => {
        const block = card.dataset.block;
        showScreen('reading');
        document.getElementById('block-title').textContent = `Bloco ${block}`;
        loadApartments(block);
    });
});

document.getElementById('back-to-dashboard').addEventListener('click', () => {
    showScreen('dashboard');
    updateProgress();
});

// Botão Criar Nova Leitura
document.getElementById('new-reading-btn').addEventListener('click', () => {
    if (confirm('Deseja criar uma nova leitura? Isso apagará todas as leituras existentes.')) {
        localStorage.removeItem('readings');
        updateProgress();
        alert('Nova leitura criada. Registre os novos valores.');
    }
});

// Registro de Leituras
function loadApartments(block) {
    const container = document.getElementById('apartments');
    container.innerHTML = '';
    const readings = JSON.parse(localStorage.getItem('readings') || '[]');
    
    const dateInput = document.getElementById('reading-date');
    const timeInput = document.getElementById('reading-time');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    timeInput.value = new Date().toTimeString().slice(0, 5);

    dateInput.addEventListener('change', validateDate);

    apartmentsPerBlock.forEach(apt => {
        const div = document.createElement('div');
        const id = `${block}-${apt}`;
        const reading = readings.find(r => r.id === id);
        
        div.innerHTML = `
            <label>Apto ${apt}</label>
            <input type="number" min="0" value="${reading?.value || ''}" data-id="${id}">
        `;
        container.appendChild(div);

        const input = div.querySelector('input');
        input.addEventListener('input', () => saveReading(block, apt, input));
    });
    console.log(`Apartamentos do bloco ${block} renderizados:`, apartmentsPerBlock.length);
}

function validateDate() {
    const dateInput = document.getElementById('reading-date');
    const selectedDate = new Date(dateInput.value);
    const minDate = new Date('2020-01-01');
    const today = new Date();
    if (selectedDate < minDate || selectedDate > today) {
        alert('Data inválida. Selecionando data atual.');
        dateInput.value = today.toISOString().split('T')[0];
    }
}

function saveReading(block, apt, input) {
    const value = input.value;
    if (value < 0) {
        input.classList.add('invalid');
        return;
    }
    input.classList.remove('invalid');
    input.classList.add('valid');

    const readings = JSON.parse(localStorage.getItem('readings') || '[]');
    const id = `${block}-${apt}`;
    const index = readings.findIndex(r => r.id === id);
    const date = document.getElementById('reading-date').value;
    const time = document.getElementById('reading-time').value;

    const reading = {
        id,
        block,
        apt,
        value,
        user: currentUser,
        timestamp: `${date} ${time}:00`
    };

    if (index >= 0) readings[index] = reading;
    else readings.push(reading);

    localStorage.setItem('readings', JSON.stringify(readings));
    updateProgress();
}

// Progresso
function updateProgress() {
    const readings = JSON.parse(localStorage.getItem('readings') || '[]');
    const completed = readings.length;
    document.getElementById('progress').textContent = `${completed}/${totalApartments} concluídos`;
    document.getElementById('report-btn').disabled = completed !== totalApartments;
}

document.getElementById('report-btn').addEventListener('click', () => {
    showScreen('report');
    generateReport();
});

// Relatório
function generateReport() {
    const readings = JSON.parse(localStorage.getItem('readings') || '[]');
    const tbody = document.getElementById('report-table');
    tbody.innerHTML = '';

    readings.sort((a, b) => {
        if (a.block === b.block) {
            return parseInt(a.apt) - parseInt(b.apt);
        }
        return a.block.localeCompare(b.block);
    });

    readings.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${r.block}</td>
            <td>${r.apt}</td>
            <td>${r.value}</td>
            <td>${r.user}</td>
            <td>${r.timestamp}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Funções de análise de dados
function detectAnomalies(readings) {
    const valuesByBlock = {};
    readings.forEach(r => {
        if (!valuesByBlock[r.block]) valuesByBlock[r.block] = [];
        valuesByBlock[r.block].push(parseFloat(r.value));
    });

    const anomalies = [];
    Object.keys(valuesByBlock).forEach(block => {
        const values = valuesByBlock[block].sort((a, b) => a - b);
        const q1 = values[Math.floor(values.length * 0.25)];
        const q3 = values[Math.floor(values.length * 0.75)];
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;

        readings.forEach(r => {
            if (r.block === block) {
                const value = parseFloat(r.value);
                if (value < lowerBound || value > upperBound) {
                    anomalies.push({ ...r, reason: 'Fora do intervalo interquartil' });
                }
            }
        });
    });

    return anomalies;
}

function getTop10Highest(readings) {
    return readings
        .map(r => ({ ...r, value: parseFloat(r.value) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, Math.min(10, readings.length));
}

function getTop10Lowest(readings) {
    return readings
        .map(r => ({ ...r, value: parseFloat(r.value) }))
        .filter(r => r.value > 0)
        .sort((a, b) => a.value - b.value)
        .slice(0, Math.min(10, readings.length));
}

function getAverageConsumption(readings) {
    const byBlock = {};
    const byApartment = {};

    readings.forEach(r => {
        const value = parseFloat(r.value);
        if (!byBlock[r.block]) {
            byBlock[r.block] = { sum: 0, count: 0, values: [] };
        }
        byBlock[r.block].sum += value;
        byBlock[r.block].count += 1;
        byBlock[r.block].values.push(value);

        const aptKey = `${r.block}-${r.apt}`;
        if (!byApartment[aptKey]) {
            byApartment[aptKey] = { sum: 0, count: 0, block: r.block, apt: r.apt, values: [] };
        }
        byApartment[aptKey].sum += value;
        byApartment[aptKey].count += 1;
        byApartment[aptKey].values.push(value);
    });

    const blockAvg = Object.keys(byBlock).map(block => {
        const mean = byBlock[block].sum / byBlock[block].count;
        const variance = byBlock[block].values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / byBlock[block].count;
        return { block, average: mean, stdDev: Math.sqrt(variance) };
    });

    const aptAvg = Object.keys(byApartment).map(aptKey => {
        const mean = byApartment[aptKey].sum / byApartment[aptKey].count;
        const variance = byApartment[aptKey].values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / byApartment[aptKey].count;
        return { block: byApartment[aptKey].block, apt: byApartment[aptKey].apt, average: mean, stdDev: Math.sqrt(variance) };
    });

    return { blockAvg, aptAvg };
}

// Exportar para Excel
document.getElementById('export-excel').addEventListener('click', () => {
    const readings = JSON.parse(localStorage.getItem('readings') || '[]');
    if (!readings.length) {
        alert('Nenhuma leitura para exportar.');
        return;
    }

    readings.sort((a, b) => {
        if (a.block === b.block) {
            return parseInt(a.apt) - parseInt(b.apt);
        }
        return a.block.localeCompare(b.block);
    });

    const anomalies = detectAnomalies(readings);
    const top10Highest = getTop10Highest(readings);
    const top10Lowest = getTop10Lowest(readings);
    const { blockAvg, aptAvg } = getAverageConsumption(readings);

    const wb = XLSX.utils.book_new();

    const wsLeituras = XLSX.utils.aoa_to_sheet([
        ['Bloco', 'Apartamento', 'Leitura (m³)', 'Usuário', 'Data/Hora'],
        ...readings.map(r => [r.block, r.apt, r.value, r.user, r.timestamp])
    ]);
    XLSX.utils.book_append_sheet(wb, wsLeituras, 'Leituras');

    const wsAnomalias = XLSX.utils.aoa_to_sheet([
        ['Bloco', 'Apartamento', 'Leitura (m³)', 'Usuário', 'Data/Hora', 'Motivo'],
        ...anomalies.map(r => [r.block, r.apt, r.value, r.user, r.timestamp, r.reason])
    ]);
    XLSX.utils.book_append_sheet(wb, wsAnomalias, 'Anomalias');

    const wsTop10High = XLSX.utils.aoa_to_sheet([
        ['Bloco', 'Apartamento', 'Leitura (m³)', 'Usuário', 'Data/Hora'],
        ...top10Highest.map(r => [r.block, r.apt, r.value, r.user, r.timestamp])
    ]);
    XLSX.utils.book_append_sheet(wb, wsTop10High, 'Top 10 Maior');

    const wsTop10Low = XLSX.utils.aoa_to_sheet([
        ['Bloco', 'Apartamento', 'Leitura (m³)', 'Usuário', 'Data/Hora'],
        ...top10Lowest.map(r => [r.block, r.apt, r.value, r.user, r.timestamp])
    ]);
    XLSX.utils.book_append_sheet(wb, wsTop10Low, 'Top 10 Menor');

    const wsBlockAvg = XLSX.utils.aoa_to_sheet([
        ['Bloco', 'Média (m³)', 'Desvio Padrão'],
        ...blockAvg.map(b => [b.block, b.average.toFixed(2), b.stdDev.toFixed(2)])
    ]);
    XLSX.utils.book_append_sheet(wb, wsBlockAvg, 'Média por Bloco');

    const wsAptAvg = XLSX.utils.aoa_to_sheet([
        ['Bloco', 'Apartamento', 'Média (m³)', 'Desvio Padrão'],
        ...aptAvg.map(a => [a.block, a.apt, a.average.toFixed(2), a.stdDev.toFixed(2)])
    ]);
    XLSX.utils.book_append_sheet(wb, wsAptAvg, 'Média por Apto');

    try {
        XLSX.writeFile(wb, 'GasTracker_Relatorio.xlsx');
        console.log('Arquivo Excel exportado com sucesso.');
    } catch (error) {
        console.error('Erro ao exportar para Excel:', error);
        alert('Erro ao gerar o arquivo Excel. Verifique o console.');
    }
});

document.getElementById('back-from-report').addEventListener('click', () => showScreen('dashboard'));

// Inicialização
if (localStorage.getItem('users')) showScreen('login');
else showScreen('register');