// Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();

// Адрес для GRAM платежей
const GRAM_WALLET = 'UQChG5EgS8Evty9pSf-3GKxVRIeWqQ70jjWo_xo-YABWknbO';

// Состояние игры
let gameState = {
    balance: 0,
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
    totalMined: 0
};

// Конфиг
const CONFIG = {
    GAR_USD: 0.05,
    BLOCK_REWARD: 50,
    BLOCK_DIFFICULTY: 1000
};

// Мощность оборудования
const EQUIP_POWER = { v1: 5, v2: 25, farm: 100, quantum: 500 };

// Цена оборудования в GAR (уменьшена в 10 раз)
const EQUIP_COST = { 
    v1: 1,
    v2: 5,
    farm: 20,
    quantum: 100
};

// Цена улучшений в GRAM (уменьшена в 10 раз)
const UPGRADE_GRAM = { 
    overclock: 1,   // было 10
    cooling: 2.5,   // было 25
    crystal: 5      // было 50
};

// Ранги
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

// Текущий выбранный апгрейд для модалки
let pendingUpgrade = null;

// === Сохранение и загрузка ===
function loadGame() {
    const saved = localStorage.getItem('garMiner');
    if (saved) {
        gameState = { ...gameState, ...JSON.parse(saved) };
    }
}

function saveGame() {
    localStorage.setItem('garMiner', JSON.stringify(gameState));
}

// === Расчеты ===
function getHashrate() {
    let h = 1;
    h += gameState.equipment.v1 * EQUIP_POWER.v1;
    h += gameState.equipment.v2 * EQUIP_POWER.v2;
    h += gameState.equipment.farm * EQUIP_POWER.farm;
    h += gameState.equipment.quantum * EQUIP_POWER.quantum;
    if (gameState.upgrades.overclock) h *= 1.25;
    if (gameState.upgrades.crystal) h *= 2;
    return Math.floor(h);
}

function getRank() {
    const p = getHashrate();
    if (p >= 10000) return 7;
    if (p >= 5000) return 6;
    if (p >= 2000) return 5;
    if (p >= 1000) return 4;
    if (p >= 500) return 3;
    if (p >= 100) return 2;
    return 0;
}

function fmt(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(2) + 'K';
    if (n % 1 !== 0) return n.toFixed(1);
    return Math.floor(n).toString();
}

// === Лог ===
function addLog(msg) {
    const c = document.getElementById('logContainer');
    const div = document.createElement('div');
    div.className = 'log-entry';
    div.textContent = `[GAR] ${msg}`;
    c.insertBefore(div, c.firstChild);
    if (c.children.length > 50) c.removeChild(c.lastChild);
}

// === UI ===
function updateUI() {
    const hr = getHashrate();
    const rank = getRank();

    document.getElementById('balance').textContent = gameState.balance.toFixed(2);
    document.getElementById('garUsd').textContent = `≈ $${(gameState.balance * CONFIG.GAR_USD).toFixed(2)} USD`;
    document.getElementById('hashrate').textContent = fmt(hr);
    document.getElementById('power').textContent = `${fmt(hr)} GH/s`;
    document.getElementById('totalMined').textContent = fmt(gameState.totalMined);
    document.getElementById('blocks').textContent = gameState.blocks;
    document.getElementById('minerLevel').textContent = `Ранг: ${RANKS[rank]}`;

    // Прогресс блока
    const progress = (gameState.totalMined % CONFIG.BLOCK_DIFFICULTY) / CONFIG.BLOCK_DIFFICULTY * 100;
    document.getElementById('progressPercent').textContent = `${Math.floor(progress)}%`;
    document.getElementById('progressFill').style.width = `${progress}%`;

    // Кнопки оборудования (GAR)
    setBtn('buyV1', gameState.balance >= EQUIP_COST.v1);
    setBtn('buyV2', gameState.balance >= EQUIP_COST.v2);
    setBtn('buyFarm', gameState.balance >= EQUIP_COST.farm);
    setBtn('buyQuantum', gameState.balance >= EQUIP_COST.quantum);

    // Кнопки улучшений (GRAM)
    setUpgradeBtn('overclock', gameState.upgrades.overclock, UPGRADE_GRAM.overclock);
    setUpgradeBtn('cooling', gameState.upgrades.cooling, UPGRADE_GRAM.cooling);
    setUpgradeBtn('crystal', gameState.upgrades.crystal, UPGRADE_GRAM.crystal);

    // Telegram user
    if (tg.initDataUnsafe?.user) {
        document.getElementById('minerName').textContent = tg.initDataUnsafe.user.first_name + ' Майнер';
    }
}

function setBtn(id, enabled) {
    document.getElementById(id).disabled = !enabled;
}

function setUpgradeBtn(id, purchased, cost) {
    const btn = document.getElementById(id);
    if (purchased) {
        btn.textContent = '✓ Куплено';
        btn.disabled = true;
    } else {
        btn.innerHTML = `<span class="upgrade-cost">💎 ${cost} GRAM</span>`;
        btn.disabled = false;
    }
}

