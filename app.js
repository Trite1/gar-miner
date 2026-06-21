// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();

// Состояние GAR майнера
let garState = {
    balance: 0,
    hashPower: 1,
    equipment: {
        basic: 0,
        pro: 0,
        farm: 0
    },
    upgrades: {
        energy: false,
        accelerator: false,
        optimizer: false
    },
    blocksMined: 0,
    energy: 100,
    difficulty: 1,
    boostActive: false,
    boostEndTime: 0,
    totalMined: 0
};

// Константы GAR
const GAR_PRICE_USD = 0.50;
const BLOCK_REWARD = 50;

// Мощность оборудования
const EQUIPMENT_POWER = {
    basic: 10,
    pro: 50,
    farm: 250
};

// Стоимость оборудования
const EQUIPMENT_COST = {
    basic: 100,
    pro: 500,
    farm: 2500
};

// Стоимость улучшений
const UPGRADE_COST = {
    energy: 200,
    accelerator: 1000,
    optimizer: 5000
};

// Загрузка сохранений
function loadGame() {
    const saved = localStorage.getItem('garMinerState');
    if (saved) {
        garState = { ...garState, ...JSON.parse(saved) };
    }
    
    // Проверка буста
    if (garState.boostActive && Date.now() > garState.boostEndTime) {
        garState.boostActive = false;
    }
}

// Сохранение
function saveGame() {
    localStorage.setItem('garMinerState', JSON.stringify(garState));
}

// Расчет хеш-мощности
function calculateHashPower() {
    let power = 1;
    
    // Оборудование
    power += garState.equipment.basic * EQUIPMENT_POWER.basic;
    power += garState.equipment.pro * EQUIPMENT_POWER.pro;
    power += garState.equipment.farm * EQUIPMENT_POWER.farm;
    
    // Улучшения
    if (garState.upgrades.accelerator) {
        power *= 2;
    }
    
    // Буст
    if (garState.boostActive) {
        power *= 2;
    }
    
    return power;
}

// Форматирование GAR
function formatGAR(amount) {
    return amount.toFixed(2);
}

// Форматирование чисел
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Math.floor(num).toString();
}

// Добавление транзакции
function addTransaction(type, amount) {
    const container = document.getElementById('transactionsContainer');
    const transaction = document.createElement('div');
    transaction.className = 'transaction-item';
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    
    transaction.innerHTML = `
        <div class="transaction-icon">${type === 'mine' ? '⛏️' : '🟢'}</div>
        <div class="transaction-info">
            <div class="transaction-name">${type === 'mine' ? 'Добыча GAR' : 'GAR Network'}</div>
            <div class="transaction-time">${timeStr}</div>
        </div>
        <div class="transaction-amount positive">+${formatGAR(amount)} GAR</div>
    `;
    
    container.insertBefore(transaction, container.firstChild);
    
    // Ограничение количества транзакций
    if (container.children.length > 20) {
        container.removeChild(container.lastChild);
    }
}

