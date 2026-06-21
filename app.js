// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();

// Адрес для GRAM платежей
const GRAM_WALLET = 'UQChG5EgS8Evty9pSf-3GKxVRIeWqQ70jjWo_xo-YABWknbO';

// Состояние GAR майнера
let garState = {
    balance: 0,
    gramBalance: 0,
    hashrate: 1,
    equipment: {
        v1: 0,
        v2: 0,
        farm: 0,
        quantum: 0
    },
    upgrades: {
        overclock: false,
        cooling: false,
        crystal: false
    },
    blocks: 0,
    totalMined: 0,
    pendingPayments: [] // Ожидающие платежи GRAM
};

// Конфигурация
const GAR_CONFIG = {
    USD_PRICE: 0.05,
    BLOCK_REWARD: 50,
    GRAM_BLOCK_REWARD: 5,
    BLOCK_DIFFICULTY: 1000
};

// Мощности оборудования
const EQUIPMENT_POWER = {
    v1: 5,
    v2: 25,
    farm: 100,
    quantum: 500
};

// Стоимость оборудования в GAR
const EQUIPMENT_COST = {
    v1: 10,
    v2: 50,
    farm: 200,
    quantum: 1000
};

// Стоимость улучшений в GRAM
const UPGRADE_COST_GRAM = {
    overclock: 10,
    cooling: 25,
    crystal: 50
};

// Ранги майнера
const RANKS = [
    'Новичок',
    'Любитель',
    'Опытный',
    'Профессионал',
    'Эксперт',
    'Мастер',
    'Грандмастер',
    'Легенда GAR'
];

// Загрузка сохранений
function loadGame() {
    const saved = localStorage.getItem('garMinerState');
    if (saved) {
        garState = { ...garState, ...JSON.parse(saved) };
    }
}

// Сохранение
function saveGame() {
    localStorage.setItem('garMinerState', JSON.stringify(garState));
}

// Расчет хешрейта
function calculateHashrate() {
    let baseHashrate = 1;
    
    baseHashrate += garState.equipment.v1 * EQUIPMENT_POWER.v1;
    baseHashrate += garState.equipment.v2 * EQUIPMENT_POWER.v2;
    baseHashrate += garState.equipment.farm * EQUIPMENT_POWER.farm;
    baseHashrate += garState.equipment.quantum * EQUIPMENT_POWER.quantum;
    
    if (garState.upgrades.overclock) {
        baseHashrate *= 1.25;
    }
    
    if (garState.upgrades.crystal) {
        baseHashrate *= 2;
    }
    
    return Math.floor(baseHashrate);
}

// Расчет ранга
function calculateRank() {
    const totalPower = calculateHashrate();
    if (totalPower >= 10000) return 7;
    if (totalPower >= 5000) return 6;
    if (totalPower >= 2000) return 5;
    if (totalPower >= 1000) return 4;
    if (totalPower >= 500) return 3;
    if (totalPower >= 100) return 2;
    return 0;
}

// Добавление в лог
function addLog(message) {
    const logContainer = document.getElementById('logContainer');
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = `[GAR] ${message}`;
    logContainer.insertBefore(entry, logContainer.firstChild);
    
    if (logContainer.children.length > 50) {
        logContainer.removeChild(logContainer.lastChild);
    }
}

// Форматирование чисел
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
    return Math.floor(num).toString();
}

// Открыть модальное окно оплаты
function openPaymentModal(upgradeId, gramAmount, upgradeName) {
    document.getElementById('modalAmount').textContent = gramAmount;
    document.getElementById('modalUpgrade').textContent = upgradeName;
    
    const modal = document.getElementById('paymentModal');
    modal.classList.add('show');
    
    // Сохраняем данные для подтверждения
    modal.dataset.upgradeId = upgradeId;
    modal.dataset.gramAmount = gramAmount;
}

// Закрыть модальное окно
function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    modal.classList.remove('show');
}

// Симуляция проверки платежа GRAM
async function checkGramPayment(amount) {
    // В реальном приложении здесь должна быть проверка через TON API
    return new Promise((resolve) => {
        setTimeout(() => {
            // Симулируем успешный платеж
            resolve(true);
        }, 1500);
    });
}

