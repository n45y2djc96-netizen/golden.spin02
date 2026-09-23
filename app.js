const tg = window.Telegram?.WebApp;

tg?.ready();
tg?.expand();
tg?.setHeaderColor?.("#170804");
tg?.setBackgroundColor?.("#090504");

const STORAGE_KEY = "golden_spin_balance";
const BONUS_KEY = "golden_spin_daily";
const SOUND_KEY = "golden_spin_sound";

let balance = Number(localStorage.getItem(STORAGE_KEY));

if (!Number.isFinite(balance)) {
  balance = 12550;
  localStorage.setItem(STORAGE_KEY, balance);
}

let soundEnabled = localStorage.getItem(SOUND_KEY) !== "off";
let currentGame = "slots";
let busy = false;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const balanceEl = $("#balance");
const gameEl = $("#game");
const toastEl = $("#toast");
const modalEl = $("#modal");
const winAmountEl = $("#winAmount");
const vipModal = $("#vipModal");

function saveBalance() {
  localStorage.setItem(STORAGE_KEY, String(balance));
  updateBalance();
}

function updateBalance() {
  balanceEl.textContent = balance.toLocaleString("ru-RU");
}

function showToast(text) {
  toastEl.textContent = text;
  toastEl.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toastEl.classList.remove("show");
  }, 2200);
}

function addBalance(amount) {
  balance += amount;
  saveBalance();
}

function removeBalance(amount) {
  if (balance < amount) {
    showToast("Недостаточно токенов");
    return false;
  }

  balance -= amount;
  saveBalance();
  return true;
}

/* =========================
   SOUND
========================= */

let audioContext = null;