// Обновление интерфейса
function updateUI() {
    const hashPower = calculateHashPower();
    const maxEnergy = garState.upgrades.energy ? 150 : 100;
    
    // Баланс
    document.getElementById('balance').textContent = formatGAR(garState.balance);
    document.getElementById('usdValue').textContent = 
        `≈ $${(garState.balance * GAR_PRICE_USD).toFixed(2)} USD`;
    
    // Статистика
    document.getElementById('hashPower').textContent = `${formatNumber(hashPower)} GH/s`;
    document.getElementById('blocksMined').textContent = garState.blocksMined;
    document.getElementById('energyLevel').textContent = `${Math.floor(garState.energy)}%`;
    document.getElementById('difficulty').textContent = `${garState.difficulty.toFixed(1)}x`;
    
    // Прогресс блока
    const blockProgress = (garState.balance % BLOCK_REWARD) / BLOCK_REWARD * 100;
    document.getElementById('blockNumber').textContent = garState.blocksMined + 1;
    document.getElementById('blockProgress').textContent = `${Math.floor(blockProgress)}%`;
    document.getElementById('progressFill').style.width = `${blockProgress}%`;
    
    // Ранг майнера
    let rank = 'Новичок';
    if (garState.totalMined > 10000) rank = 'Легенда GAR';
    else if (garState.totalMined > 5000) rank = 'Мастер GAR';
    else if (garState.totalMined > 1000) rank = 'Эксперт GAR';
    else if (garState.totalMined > 100) rank = 'Продвинутый';
    document.getElementById('minerRank').textContent = rank;
    
    // Кнопки оборудования
    updateBuyButton('buyBasic', EQUIPMENT_COST.basic);
    updateBuyButton('buyPro', EQUIPMENT_COST.pro);
    updateBuyButton('buyFarm', EQUIPMENT_COST.farm);
    
    // Счетчики оборудования
    document.getElementById('basicCount').textContent = `x${garState.equipment.basic}`;
    document.getElementById('proCount').textContent = `x${garState.equipment.pro}`;
    document.getElementById('farmCount').textContent = `x${garState.equipment.farm}`;
    
    // Кнопки улучшений
    updateUpgradeButton('buyEnergy', UPGRADE_COST.energy, garState.upgrades.energy);
    updateUpgradeButton('buyAccelerator', UPGRADE_COST.accelerator, garState.upgrades.accelerator);
    updateUpgradeButton('buyOptimizer', UPGRADE_COST.optimizer, garState.upgrades.optimizer);
    
    // Буст
    updateBoostButton();
    
    // Информация из Telegram
    if (tg.initDataUnsafe?.user) {
        document.getElementById('minerName').textContent = 
            tg.initDataUnsafe.user.first_name || 'GAR Майнер';
    }
}

// Обновление кнопок покупки
function updateBuyButton(buttonId, cost) {
    const button = document.getElementById(buttonId);
    if (garState.balance >= cost) {
        button.disabled = false;
    } else {
        button.disabled = true;
    }
}

function updateUpgradeButton(buttonId, cost, purchased) {
    const button = document.getElementById(buttonId);
    if (purchased) {
        button.innerHTML = '<span class="buy-price">✓ Куплено</span>';
        button.disabled = true;
        button.style.background = 'linear-gradient(45deg, #00FF88, #00CC6A)';
    } else if (garState.balance >= cost) {
        button.disabled = false;
    } else {
        button.disabled = true;
    }
}

function updateBoostButton() {
    const button = document.getElementById('boostButton');
    const timer = document.getElementById('boostTimer');
    
    if (garState.boostActive) {
        const remaining = Math.ceil((garState.boostEndTime - Date.now()) / 1000);
        if (remaining > 0) {
            button.disabled = true;
            timer.textContent = `${remaining}с`;
        } else {
            garState.boostActive = false;
            button.disabled = false;
            timer.textContent = '';
        }
    } else {
        button.disabled = false;
        timer.textContent = '';
    }
}

// Майнинг GAR
document.getElementById('mineButton').addEventListener('click', (e) => {
    if (garState.energy <= 0) {
        showNotification('Недостаточно энергии! 🔋');
        return;
    }
    
    const hashPower = calculateHashPower();
    const mined = Math.max(0.01, hashPower * 0.01);
    
    garState.balance += mined;
    garState.totalMined += mined;
    garState.energy = Math.max(0, garState.energy - 1);
    
    // Проверка нахождения блока
    if (garState.balance >= (garState.blocksMined + 1) * BLOCK_REWARD) {
        garState.blocksMined++;
        garState.balance += BLOCK_REWARD * 0.1; // Бонус за блок
        garState.difficulty = 1 + garState.blocksMined * 0.1;
        addTransaction('block', BLOCK_REWARD);
        showNotification('🎉 БЛОК НАЙДЕН! +50 GAR');
    }
    
    // Эффект
    const effect = document.getElementById('miningEffect');
    effect.textContent = `+${formatGAR(mined)} GAR`;
    effect.classList.remove('show');
    void effect.offsetWidth;
    effect.classList.add('show');
    
    // Транзакция
    if (Math.random() < 0.3) {
        addTransaction('mine', mined);
    }
    
    updateUI();
    saveGame();
    
    // Вибрация
    if (navigator.vibrate) {
        navigator.vibrate(15);
    }
});

// Буст
document.getElementById('boostButton').addEventListener('click', () => {
    if (!garState.boostActive) {
        garState.boostActive = true;
        garState.boostEndTime = Date.now() + 30000; // 30 секунд
        updateUI();
        saveGame();
        showNotification('⚡ БУСТ АКТИВИРОВАН! x2 мощность на 30с');
    }
});

