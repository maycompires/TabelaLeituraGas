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
const API_URL = 'http://localhost:3000/api';

// Função para alternar telas
function showScreen(screen) {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    screens[screen].classList.remove('hidden');
}

// Função para mostrar mensagem de feedback
function showFeedback(message, type = 'success') {
    const existingFeedback = document.querySelector('.feedback-message');
    if (existingFeedback) {
        existingFeedback.remove();
    }

    const feedback = document.createElement('div');
    feedback.className = `feedback-message ${type}`;
    feedback.textContent = message;

    const currentScreen = document.querySelector('.screen:not(.hidden)');
    const form = currentScreen.querySelector('form');
    if (form) {
        form.insertAdjacentElement('beforebegin', feedback);
    } else {
        currentScreen.insertAdjacentElement('afterbegin', feedback);
    }

    setTimeout(() => feedback.remove(), 5000);
}

// Autenticação
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const credential = document.getElementById('login-credential').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error);
        }

        currentUser = data;
        showScreen('dashboard');
        updateProgress();
        showFeedback(`Bem-vindo(a), ${currentUser.username}!`);
    } catch (error) {
        showFeedback(error.message, 'error');
    }
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    
    if (password.length < 6) {
        showFeedback('A senha deve ter pelo menos 6 caracteres', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error);
        }

        showFeedback('Registrado com sucesso! Faça login.', 'success');
        showScreen('login');
    } catch (error) {
        showFeedback(error.message, 'error');
    }
});

// Navegação
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
document.getElementById('new-reading-btn').addEventListener('click', async () => {
    if (confirm('Deseja criar uma nova leitura? Isso apagará todas as leituras existentes.')) {
        try {
            await fetch(`${API_URL}/readings`, { method: 'DELETE' });
            updateProgress();
            updateBlockCompletion();
            showFeedback('Nova leitura criada. Registre os novos valores.', 'warning');
        } catch (error) {
            showFeedback('Erro ao criar nova leitura', 'error');
        }
    }
});

// Registro de Leituras
async function loadApartments(block) {
    const container = document.getElementById('apartments');
    container.innerHTML = '';
    
    try {
        const response = await fetch(`${API_URL}/readings/block/${block}`);
        const readings = await response.json();
        
        const dateInput = document.getElementById('reading-date');
        const timeInput = document.getElementById('reading-time');
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
        timeInput.value = new Date().toTimeString().slice(0, 5);

        dateInput.addEventListener('change', validateDate);

        apartmentsPerBlock.forEach(apt => {
            const div = document.createElement('div');
            const reading = readings.find(r => r.apartment === apt);
            
            div.innerHTML = `
                <label>Apto ${apt}</label>
                <input type="number" min="0" value="${reading?.value || ''}" data-apt="${apt}">
            `;
            container.appendChild(div);

            const input = div.querySelector('input');
            input.addEventListener('input', () => saveReading(block, apt, input));
        });
    } catch (error) {
        showFeedback('Erro ao carregar apartamentos', 'error');
    }
}

function validateDate() {
    const dateInput = document.getElementById('reading-date');
    const selectedDate = new Date(dateInput.value);
    const minDate = new Date('2020-01-01');
    const today = new Date();
    if (selectedDate < minDate || selectedDate > today) {
        showFeedback('Data inválida. Selecionando data atual.', 'warning');
        dateInput.value = today.toISOString().split('T')[0];
    }
}

async function saveReading(block, apt, input) {
    const value = input.value;
    if (value < 0) {
        input.classList.add('invalid');
        showFeedback(`Valor inválido para o apartamento ${apt}`, 'error');
        return;
    }
    input.classList.remove('invalid');
    input.classList.add('valid');

    const date = document.getElementById('reading-date').value;
    const time = document.getElementById('reading-time').value;
    const timestamp = `${date} ${time}:00`;

    try {
        const response = await fetch(`${API_URL}/readings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                block,
                apt,
                value,
                user_id: currentUser.id,
                timestamp
            })
        });

        if (!response.ok) {
            throw new Error('Erro ao salvar leitura');
        }

        updateProgress();
        updateBlockCompletion();
    } catch (error) {
        showFeedback(error.message, 'error');
    }
}

// Progresso
async function updateProgress() {
    try {
        const response = await fetch(`${API_URL}/readings`);
        const readings = await response.json();
        const completed = readings.length;
        
        document.getElementById('progress').textContent = `${completed}/${totalApartments} concluídos`;
        document.getElementById('report-btn').disabled = completed !== totalApartments;
    } catch (error) {
        showFeedback('Erro ao atualizar progresso', 'error');
    }
}

document.getElementById('report-btn').addEventListener('click', () => {
    showScreen('report');
    generateReport();
});

// Relatório
async function generateReport() {
    try {
        const response = await fetch(`${API_URL}/readings`);
        const readings = await response.json();
        
        const tbody = document.getElementById('report-table');
        tbody.innerHTML = '';

        readings.sort((a, b) => {
            if (a.block === b.block) {
                return parseInt(a.apartment) - parseInt(b.apartment);
            }
            return a.block.localeCompare(b.block);
        });

        readings.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${r.block}</td>
                <td>${r.apartment}</td>
                <td>${r.value}</td>
                <td>${r.username}</td>
                <td>${new Date(r.timestamp).toLocaleString()}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        showFeedback('Erro ao gerar relatório', 'error');
    }
}

// Exportar para Excel
document.getElementById('export-excel').addEventListener('click', async () => {
    const exportBtn = document.getElementById('export-excel');
    exportBtn.classList.add('loading');
    
    try {
        const response = await fetch(`${API_URL}/readings`);
        const readings = await response.json();

        if (readings.length === 0) {
            showFeedback('Nenhuma leitura para exportar.', 'warning');
            return;
        }

        const wb = XLSX.utils.book_new();

        // Planilha principal
        const wsData = [
            ['Bloco', 'Apartamento', 'Leitura (m³)', 'Usuário', 'Data/Hora'],
            ...readings.map(r => [
                r.block,
                r.apartment,
                r.value,
                r.username,
                new Date(r.timestamp).toLocaleString()
            ])
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Leituras');

        // Exportar
        XLSX.writeFile(wb, 'GasTracker_Relatorio.xlsx');
        showFeedback('Relatório exportado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao exportar para Excel:', error);
        showFeedback('Erro ao gerar o arquivo Excel.', 'error');
    } finally {
        exportBtn.classList.remove('loading');
    }
});

document.getElementById('back-from-report').addEventListener('click', () => showScreen('dashboard'));

// Função para atualizar a porcentagem de conclusão dos blocos
async function updateBlockCompletion() {
    try {
        const response = await fetch(`${API_URL}/readings`);
        const readings = await response.json();
        const blocks = ['A', 'B', 'C', 'D'];
        
        blocks.forEach(block => {
            const blockReadings = readings.filter(r => r.block === block);
            const completion = Math.round((blockReadings.length / apartmentsPerBlock.length) * 100);
            const card = document.querySelector(`.card[data-block="${block}"] .completion`);
            if (card) {
                card.textContent = `${completion}% concluído`;
            }
        });
    } catch (error) {
        showFeedback('Erro ao atualizar progresso dos blocos', 'error');
    }
}

// Inicialização
showScreen('login');