// Подтверждение платежа GRAM
async function confirmGramPayment(upgradeId, gramAmount) {
    addLog(`💎 Проверка платежа ${gramAmount} GRAM...`);
    
    // Показываем уведомление
    tg.showPopup({
        title: 'Проверка платежа',
        message: `Проверяем поступление ${gramAmount} GRAM на адрес:\n${GRAM_WALLET}`,
        buttons: [{type: 'ok'}]
    });
    
    try {
        const paymentVerified = await checkGramPayment(gramAmount);
        
        if (paymentVerified) {
            garState.gramBalance += gramAmount;
            
            // Применяем улучшение
            switch(upgradeId) {
                case 'overclock':
                    garState.upgrades.overclock = true;
                    addLog('🔧 Разгон GAR активирован! (+25% к мощности)');
                    break;
                case 'cooling':
                    garState.upgrades.cooling = true;
                    addLog('❄️ GAR Охлаждение установлено! (+50% к добыче)');
                    break;
                case 'crystal':
                    garState.upgrades.crystal = true;
                    addLog('💎 GAR Кристалл активирован! (x2 множитель)');
                    break;
            }
            
            tg.showPopup({
                title: '✅ Успешно!',
                message: `Улучшение активировано! Баланс GRAM: ${garState.gramBalance.toFixed(1)}`,
                buttons: [{type: 'ok'}]
            });
            
            updateUI();
            saveGame();
        } else {
            tg.showPopup({
                title: '❌ Ошибка',
                message: 'Платеж не найден. Пожалуйста, отправьте GRAM и попробуйте снова.',
                buttons: [{type: 'ok'}]
            });
        }
    } catch (error) {
        tg.showPopup({
            title: '❌ Ошибка',
            message: 'Произошла ошибка при проверке платежа.',
            buttons: [{type: 'ok'}]
        });
    }
    
    closePaymentModal();
}

// Обновление интерфейса
function updateUI() {
    const hashrate = calculateHashrate();
    const rank = calculateRank();
    
    // Балансы
    document.getElementById('balance').textContent = garState.balance.toFixed(2);
    document.getElementById('gramBalance').textContent = garState.gramBalance.toFixed(1);
    document.getElementById('headerBalance').textContent = garState.balance.toFixed(2);
    document.getElementById('headerGram').textContent = garState.gramBalance.toFixed(1);
    document.getElementById('garUsd').textContent = 
        `≈ $${(garState.balance * GAR_CONFIG.USD_PRICE).toFixed(2)} USD`;
    
    // Статистика
    document.getElementById('power').textContent = `${formatNumber(hashrate)} GH/s`;
    document.getElementById('totalMined').textContent = formatNumber(garState.totalMined);
    document.getElementById('blocks').textContent = garState.blocks;
    document.getElementById('minerLevel').textContent = `Ранг: ${RANKS[rank]}`;
    
    // Прогресс блока
    const progress = (garState.totalMined % GAR_CONFIG.BLOCK_DIFFICULTY) / GAR_CONFIG.BLOCK_DIFFICULTY * 100;
    document.getElementById('progressPercent').textContent = `${Math.floor(progress)}%`;
    document.getElementById('progressFill').style.width = `${progress}%`;
    
    // Кнопки оборудования (GAR)
    updateBuyButton('buyV1', EQUIPMENT_COST.v1, 'gar');
    updateBuyButton('buyV2', EQUIPMENT_COST.v2, 'gar');
    updateBuyButton('buyFarm', EQUIPMENT_COST.farm, 'gar');
    updateBuyButton('buyQuantum', EQUIPMENT_COST.quantum, 'gar');
    
    // Кнопки улучшений (GRAM)
    updateUpgradeButton('overclock', UPGRADE_COST_GRAM.overclock, garState.upgrades.overclock);
    updateUpgradeButton('cooling', UPGRADE_COST_GRAM.cooling, garState.upgrades.cooling);
    updateUpgradeButton('crystal', UPGRADE_COST_GRAM.crystal, garState.upgrades.crystal);
}

function updateBuyButton(buttonId, cost, currency) {
    const button = document.getElementById(buttonId);
    if (currency === 'gar') {
        button.disabled = garState.balance < cost;
    } else if (currency === 'gram') {
        button.disabled = garState.gramBalance < cost;
    }
}

function updateUpgradeButton(buttonId, cost, purchased) {
    const button = document.getElementById(buttonId);
    if (purchased) {
        button.textContent = '✓ Куплено';
        button.disabled = true;
    } else {
        button.textContent = `💎 ${cost} GRAM`;
        button.disabled = false; // Всегда доступна покупка за GRAM
    }
}

// Обработка майнинга
document.getElementById('mineButton').addEventListener('click', (e) => {
    const hashrate = calculateHashrate();
    const mined = Math.max(0.1, hashrate / 10);
    
    garState.balance += mined;
    garState.totalMined += mined;
    
    // Эффект
    const effect = document.getElementById('mineEffect');
    effect.textContent = `+${mined.toFixed(1)} GAR`;
    effect.classList.remove('show');
    void effect.offsetWidth;
    effect.classList.add('show');
    
    // Шанс найти блок
    if (Math.random() < 0.05) {
        garState.blocks++;
        const blockReward = GAR_CONFIG.BLOCK_REWARD;
        const gramReward = GAR_CONFIG.GRAM_BLOCK_REWARD;
        garState.balance += blockReward;
        garState.gramBalance += gramReward;
        addLog(`🎉 БЛОК GAR НАЙДЕН! +${blockReward} GAR +${gramReward} GRAM`);
    }
    
    // Случайный лог
    if (Math.random() < 0.15) {
        const messages = [
            `⛏️ Добыто ${mined.toFixed(1)} GAR`,
            `💎 Хешрейт: ${formatNumber(hashrate)} GH/s`,
            `🔄 Транзакций GAR: ${Math.floor(Math.random() * 50)}`
        ];
        addLog(messages[Math.floor(Math.random() * messages.length)]);
    }
    
    updateUI();
    saveGame();
    
    if (navigator.vibrate) {
        navigator.vibrate(15);
    }
});