// Покупка оборудования
document.getElementById('buyBasic').addEventListener('click', () => {
    if (garState.balance >= EQUIPMENT_COST.basic) {
        garState.balance -= EQUIPMENT_COST.basic;
        garState.equipment.basic++;
        addTransaction('buy', -EQUIPMENT_COST.basic);
        updateUI();
        saveGame();
    }
});

document.getElementById('buyPro').addEventListener('click', () => {
    if (garState.balance >= EQUIPMENT_COST.pro) {
        garState.balance -= EQUIPMENT_COST.pro;
        garState.equipment.pro++;
        addTransaction('buy', -EQUIPMENT_COST.pro);
        updateUI();
        saveGame();
    }
});

document.getElementById('buyFarm').addEventListener('click', () => {
    if (garState.balance >= EQUIPMENT_COST.farm) {
        garState.balance -= EQUIPMENT_COST.farm;
        garState.equipment.farm++;
        addTransaction('buy', -EQUIPMENT_COST.farm);
        updateUI();
        saveGame();
    }
});

// Покупка улучшений
document.getElementById('buyEnergy').addEventListener('click', () => {
    if (!garState.upgrades.energy && garState.balance >= UPGRADE_COST.energy) {
        garState.balance -= UPGRADE_COST.energy;
        garState.upgrades.energy = true;
        garState.energy = 150;
        addTransaction('upgrade', -UPGRADE_COST.energy);
        updateUI();
        saveGame();
    }
});

document.getElementById('buyAccelerator').addEventListener('click', () => {
    if (!garState.upgrades.accelerator && garState.balance >= UPGRADE_COST.accelerator) {
        garState.balance -= UPGRADE_COST.accelerator;
        garState.upgrades.accelerator = true;
        addTransaction('upgrade', -UPGRADE_COST.accelerator);
        updateUI();
        saveGame();
        showNotification('🚀 УСКОРИТЕЛЬ GAR УСТАНОВЛЕН!');
    }
});

document.getElementById('buyOptimizer').addEventListener('click', () => {
    if (!garState.upgrades.optimizer && garState.balance >= UPGRADE_COST.optimizer) {
        garState.balance -= UPGRADE_COST.optimizer;
        garState.upgrades.optimizer = true;
        addTransaction('upgrade', -UPGRADE_COST.optimizer);
        updateUI();
        saveGame();
        showNotification('💡 ОПТИМИЗАТОР GAR АКТИВИРОВАН!');
    }
});

// Автомайнинг
setInterval(() => {
    if (garState.upgrades.optimizer) {
        garState.balance += 5;
        garState.totalMined += 5;
    }
    
    // Восстановление энергии
    if (garState.energy < (garState.upgrades.energy ? 150 : 100)) {
        garState.energy = Math.min(
            garState.upgrades.energy ? 150 : 100,
            garState.energy + 0.5
        );
    }
    
    // Обновление таймера буста
    if (garState.boostActive && Date.now() > garState.boostEndTime) {
        garState.boostActive = false;
    }
    
    updateUI();
    saveGame();
}, 1000);

// Уведомления
function showNotification(message) {
    // Можно добавить визуальное уведомление
    console.log(message);
}

// Кнопка Telegram
tg.MainButton.setText('📊 Статистика GAR');
tg.MainButton.show();

tg.MainButton.onClick(() => {
    const stats = `⛏️ GAR MINER СТАТИСТИКА:
⚡ Мощность: ${formatNumber(calculateHashPower())} GH/s
💰 Баланс: ${formatGAR(garState.balance)} GAR
💎 Блоков: ${garState.blocksMined}
💻 Оборудование:
  • Базовый: ${garState.equipment.basic}
  • Про: ${garState.equipment.pro}
  • Ферма: ${garState.equipment.farm}
🚀 Улучшения:
  • Энергия: ${garState.upgrades.energy ? '✅' : '❌'}
  • Ускоритель: ${garState.upgrades.accelerator ? '✅' : '❌'}
  • Оптимизатор: ${garState.upgrades.optimizer ? '✅' : '❌'}`;
    
    tg.sendData(JSON.stringify({
        action: 'share_stats',
        text: stats
    }));
});

// Инициализация
loadGame();
updateUI();
addTransaction('start', 0);