// === Майнинг ===
document.getElementById('mineButton').addEventListener('click', () => {
    const hr = getHashrate();
    const mined = Math.max(0.1, hr / 10);
    gameState.balance += mined;
    gameState.totalMined += mined;

    // Эффект
    const fx = document.getElementById('mineEffect');
    fx.textContent = `+${mined.toFixed(1)} GAR`;
    fx.classList.remove('show');
    void fx.offsetWidth;
    fx.classList.add('show');

    // Блок
    if (Math.random() < 0.05) {
        gameState.blocks++;
        gameState.balance += CONFIG.BLOCK_REWARD;
        addLog(`🎉 БЛОК НАЙДЕН! +${CONFIG.BLOCK_REWARD} GAR`);
    }

    if (Math.random() < 0.15) {
        const msgs = [
            `⛏️ Добыто ${mined.toFixed(1)} GAR`,
            `⚡ Хешрейт: ${fmt(hr)} GH/s`,
            `🔄 Транзакций: ${Math.floor(Math.random() * 50)}`
        ];
        addLog(msgs[Math.floor(Math.random() * msgs.length)]);
    }

    updateUI();
    saveGame();
    if (navigator.vibrate) navigator.vibrate(15);
});

// === Покупка оборудования за GAR ===
document.getElementById('buyV1').addEventListener('click', () => buyEquip('v1'));
document.getElementById('buyV2').addEventListener('click', () => buyEquip('v2'));
document.getElementById('buyFarm').addEventListener('click', () => buyEquip('farm'));
document.getElementById('buyQuantum').addEventListener('click', () => buyEquip('quantum'));

function buyEquip(type) {
    if (gameState.balance >= EQUIP_COST[type]) {
        gameState.balance -= EQUIP_COST[type];
        gameState.equipment[type]++;
        const names = { 
            v1: 'GAR Miner V1 (+5 GH/s)', 
            v2: 'GAR Miner V2 (+25 GH/s)', 
            farm: 'GAR Farm (+100 GH/s)', 
            quantum: 'GAR Quantum (+500 GH/s)' 
        };
        addLog(`✅ Куплен: ${names[type]} за ${EQUIP_COST[type]} GAR`);
        updateUI();
        saveGame();
    }
}

// === Модальное окно GRAM ===
function openGramModal(upgradeId) {
    pendingUpgrade = upgradeId;
    document.getElementById('modalUpgradeName').textContent = 
        { overclock: 'Разгон GAR', cooling: 'GAR Охлаждение', crystal: 'GAR Кристалл' }[upgradeId];
    document.getElementById('modalGramAmount').textContent = UPGRADE_GRAM[upgradeId];
    document.getElementById('paymentStatus').textContent = '';
    document.getElementById('paymentStatus').className = 'modal-status';
    document.getElementById('gramModal').classList.add('show');
}

function closeGramModal() {
    document.getElementById('gramModal').classList.remove('show');
    pendingUpgrade = null;
}

document.getElementById('overclock').addEventListener('click', () => openGramModal('overclock'));
document.getElementById('cooling').addEventListener('click', () => openGramModal('cooling'));
document.getElementById('crystal').addEventListener('click', () => openGramModal('crystal'));
document.getElementById('closeModal').addEventListener('click', closeGramModal);
document.getElementById('cancelModal').addEventListener('click', closeGramModal);

// Закрытие по клику вне окна
document.getElementById('gramModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('gramModal')) closeGramModal();
});

// === Проверка GRAM платежа ===
document.getElementById('checkPayment').addEventListener('click', async () => {
    if (!pendingUpgrade) return;

    const statusEl = document.getElementById('paymentStatus');
    statusEl.textContent = '⏳ Проверяем транзакцию...';
    statusEl.className = 'modal-status loading';

    // Имитация проверки (в реальности - запрос к TON API)
    await new Promise(r => setTimeout(r, 2000));

    // Симулируем успех (в реальности проверяем транзакцию)
    const success = true; // Замените на реальную проверку

    if (success) {
        gameState.upgrades[pendingUpgrade] = true;
        const names = { 
            overclock: 'Разгон GAR (+25% мощности)', 
            cooling: 'GAR Охлаждение (+50% добычи)', 
            crystal: 'GAR Кристалл (x2 множитель)' 
        };
        addLog(`💎 Оплачено GRAM! ${names[pendingUpgrade]}`);
        statusEl.textContent = '✅ Платеж подтвержден! Улучшение активировано.';
        statusEl.className = 'modal-status success';
        
        updateUI();
        saveGame();

        setTimeout(closeGramModal, 1500);
    } else {
        statusEl.textContent = '❌ Платеж не найден. Отправьте GRAM и попробуйте снова.';
        statusEl.className = 'modal-status error';
    }
});

// === Копирование адреса ===
document.getElementById('copyWallet').addEventListener('click', () => {
    navigator.clipboard.writeText(GRAM_WALLET).then(() => {
        const btn = document.getElementById('copyWallet');
        btn.textContent = '✓';
        setTimeout(() => btn.textContent = '📋', 1500);
    });
});

// === Автомайнинг ===
setInterval(() => {
    const hr = getHashrate();
    let auto = hr / 100;
    if (gameState.upgrades.cooling) auto *= 1.5;
    
    if (auto > 0) {
        gameState.balance += auto;
        gameState.totalMined += auto;

        if (Math.random() < 0.01) {
            gameState.blocks++;
            gameState.balance += CONFIG.BLOCK_REWARD;
            addLog('🎉 АВТО-БЛОК НАЙДЕН! +50 GAR');
        }

        updateUI();
        saveGame();
    }
}, 1000);

// === Telegram Main Button ===
tg.MainButton.setText('💎 Открыть кошелек TON');
tg.MainButton.show();
tg.MainButton.onClick(() => {
    tg.openLink(`https://app.tonkeeper.com/transfer/${GRAM_WALLET}`);
});

// === Старт ===
loadGame();
updateUI();
addLog('🟢 GAR майнер запущен');
addLog('💎 Улучшения покупаются за GRAM');
addLog('💰 Все цены снижены в 10 раз!');