// Покупка оборудования за GAR
document.getElementById('buyV1').addEventListener('click', () => {
    if (garState.balance >= EQUIPMENT_COST.v1) {
        garState.balance -= EQUIPMENT_COST.v1;
        garState.equipment.v1++;
        addLog('💻 GAR Miner V1 куплен (+5 GH/s)');
        updateUI();
        saveGame();
    }
});

document.getElementById('buyV2').addEventListener('click', () => {
    if (garState.balance >= EQUIPMENT_COST.v2) {
        garState.balance -= EQUIPMENT_COST.v2;
        garState.equipment.v2++;
        addLog('🖥️ GAR Miner V2 куплен (+25 GH/s)');
        updateUI();
        saveGame();
    }
});

document.getElementById('buyFarm').addEventListener('click', () => {
    if (garState.balance >= EQUIPMENT_COST.farm) {
        garState.balance -= EQUIPMENT_COST.farm;
        garState.equipment.farm++;
        addLog('🏭 GAR Farm куплена (+100 GH/s)');
        updateUI();
        saveGame();
    }
});

document.getElementById('buyQuantum').addEventListener('click', () => {
    if (garState.balance >= EQUIPMENT_COST.quantum) {
        garState.balance -= EQUIPMENT_COST.quantum;
        garState.equipment.quantum++;
        addLog('⚡ GAR Quantum куплен (+500 GH/s)');
        updateUI();
        saveGame();
    }
});

// Покупка улучшений за GRAM
document.getElementById('overclock').addEventListener('click', () => {
    if (!garState.upgrades.overclock) {
        openPaymentModal('overclock', UPGRADE_COST_GRAM.overclock, 'Разгон GAR');
    }
});

document.getElementById('cooling').addEventListener('click', () => {
    if (!garState.upgrades.cooling) {
        openPaymentModal('cooling', UPGRADE_COST_GRAM.cooling, 'GAR Охлаждение');
    }
});

document.getElementById('crystal').addEventListener('click', () => {
    if (!garState.upgrades.crystal) {
        openPaymentModal('crystal', UPGRADE_COST_GRAM.crystal, 'GAR Кристалл');
    }
});

// Копирование адреса
document.getElementById('copyAddress').addEventListener('click', () => {
    navigator.clipboard.writeText(GRAM_WALLET).then(() => {
        tg.showPopup({
            title: '📋 Скопировано!',
            message: 'Адрес кошелька скопирован в буфер обмена',
            buttons: [{type: 'ok'}]
        });
    });
});

// Модальное окно
document.getElementById('closeModal').addEventListener('click', closePaymentModal);
document.getElementById('cancelPayment').addEventListener('click', closePaymentModal);

document.getElementById('confirmPayment').addEventListener('click', () => {
    const modal = document.getElementById('paymentModal');
    const upgradeId = modal.dataset.upgradeId;
    const gramAmount = parseInt(modal.dataset.gramAmount);
    confirmGramPayment(upgradeId, gramAmount);
});

// Кнопки пополнения GRAM
document.querySelectorAll('.deposit-btn').forEach(button => {
    button.addEventListener('click', () => {
        const amount = parseInt(button.dataset.amount);
        openPaymentModal('deposit', amount, `Пополнение ${amount} GRAM`);
    });
});

// Автомайнинг
setInterval(() => {
    const hashrate = calculateHashrate();
    let autoMine = hashrate / 100;
    
    if (garState.upgrades.cooling) {
        autoMine *= 1.5;
    }
    
    if (autoMine > 0) {
        garState.balance += autoMine;
        garState.totalMined += autoMine;
        
        // Шанс блока при автомайнинге
        if (Math.random() < 0.01) {
            garState.blocks++;
            garState.balance += GAR_CONFIG.BLOCK_REWARD;
            garState.gramBalance += GAR_CONFIG.GRAM_BLOCK_REWARD;
            addLog('🎉 АВТО-БЛОК GAR НАЙДЕН! +50 GAR +5 GRAM');
        }
        
        updateUI();
        saveGame();
    }
}, 1000);

// Telegram Main Button для пополнения
tg.MainButton.setText('💎 Пополнить GRAM');
tg.MainButton.show();

tg.MainButton.onClick(() => {
    tg.openLink(`https://t.me/tonkeeper?start=${GRAM_WALLET}`);
});

// Инициализация
loadGame();
updateUI();
addLog('🟢 GAR майнер активирован');
addLog(`💳 GRAM кошелек: ${GRAM_WALLET.substring(0, 20)}...`);

// Настройка цвета темы Telegram
tg.setHeaderColor('#FF6B35');
tg.setBackgroundColor('#1a1a2e');