function getAudio() {
  if (!audioContext) {
    audioContext = new (
      window.AudioContext ||
      window.webkitAudioContext
    )();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

function tone(frequency, duration = 0.08, volume = 0.04, type = "sine") {
  if (!soundEnabled) return;

  try {
    const ctx = getAudio();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {}
}

function clickSound() {
  tone(420, 0.05, 0.025);
}

function spinSound() {
  tone(180, 0.08, 0.025, "triangle");

  setTimeout(() => {
    tone(260, 0.08, 0.02, "triangle");
  }, 90);
}

function winSound() {
  tone(520, 0.12, 0.04);

  setTimeout(() => tone(660, 0.12, 0.04), 110);
  setTimeout(() => tone(820, 0.18, 0.045), 220);
}

function bigWinSound() {
  tone(440, 0.12, 0.05);

  setTimeout(() => tone(660, 0.12, 0.05), 120);
  setTimeout(() => tone(880, 0.12, 0.05), 240);
  setTimeout(() => tone(1100, 0.22, 0.05), 360);
}

function loseSound() {
  tone(180, 0.16, 0.025);
  setTimeout(() => tone(130, 0.2, 0.02), 120);
}

/* =========================
   MODALS
========================= */

function openWinModal(amount) {
  winAmountEl.textContent = `+${amount.toLocaleString("ru-RU")}`;
  modalEl.classList.add("show");

  if (amount >= 500) {
    bigWinSound();
  } else {
    winSound();
  }
}

function closeWinModal() {
  modalEl.classList.remove("show");
}

$("#closeModal")?.addEventListener("click", closeWinModal);

modalEl?.addEventListener("click", (event) => {
  if (event.target === modalEl) {
    closeWinModal();
  }
});

$("#vipBtn")?.addEventListener("click", () => {
  clickSound();
  vipModal.classList.add("show");
});

$("#closeVipModal")?.addEventListener("click", () => {
  vipModal.classList.remove("show");
});

vipModal?.addEventListener("click", (event) => {
  if (event.target === vipModal) {
    vipModal.classList.remove("show");
  }
});

/* =========================
   PROFILE
========================= */

const telegramUser = tg?.initDataUnsafe?.user;

if (telegramUser?.first_name) {
  $("#profileLetter").textContent =
    telegramUser.first_name.trim().charAt(0).toUpperCase();
}

/* =========================
   SLOTS
========================= */

const slotSymbols = [
  "🍒",
  "🍋",
  "🍊",
  "🔔",
  "7",
  "💎"
];

const slotPayouts = {
  "🍒": 2,
  "🍋": 3,
  "🍊": 4,
  "🔔": 5,
  "7": 10,
  "💎": 20
};

let selectedBet = 100;

function randomSymbol() {
  return slotSymbols[
    Math.floor(Math.random() * slotSymbols.length)
  ];
}

function renderSlots() {
  gameEl.innerHTML = `
    <section class="game-panel">
      <div class="game-heading">
        <div>
          <span class="eyebrow">GOLDEN ORIGINAL</span>
          <h2>Слоты</h2>
          <p>Испытай удачу и поймай джекпот</p>
        </div>

        <div class="game-heading-icon">🎰</div>
      </div>

      <div class="slots-machine">
        <div class="slot-line"></div>

        <div class="reels">
          <div class="reel">
            <div class="reel-symbol">🍒</div>
          </div>

          <div class="reel">
            <div class="reel-symbol">7</div>
          </div>

          <div class="reel">
            <div class="reel-symbol">💎</div>
          </div>
        </div>

        <div class="slot-line"></div>
      </div>

      <div class="bet-row">
        <button class="bet ${selectedBet === 50 ? "active" : ""}" data-bet="50">
          50
        </button>

        <button class="bet ${selectedBet === 100 ? "active" : ""}" data-bet="100">
          100
        </button>

        <button class="bet ${selectedBet === 250 ? "active" : ""}" data-bet="250">
          250
        </button>

        <button class="bet ${selectedBet === 500 ? "active" : ""}" data-bet="500">
          500
        </button>
      </div>

      <button class="spin-game-btn" id="slotSpin">
        <span>SPIN</span>
        <small>−${selectedBet}</small>
      </button>

      <div class="game-hint">
        💎 Два одинаковых символа — x2<br>
        Три одинаковых — главный приз
      </div>
    </section>
  `;

  $$(".bet").forEach((button) => {
    button.addEventListener("click", () => {
      selectedBet = Number(button.dataset.bet);
      clickSound();
      renderSlots();
    });
  });

  $("#slotSpin")?.addEventListener("click", spinSlots);
}

async function spinSlots() {
  if (busy) return;

  if (!removeBalance(selectedBet)) {
    loseSound();
    return;
  }

  busy = true;
  spinSound();

  const reels = $$(".reel");

  reels.forEach((reel, index) => {
    reel.classList.remove("spinning");

    setTimeout(() => {
      reel.classList.add("spinning");
    }, index * 100);
  });

  const results = [
    randomSymbol(),
    randomSymbol(),
    randomSymbol()
  ];

  const finalResults = makeSlotResult(results);

  for (let i = 0; i < reels.length; i++) {
    await new Promise((resolve) => {
      setTimeout(() => {
        reels[i].classList.remove("spinning");

        const symbol = reels[i].querySelector(".reel-symbol");
        symbol.textContent = finalResults[i];

        resolve();
      }, 650 + i * 220);
    });
  }

  const reward = calculateSlotReward(finalResults);

  busy = false;

  if (reward > 0) {
    addBalance(reward);
    openWinModal(reward);
  } else {
    loseSound();
    showToast("Не повезло. Попробуй ещё!");
  }
}

function makeSlotResult(results) {
  const chance = Math.random();

  // Около 9% — три одинаковых
  if (chance < 0.09) {
    const symbol = randomSymbol();
    return [symbol, symbol, symbol];
  }

  // Около 25% — два одинаковых
  if (chance < 0.34) {
    const symbol = randomSymbol();
    let other = randomSymbol();

    while (other === symbol) {
      other = randomSymbol();
    }

    const position = Math.floor(Math.random() * 3);

    const result = [symbol, symbol, symbol];
    result[position] = other;

    return result;
  }

  return results;
}

function calculateSlotReward(result) {
  const [a, b, c] = result;

  if (a === b && b === c) {
    return selectedBet * (slotPayouts[a] || 2);
  }

  if (a === b || a === c || b === c) {
    return selectedBet * 2;
  }

  return 0;
}

/* =========================
   ROULETTE
========================= */

function renderRoulette() {
  gameEl.innerHTML = `
    <section class="game-panel">
      <div class="game-heading">
        <div>
          <span class="eyebrow">GOLDEN ROULETTE</span>
          <h2>Рулетка</h2>
          <p>Красное или чёрное?</p>
        </div>

        <div class="game-heading-icon">🎯</div>
      </div>

      <div class="big-game-icon roulette-art">
        <div class="roulette-wheel">
          <span>0</span>
          <span>7</span>
          <span>14</span>
          <span>21</span>
          <span>28</span>
          <span>35</span>
        </div>
      </div>

      <div class="game-info">
        <strong>Ставка 100</strong>
        <span>Выигрыш — 200 токенов</span>
      </div>

      <button class="game-action" id="rouletteSpin">
        КРУТИТЬ РУЛЕТКУ
      </button>
    </section>
  `;

  $("#rouletteSpin")?.addEventListener("click", playRoulette);
}

function playRoulette() {
  if (busy) return;

  const cost = 100;

  if (!removeBalance(cost)) {
    loseSound();
    return;
  }

  busy = true;
  spinSound();

  const wheel = $(".roulette-wheel");

  if (wheel) {
    wheel.classList.add("roulette-spin");
  }

  setTimeout(() => {
    const win = Math.random() < 0.35;

    busy = false;

    if (win) {
      addBalance(200);
      openWinModal(200);
    } else {
      loseSound();
      showToast("Рулетка остановилась. Попробуй снова!");
    }
  }, 1800);
}

/* =========================
   WHEEL
========================= */

function renderWheel() {
  gameEl.innerHTML = `
    <section class="game-panel">
      <div class="game-heading">
        <div>
          <span class="eyebrow">LUCKY WHEEL</span>
          <h2>Колесо</h2>
          <p>Останови колесо и забери приз</p>
        </div>

        <div class="game-heading-icon">🎡</div>
      </div>

      <div class="big-game-icon wheel-art">
        <div class="prize-wheel">
          <span>50</span>
          <span>100</span>
          <span>0</span>
          <span>250</span>
          <span>150</span>
          <span>500</span>
        </div>
      </div>

      <div class="game-info">
        <strong>Стоимость: 100</strong>
        <span>Максимальный приз: 500</span>
      </div>

      <button class="game-action" id="wheelSpin">
        КРУТИТЬ
      </button>
    </section>
  `;

  $("#wheelSpin")?.addEventListener("click", playWheel);
}

function playWheel() {
  if (busy) return;

  const cost = 100;

  if (!removeBalance(cost)) {
    loseSound();
    return;
  }

  busy = true;
  spinSound();

  const wheel = $(".prize-wheel");

  wheel?.classList.add("wheel-spin");

  const prizes = [0, 50, 100, 150, 250, 500];

  setTimeout(() => {
    const prize =
      prizes[Math.floor(Math.random() * prizes.length)];

    busy = false;

    if (prize > 0) {
      addBalance(prize);
      openWinModal(prize);
    } else {
      loseSound();
      showToast("Колесо остановилось на 0");
    }
  }, 2200);
}

/* =========================
   CHESTS
========================= */

function renderChests() {
  gameEl.innerHTML = `
    <section class="game-panel">
      <div class="game-heading">
        <div>
          <span class="eyebrow">MYSTERY CHESTS</span>
          <h2>Сундуки</h2>
          <p>В каждом сундуке спрятан приз</p>
        </div>

        <div class="game-heading-icon">🧰</div>
      </div>

      <div class="chest-grid">
        <button class="chest-card" data-chest="1">
          <div class="chest-art">🧰</div>
          <strong>Сундук I</strong>
          <span>100</span>
        </button>

        <button class="chest-card" data-chest="2">
          <div class="chest-art">🧰</div>
          <strong>Сундук II</strong>
          <span>100</span>
        </button>

        <button class="chest-card" data-chest="3">
          <div class="chest-art">🧰</div>
          <strong>Сундук III</strong>
          <span>100</span>
        </button>
      </div>

      <div class="game-hint">
        Открой один сундук и узнай свой приз.
      </div>
    </section>
  `;

  $$(".chest-card").forEach((chest) => {
    chest.addEventListener("click", () => openChest(chest));
  });
}

function openChest(chest) {
  if (busy) return;

  const cost = 100;

  if (!removeBalance(cost)) {
    loseSound();
    return;
  }

  busy = true;
  clickSound();

  chest.classList.add("opened");

  setTimeout(() => {
    const prizes = [0, 50, 50, 100, 150, 250, 500];
    const prize =
      prizes[Math.floor(Math.random() * prizes.length)];

    busy = false;

    if (prize > 0) {
      addBalance(prize);
      openWinModal(prize);
    } else {
      loseSound();
      showToast("В этот раз сундук пуст");
    }
  }, 900);
}

/* =========================
   SMASH
========================= */

function renderSmash() {
  gameEl.innerHTML = `
    <section class="game-panel">
      <div class="game-heading">
        <div>
          <span class="eyebrow">GOLDEN SMASH</span>
          <h2>Разбить блок</h2>
          <p>Разбей золотой блок и найди награду</p>
        </div>

        <div class="game-heading-icon">🔨</div>
      </div>

      <div class="smash-area">
        <button class="smash-block" id="smashBlock">
          <span>GOLD</span>
          <small>SMASH</small>
        </button>

        <div class="hammer">🔨</div>
      </div>

      <div class="game-info">
        <strong>Стоимость: 50</strong>
        <span>Призы до 250 токенов</span>
      </div>

      <button class="game-action" id="smashButton">
        РАЗБИТЬ
      </button>
    </section>
  `;

  $("#smashButton")?.addEventListener("click", smashBlock);
}

function smashBlock() {
  if (busy) return;

  const cost = 50;

  if (!removeBalance(cost)) {
    loseSound();
    return;
  }

  busy = true;

  const block = $("#smashBlock");
  const hammer = $(".hammer");

  hammer?.classList.add("hammer-hit");
  block?.classList.add("smash-hit");

  tone(110, 0.12, 0.04, "square");

  setTimeout(() => {
    const prizes = [0, 0, 0, 50, 50, 100, 250];

    const prize =
      prizes[Math.floor(Math.random() * prizes.length)];

    busy = false;

    block?.classList.remove("smash-hit");
    hammer?.classList.remove("hammer-hit");

    if (prize > 0) {
      addBalance(prize);
      openWinModal(prize);
    } else {
      loseSound();
      showToast("Блок оказался пустым");
    }
  }, 850);
}

/* =========================
   GAME SWITCHING
========================= */

function renderGame(game) {
  if (busy) return;

  currentGame = game;

  $$(".game-card").forEach((card) => {
    card.classList.toggle(
      "active",
      card.dataset.game === game
    );
  });

  if (game === "slots") {
    renderSlots();
  }

  if (game === "roulette") {
    renderRoulette();
  }

  if (game === "wheel") {
    renderWheel();
  }

  if (game === "chests") {
    renderChests();
  }

  if (game === "smash") {
    renderSmash();
  }
}

$$(".game-card").forEach((card) => {
  card.addEventListener("click", () => {
    clickSound();

    renderGame(card.dataset.game);

    setTimeout(() => {
      gameEl.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 50);
  });
});

/* =========================
   MAIN SPIN BUTTON
========================= */

$("#mainSpin")?.addEventListener("click", () => {
  clickSound();

  renderGame("slots");

  setTimeout(() => {
    gameEl.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, 50);
});

/* =========================
   DAILY BONUS
========================= */

function setupDailyBonus() {
  const button = $("#dailyBonus");

  if (!button) return;

  const today = new Date().toISOString().slice(0, 10);
  const claimed = localStorage.getItem(BONUS_KEY);

  if (claimed === today) {
    button.classList.add("claimed");
    button.disabled = true;

    const text = button.querySelector(".bonus-text");

    if (text) {
      text.textContent = "Бонус уже получен сегодня";
    }

    return;
  }

  button.addEventListener("click", () => {
    if (busy) return;

    const currentDay = new Date()
      .toISOString()
      .slice(0, 10);

    if (localStorage.getItem(BONUS_KEY) === currentDay) {
      return;
    }

    localStorage.setItem(BONUS_KEY, currentDay);

    addBalance(250);

    clickSound();
    openWinModal(250);

    button.classList.add("claimed");
    button.disabled = true;

    const text = button.querySelector(".bonus-text");

    if (text) {
      text.textContent = "Бонус получен";
    }
  });
}

/* =========================
   SOUND BUTTON
========================= */

function updateSoundButton() {
  const button = $("#soundToggle");

  if (!button) return;

  button.textContent = soundEnabled
    ? "🔊 Звук"
    : "🔇 Звук";
}

$("#soundToggle")?.addEventListener("click", () => {
  soundEnabled = !soundEnabled;

  localStorage.setItem(
    SOUND_KEY,
    soundEnabled ? "on" : "off"
  );

  updateSoundButton();

  if (soundEnabled) {
    clickSound();
  }
});

/* =========================
   INITIALIZATION
========================= */

updateBalance();
updateSoundButton();
setupDailyBonus();
renderGame("slots");