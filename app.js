const tg = window.Telegram?.WebApp;

tg?.ready();
tg?.expand();
tg?.setHeaderColor?.("#120806");
tg?.setBackgroundColor?.("#080404");

const STORAGE_KEY = "golden_spin_balance_v3";
const BONUS_KEY = "golden_spin_daily_v3";
const SOUND_KEY = "golden_spin_sound_v3";

let balance = Number(localStorage.getItem(STORAGE_KEY));

if (!Number.isFinite(balance) || balance < 0) {
  balance = 12550;
}

let soundEnabled = localStorage.getItem(SOUND_KEY) !== "off";
let currentGame = "slots";
let spinning = false;

const $ = (selector) => document.querySelector(selector);

const balanceEl = $("#balance");
const gameEl = $("#game");
const toastEl = $("#toast");
const modalEl = $("#modal");
const vipModalEl = $("#vipModal");

function saveBalance() {
  localStorage.setItem(STORAGE_KEY, String(balance));
  renderBalance();
}

function renderBalance() {
  if (balanceEl) {
    balanceEl.textContent = balance.toLocaleString("ru-RU");
  }
}

function formatNumber(number) {
  return Number(number).toLocaleString("ru-RU");
}

function showToast(message) {
  if (!toastEl) return;

  toastEl.textContent = message;
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

function takeBalance(amount) {
  if (balance < amount) {
    showToast("Недостаточно токенов");
    playSound("bad");
    return false;
  }

  balance -= amount;
  saveBalance();
  return true;
}

/* =========================
   SOUND ENGINE
========================= */

let audioContext = null;

function getAudioContext() {
  if (!soundEnabled) return null;

  if (!audioContext) {
    audioContext = new (
      window.AudioContext ||
      window.webkitAudioContext
    )();
  }

  return audioContext;
}

function tone(frequency, duration, type = "sine", volume = 0.045) {
  if (!soundEnabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume();
  }

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
}

function playSound(type) {
  if (!soundEnabled) return;

  if (type === "click") {
    tone(520, 0.06, "sine", 0.035);
  }

  if (type === "spin") {
    tone(180, 0.08, "square", 0.025);

    setTimeout(() => tone(250, 0.08, "square", 0.02), 80);
    setTimeout(() => tone(320, 0.08, "square", 0.018), 160);
  }

  if (type === "win") {
    tone(523, 0.12, "sine", 0.04);

    setTimeout(() => tone(659, 0.12, "sine", 0.045), 100);
    setTimeout(() => tone(784, 0.18, "sine", 0.05), 210);
  }

  if (type === "big") {
    tone(392, 0.12, "sine", 0.045);

    setTimeout(() => tone(523, 0.12, "sine", 0.05), 120);
    setTimeout(() => tone(659, 0.12, "sine", 0.055), 240);
    setTimeout(() => tone(1046, 0.28, "sine", 0.06), 380);
  }

  if (type === "bad") {
    tone(180, 0.18, "sawtooth", 0.035);

    setTimeout(() => tone(130, 0.22, "sawtooth", 0.025), 130);
  }

  if (type === "open") {
    tone(300, 0.08, "sine", 0.03);

    setTimeout(() => tone(450, 0.1, "sine", 0.035), 90);
    setTimeout(() => tone(650, 0.15, "sine", 0.04), 190);
  }
}

/* =========================
   WIN MODAL
========================= */

function showWin(amount) {
  if (!modalEl) return;

  const amountEl = $("#winAmount");

  if (amountEl) {
    amountEl.textContent = `+${formatNumber(amount)}`;
  }

  modalEl.classList.add("show");

  if (amount >= 500) {
    playSound("big");
  } else {
    playSound("win");
  }
}

function closeWinModal() {
  modalEl?.classList.remove("show");
}

$("#closeModal")?.addEventListener("click", closeWinModal);

modalEl?.addEventListener("click", (event) => {
  if (event.target === modalEl) {
    closeWinModal();
  }
});

/* =========================
   VIP
========================= */

$("#vipBtn")?.addEventListener("click", () => {
  playSound("click");
  vipModalEl?.classList.add("show");
});

$("#closeVipModal")?.addEventListener("click", () => {
  vipModalEl?.classList.remove("show");
});

vipModalEl?.addEventListener("click", (event) => {
  if (event.target === vipModalEl) {
    vipModalEl.classList.remove("show");
  }
});

/* =========================
   PROFILE
========================= */

function setupProfile() {
  const profileLetter = $("#profileLetter");

  const firstName =
    tg?.initDataUnsafe?.user?.first_name || "G";

  if (profileLetter) {
    profileLetter.textContent =
      firstName.trim().charAt(0).toUpperCase() || "G";
  }
}

$("#profileButton")?.addEventListener("click", () => {
  playSound("click");

  const firstName =
    tg?.initDataUnsafe?.user?.first_name || "Игрок";

  showToast(`Добро пожаловать, ${firstName}!`);
});

/* =========================
   GAME CARDS
========================= */

document.querySelectorAll(".game-card").forEach((card) => {
  card.addEventListener("click", () => {
    const game = card.dataset.game;

    if (!game) return;

    playSound("click");
    selectGame(game);

    setTimeout(() => {
      gameEl?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 50);
  });
});

function selectGame(game) {
  currentGame = game;

  document.querySelectorAll(".game-card").forEach((card) => {
    card.classList.toggle(
      "active",
      card.dataset.game === game
    );
  });

  renderGame(game);
}

/* =========================
   GAME PANEL
========================= */

function renderGame(game) {
  if (!gameEl) return;

  if (game === "slots") {
    renderSlots();
    return;
  }

  if (game === "roulette") {
    renderRoulette();
    return;
  }

  if (game === "wheel") {
    renderWheel();
    return;
  }

  if (game === "chests") {
    renderChests();
    return;
  }

  if (game === "smash") {
    renderSmash();
    return;
  }
}

/* =========================
   SLOTS
========================= */

const slotSymbols = [
  "◆",
  "7",
  "♛",
  "✦",
  "●",
  "♦"
];

let selectedBet = 100;

function renderSlots() {
  gameEl.innerHTML = `
    <section class="game-panel slots-panel">

      <div class="game-heading">
        <div>
          <span class="eyebrow">PREMIUM GAME</span>
          <h2>Золотые слоты</h2>
          <p>Испытай удачу и сорви большой куш</p>
        </div>

        <div class="game-badge">×500</div>
      </div>

      <div class="slots-machine">

        <div class="slot-top">
          <span>GOLDEN JACKPOT</span>
          <span>● LIVE</span>
        </div>

        <div class="reels">

          <div class="reel" data-index="0">
            <div class="reel-symbol">◆</div>
          </div>

          <div class="reel" data-index="1">
            <div class="reel-symbol">7</div>
          </div>

          <div class="reel" data-index="2">
            <div class="reel-symbol">✦</div>
          </div>

        </div>

        <div class="slot-line"></div>

        <div class="slot-jackpot">
          <span>JACKPOT</span>
          <strong>2,500,000</strong>
        </div>

      </div>

      <div class="bet-row">

        ${[50, 100, 250, 500]
          .map(
            (bet) => `
              <button
                class="bet ${bet === selectedBet ? "active" : ""}"
                data-bet="${bet}"
              >
                ${bet}
              </button>
            `
          )
          .join("")}

      </div>

      <button class="spin-game-btn" id="slotsSpin">
        <span>SPIN</span>
        <small>−${selectedBet} токенов</small>
      </button>

      <div class="payouts">
        <div>
          <span>◆ ◆ ◆</span>
          <b>x500</b>
        </div>

        <div>
          <span>7 7 7</span>
          <b>x100</b>
        </div>

        <div>
          <span>✦ ✦ ✦</span>
          <b>x25</b>
        </div>

        <div>
          <span>2 одинаковых</span>
          <b>x2</b>
        </div>
      </div>

    </section>
  `;

  document.querySelectorAll(".bet").forEach((button) => {
    button.addEventListener("click", () => {
      selectedBet = Number(button.dataset.bet);

      playSound("click");
      renderSlots();
    });
  });

  $("#slotsSpin")?.addEventListener("click", spinSlots);
}

function randomSlotSymbol() {
  return slotSymbols[
    Math.floor(Math.random() * slotSymbols.length)
  ];
}

function spinSlots() {
  if (spinning) return;

  if (!takeBalance(selectedBet)) return;

  spinning = true;
  playSound("spin");

  const reels = document.querySelectorAll(".reel");

  reels.forEach((reel, index) => {
    reel.classList.add("spinning");

    const symbol = reel.querySelector(".reel-symbol");

    if (symbol) {
      let counter = 0;

      const interval = setInterval(() => {
        symbol.textContent = randomSlotSymbol();
        counter++;

        if (counter >= 12 + index * 5) {
          clearInterval(interval);
        }
      }, 65);
    }
  });

  setTimeout(() => {
    const result = [
      randomSlotSymbol(),
      randomSlotSymbol(),
      randomSlotSymbol()
    ];

    /*
      Небольшой шанс специальных комбинаций.
    */

    const roll = Math.random();

    if (roll < 0.015) {
      result[0] = "◆";
      result[1] = "◆";
      result[2] = "◆";
    } else if (roll < 0.08) {
      const symbol = "7";

      result[0] = symbol;
      result[1] = symbol;
      result[2] = symbol;
    } else if (roll < 0.18) {
      const symbol = randomSlotSymbol();

      result[0] = symbol;
      result[1] = symbol;
    }

    reels.forEach((reel, index) => {
      reel.classList.remove("spinning");

      const symbol = reel.querySelector(".reel-symbol");

      if (symbol) {
        symbol.textContent = result[index];
      }
    });

    let multiplier = 0;

    if (
      result[0] === "◆" &&
      result[1] === "◆" &&
      result[2] === "◆"
    ) {
      multiplier = 500;
    } else if (
      result[0] === "7" &&
      result[1] === "7" &&
      result[2] === "7"
    ) {
      multiplier = 100;
    } else if (
      result[0] === "✦" &&
      result[1] === "✦" &&
      result[2] === "✦"
    ) {
      multiplier = 25;
    } else if (
      result[0] === result[1] ||
      result[1] === result[2] ||
      result[0] === result[2]
    ) {
      multiplier = 2;
    }

    const win = selectedBet * multiplier;

    spinning = false;

    if (win > 0) {
      addBalance(win);
      showWin(win);
    } else {
      showToast("В этот раз без выигрыша");
      playSound("bad");
    }
  }, 1450);
}

/* =========================
   ROULETTE
========================= */

function renderRoulette() {
  gameEl.innerHTML = `
    <section class="game-panel">

      <div class="game-heading">
        <div>
          <span class="eyebrow">EURO ROULETTE</span>
          <h2>Золотая рулетка</h2>
          <p>Сделай ставку и попробуй удвоить её</p>
        </div>

        <div class="game-badge">×2</div>
      </div>

      <div class="roulette-stage">
        <div class="big-game-icon roulette-art">
          <div class="roulette-wheel">
            <div class="roulette-center">GS</div>
          </div>
        </div>
      </div>

      <div class="game-info-row">
        <span>СТАВКА</span>
        <strong>100</strong>
      </div>

      <button class="game-action" id="rouletteSpin">
        КРУТИТЬ РУЛЕТКУ
      </button>

      <div class="mini-note">
        Шанс выигрыша зависит от результата раунда
      </div>

    </section>
  `;

  $("#rouletteSpin")?.addEventListener("click", playRoulette);
}

function playRoulette() {
  if (spinning) return;

  const bet = 100;

  if (!takeBalance(bet)) return;

  spinning = true;

  const wheel = document.querySelector(".roulette-wheel");

  playSound("spin");

  if (wheel) {
    wheel.classList.add("roulette-spin");
  }

  setTimeout(() => {
    spinning = false;

    if (wheel) {
      wheel.classList.remove("roulette-spin");
    }

    const win = Math.random() < 0.35;

    if (win) {
      addBalance(200);
      showWin(200);
    } else {
      showToast("Рулетка не принесла выигрыш");
      playSound("bad");
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
          <h2>Колесо удачи</h2>
          <p>Крути колесо и забирай награду</p>
        </div>

        <div class="game-badge">FREE</div>
      </div>

      <div class="wheel-stage">
        <div class="wheel-pointer"></div>

        <div class="big-game-icon wheel-art">
          <div class="prize-wheel">
            <span>0</span>
            <span>50</span>
            <span>100</span>
            <span>250</span>
            <span>500</span>
            <span>100</span>
          </div>

          <div class="wheel-center">SPIN</div>
        </div>
      </div>

      <div class="game-info-row">
        <span>СТОИМОСТЬ</span>
        <strong>100</strong>
      </div>

      <button class="game-action" id="wheelSpin">
        КРУТИТЬ
      </button>

    </section>
  `;

  $("#wheelSpin")?.addEventListener("click", playWheel);
}

function playWheel() {
  if (spinning) return;

  if (!takeBalance(100)) return;

  spinning = true;

  const wheel = document.querySelector(".prize-wheel");

  playSound("spin");

  if (wheel) {
    wheel.classList.add("wheel-spin");
  }

  setTimeout(() => {
    spinning = false;

    const prizes = [
      0,
      50,
      100,
      150,
      250,
      500
    ];

    const prize =
      prizes[Math.floor(Math.random() * prizes.length)];

    if (wheel) {
      wheel.classList.remove("wheel-spin");
    }

    if (prize > 0) {
      addBalance(prize);
      showWin(prize);
    } else {
      showToast("Колесо остановилось на 0");
      playSound("bad");
    }
  }, 2100);
}

/* =========================
   CHESTS
========================= */

function renderChests() {
  gameEl.innerHTML = `
    <section class="game-panel">

      <div class="game-heading">
        <div>
          <span class="eyebrow">TREASURE ROOM</span>
          <h2>Золотые сундуки</h2>
          <p>Выбери сундук и узнай свою награду</p>
        </div>

        <div class="game-badge">LUCK</div>
      </div>

      <div class="chests-grid">

        <button class="chest" data-chest="1">
          <span class="chest-lock">◆</span>
          <strong>01</strong>
          <small>100</small>
        </button>

        <button class="chest" data-chest="2">
          <span class="chest-lock">◆</span>
          <strong>02</strong>
          <small>100</small>
        </button>

        <button class="chest" data-chest="3">
          <span class="chest-lock">◆</span>
          <strong>03</strong>
          <small>100</small>
        </button>

      </div>

      <div class="game-info-row">
        <span>ОТКРЫТИЕ</span>
        <strong>100</strong>
      </div>

      <div class="mini-note">
        В каждом сундуке может быть разная награда
      </div>

    </section>
  `;

  document.querySelectorAll(".chest").forEach((chest) => {
    chest.addEventListener("click", () => {
      openChest(chest);
    });
  });
}

function openChest(chest) {
  if (spinning) return;

  if (!takeBalance(100)) return;

  spinning = true;

  playSound("open");

  chest.classList.add("opened");

  setTimeout(() => {
    const prizes = [
      0,
      50,
      50,
      100,
      150,
      250,
      500
    ];

    const prize =
      prizes[Math.floor(Math.random() * prizes.length)];

    spinning = false;

    if (prize > 0) {
      addBalance(prize);
      showWin(prize);
    } else {
      showToast("Сундук оказался пустым");
      playSound("bad");
    }
  }, 1000);
}

/* =========================
   SMASH
========================= */

function renderSmash() {
  gameEl.innerHTML = `
    <section class="game-panel">

      <div class="game-heading">
        <div>
          <span class="eyebrow">SMASH GAME</span>
          <h2>Разбей блок</h2>
          <p>Один удар — одна награда</p>
        </div>

        <div class="game-badge">×250</div>
      </div>

      <div class="smash-stage">

        <button class="smash-block" id="smashBlock">
          <span>?</span>
        </button>

        <div class="smash-hammer">
          🔨
        </div>

      </div>

      <div class="game-info-row">
        <span>СТОИМОСТЬ УДАРА</span>
        <strong>50</strong>
      </div>

      <button class="game-action" id="smashButton">
        РАЗБИТЬ
      </button>

      <div class="mini-note">
        Сюрприз находится внутри блока
      </div>

    </section>
  `;

  $("#smashButton")?.addEventListener("click", smashBlock);
  $("#smashBlock")?.addEventListener("click", smashBlock);
}

function smashBlock() {
  if (spinning) return;

  if (!takeBalance(50)) return;

  spinning = true;

  const block = $("#smashBlock");

  playSound("click");

  block?.classList.add("smashing");

  setTimeout(() => {
    const prizes = [
      0,
      0,
      0,
      50,
      50,
      100,
      250
    ];

    const prize =
      prizes[Math.floor(Math.random() * prizes.length)];

    spinning = false;

    if (block) {
      block.classList.remove("smashing");
      block.classList.add("broken");
    }

    if (prize > 0) {
      addBalance(prize);
      showWin(prize);
    } else {
      showToast("Внутри ничего ценного");
      playSound("bad");
    }

    setTimeout(() => {
      renderSmash();
    }, 900);
  }, 700);
}

/* =========================
   DAILY BONUS
========================= */

function setupDailyBonus() {
  const button = $("#dailyBonus");

  if (!button) return;

  const today = new Date()
    .toISOString()
    .slice(0, 10);

  const claimed =
    localStorage.getItem(BONUS_KEY) === today;

  if (claimed) {
    button.classList.add("claimed");
    button.disabled = true;
    button.innerHTML = `
      <span>✓</span>
      Бонус уже получен
    `;
  }

  button.addEventListener("click", () => {
    const currentDay = new Date()
      .toISOString()
      .slice(0, 10);

    if (localStorage.getItem(BONUS_KEY) === currentDay) {
      showToast("Бонус уже получен сегодня");
      return;
    }

    localStorage.setItem(BONUS_KEY, currentDay);

    addBalance(250);

    button.classList.add("claimed");
    button.disabled = true;

    button.innerHTML = `
      <span>✓</span>
      Бонус получен +250
    `;

    showWin(250);
  });
}

/* =========================
   SOUND TOGGLE
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
    playSound("click");
    showToast("Звук включён");
  } else {
    showToast("Звук выключен");
  }
});

/* =========================
   MAIN SPIN
========================= */

$("#mainSpin")?.addEventListener("click", () => {
  playSound("click");

  selectGame("slots");

  setTimeout(() => {
    gameEl?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    setTimeout(() => {
      $("#slotsSpin")?.click();
    }, 450);
  }, 100);
});

/* =========================
   TELEGRAM MAIN BUTTON
========================= */

try {
  tg?.MainButton?.hide?.();
} catch (error) {
  // Telegram MainButton может быть недоступен вне Telegram.
}

/* =========================
   INITIALIZATION
========================= */

renderBalance();
setupProfile();
setupDailyBonus();
updateSoundButton();
selectGame("slots");

/*
  Небольшой стартовый эффект.
*/

setTimeout(() => {
  document.body.classList.add("ready");
}, 100);

/*
  Запрещаем случайное масштабирование двойным тапом
  внутри игрового интерфейса.
*/

document.addEventListener(
  "dblclick",
  (event) => {
    if (
      event.target.closest(
        "button, .game-card, .game-panel"
      )
    ) {
      event.preventDefault();
    }
  },
  { passive: false }
);