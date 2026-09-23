const tg = window.Telegram?.WebApp;

tg?.ready();
tg?.expand();
tg?.setHeaderColor?.("#080504");
tg?.setBackgroundColor?.("#080504");

const game = document.getElementById("game");
const balanceEl = document.getElementById("balance");
const toastEl = document.getElementById("toast");
const modalEl = document.getElementById("modal");
const winAmountEl = document.getElementById("winAmount");

let balance = Number(localStorage.getItem("golden_spin_balance")) || 12550;
let currentGame = "slots";
let currentBet = 100;
let soundEnabled = localStorage.getItem("golden_spin_sound") !== "off";

const symbols = ["💎", "7️⃣", "🍒", "⭐", "🍋", "🔔"];

function saveBalance() {
  localStorage.setItem("golden_spin_balance", balance);
  updateBalance();
}

function updateBalance() {
  balanceEl.textContent = balance.toLocaleString("ru-RU");
}

function toast(text) {
  toastEl.textContent = text;
  toastEl.classList.add("show");

  clearTimeout(window.toastTimer);

  window.toastTimer = setTimeout(() => {
    toastEl.classList.remove("show");
  }, 2200);
}


/* =========================
   SOUND
========================= */

let audio;

function playSound(type) {
  if (!soundEnabled) return;

  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();

    const osc = audio.createOscillator();
    const gain = audio.createGain();

    osc.connect(gain);
    gain.connect(audio.destination);

    const now = audio.currentTime;

    if (type === "click") {
      osc.frequency.value = 420;
      gain.gain.setValueAtTime(.035, now);
      gain.gain.exponentialRampToValueAtTime(.001, now + .08);
    }

    if (type === "spin") {
      osc.frequency.value = 160;
      gain.gain.setValueAtTime(.04, now);
      gain.gain.exponentialRampToValueAtTime(.001, now + .18);
    }

    if (type === "win") {
      osc.frequency.value = 620;
      gain.gain.setValueAtTime(.06, now);
      gain.gain.exponentialRampToValueAtTime(.001, now + .45);
    }

    if (type === "big") {
      osc.frequency.value = 900;
      gain.gain.setValueAtTime(.08, now);
      gain.gain.exponentialRampToValueAtTime(.001, now + .7);
    }

    osc.start(now);
    osc.stop(now + .8);
  } catch {}
}


/* =========================
   MODAL
========================= */

function showWin(amount) {
  winAmountEl.textContent = amount.toLocaleString("ru-RU");
  modalEl.classList.add("show");

  playSound(amount >= 500 ? "big" : "win");
}

function closeModal() {
  modalEl.classList.remove("show");
}

document.getElementById("closeModal").onclick = closeModal;


/* =========================
   SLOTS
========================= */

function renderSlots() {
  game.innerHTML = `
    <section class="game-panel">

      <div class="game-heading">
        <h2>🎰 GOLDEN SLOTS</h2>
        <span>3 REELS • WIN UP TO x10</span>
      </div>

      <div class="slots-machine">

        <div class="slots-top"></div>

        <div class="reels">

          <div class="reel">
            <div class="reel-symbol" id="reel1">💎</div>
          </div>

          <div class="reel">
            <div class="reel-symbol" id="reel2">7️⃣</div>
          </div>

          <div class="reel">
            <div class="reel-symbol" id="reel3">🍒</div>
          </div>

        </div>

        <div class="slot-line"></div>

      </div>

      <div class="bet-row">

        <button class="bet ${currentBet === 50 ? "active" : ""}" data-bet="50">
          50
        </button>

        <button class="bet ${currentBet === 100 ? "active" : ""}" data-bet="100">
          100
        </button>

        <button class="bet ${currentBet === 250 ? "active" : ""}" data-bet="250">
          250
        </button>

        <button class="bet ${currentBet === 500 ? "active" : ""}" data-bet="500">
          500
        </button>

      </div>

      <button class="spin-game-btn" id="slotSpin">
        🎰 КРУТИТЬ БАРАБАН
      </button>

    </section>
  `;

  document.querySelectorAll(".bet").forEach(btn => {
    btn.onclick = () => {
      currentBet = Number(btn.dataset.bet);
      playSound("click");
      renderSlots();
    };
  });

  document.getElementById("slotSpin").onclick = spinSlots;
}

async function spinSlots() {
  if (balance < currentBet) {
    toast("Недостаточно токенов");
    playSound("click");
    return;
  }

  balance -= currentBet;
  saveBalance();

  playSound("spin");

  const reels = [
    document.getElementById("reel1"),
    document.getElementById("reel2"),
    document.getElementById("reel3")
  ];

  const boxes = document.querySelectorAll(".reel");

  reels.forEach((r, i) => {
    r.style.opacity = ".3";
    r.style.transform = "scale(.8) rotateX(360deg)";
  });

  boxes.forEach(box => box.classList.remove("win"));

  let result;

  const random = Math.random();

  if (random < .04) {
    const s = symbols[Math.floor(Math.random() * symbols.length)];
    result = [s, s, s];
  } else if (random < .18) {
    const s = symbols[Math.floor(Math.random() * symbols.length)];
    result = [s, s, symbols[Math.floor(Math.random() * symbols.length)]];
  } else {
    result = [
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)]
    ];
  }

  for (let i = 0; i < reels.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 450 + i * 220));

    reels[i].textContent = result[i];
    reels[i].style.opacity = "1";
    reels[i].style.transform = "scale(1) rotateX(0)";
  }

  let prize = 0;

  if (result[0] === result[1] && result[1] === result[2]) {
    prize = currentBet * 10;
  } else if (
    result[0] === result[1] ||
    result[1] === result[2] ||
    result[0] === result[2]
  ) {
    prize = currentBet * 2;
  }

  if (prize > 0) {
    balance += prize;
    saveBalance();

    boxes.forEach(box => box.classList.add("win"));

    setTimeout(() => showWin(prize), 250);
  } else {
    toast("В этот раз мимо 😈");
  }
}


/* =========================
   OTHER GAMES
========================= */

function renderSimpleGame(title, icon, description, buttonText, action) {
  game.innerHTML = `
    <section class="game-panel">

      <div class="game-heading">
        <h2>${title}</h2>
        <span>VIRTUAL TOKENS</span>
      </div>

      <div class="big-game-icon">
        ${icon}
      </div>

      <div style="
        text-align:center;
        color:#806e5e;
        font-size:10px;
        line-height:1.6;
        margin-top:12px;
      ">
        ${description}
      </div>

      <button class="game-action" id="simpleAction">
        ${buttonText}
      </button>

    </section>
  `;

  document.getElementById("simpleAction").onclick = action;
}


/* =========================
   ROULETTE
========================= */

function roulette() {
  const cost = 100;

  if (balance < cost) {
    toast("Недостаточно токенов");
    return;
  }

  balance -= cost;

  const win = Math.random() < .35;
  const prize = win ? 250 : 0;

  if (prize) balance += prize;

  saveBalance();
  playSound(win ? "win" : "click");

  if (win) {
    showWin(prize);
  } else {
    toast("Рулетка остановилась на нуле");
  }
}


/* =========================
   WHEEL
========================= */

function wheel() {
  const cost = 100;

  if (balance < cost) {
    toast("Недостаточно токенов");
    return;
  }

  balance -= cost;

  const prizes = [0, 50, 100, 150, 250, 500];
  const prize = prizes[Math.floor(Math.random() * prizes.length)];

  balance += prize;
  saveBalance();

  if (prize) {
    showWin(prize);
  } else {
    toast("Колесо выбрало 0");
  }
}


/* =========================
   CHESTS
========================= */

function chest() {
  const cost = 100;

  if (balance < cost) {
    toast("Недостаточно токенов");
    return;
  }

  balance -= cost;

  const prizes = [0, 50, 50, 100, 150, 250, 500];
  const prize = prizes[Math.floor(Math.random() * prizes.length)];

  balance += prize;
  saveBalance();

  if (prize) {
    showWin(prize);
  } else {
    toast("Сундук оказался пустым 😈");
  }
}


/* =========================
   SMASH
========================= */

function smash() {
  const cost = 50;

  if (balance < cost) {
    toast("Недостаточно токенов");
    return;
  }

  balance -= cost;

  const prizes = [0, 0, 0, 50, 50, 100, 250];
  const prize = prizes[Math.floor(Math.random() * prizes.length)];

  balance += prize;
  saveBalance();

  if (prize) {
    showWin(prize);
  } else {
    toast("Блок оказался пустым");
  }
}


/* =========================
   GAME SWITCH
========================= */

function renderGame(name) {
  currentGame = name;

  document.querySelectorAll(".game-tab").forEach(tab => {
    tab.classList.toggle(
      "active",
      tab.dataset.game === name
    );
  });

  if (name === "slots") {
    renderSlots();
  }

  if (name === "roulette") {
    renderSimpleGame(
      "🎯 GOLDEN ROULETTE",
      "🎯",
      "Сделай ставку и попробуй поймать удачный сектор.",
      "КРУТИТЬ РУЛЕТКУ — 100",
      roulette
    );
  }

  if (name === "wheel") {
    renderSimpleGame(
      "🎡 LUCKY WHEEL",
      "🎡",
      "На колесе спрятаны призы до 500 виртуальных токенов.",
      "КРУТИТЬ КОЛЕСО — 100",
      wheel
    );
  }

  if (name === "chests") {
    renderSimpleGame(
      "🧰 GOLDEN CHESTS",
      "🧰",
      "Открой сундук и узнай, что внутри.",
      "ОТКРЫТЬ СУНДУК — 100",
      chest
    );
  }

  if (name === "smash") {
    renderSimpleGame(
      "💥 SMASH BLOCK",
      "💥",
      "Разбей блок и попробуй найти приз.",
      "РАЗБИТЬ БЛОК — 50",
      smash
    );
  }
}

document.querySelectorAll(".game-tab").forEach(tab => {
  tab.onclick = () => {
    playSound("click");
    renderGame(tab.dataset.game);
  };
});


/* =========================
   MAIN SPIN
========================= */

document.getElementById("mainSpin").onclick = () => {
  playSound("click");

  document.querySelector('[data-game="slots"]').click();

  setTimeout(() => {
    document.getElementById("slotSpin")?.click();
  }, 100);
};


/* =========================
   DAILY BONUS
========================= */

document.getElementById("dailyBonus").onclick = () => {

  const today = new Date().toISOString().slice(0, 10);
  const last = localStorage.getItem("golden_spin_bonus");

  if (last === today) {
    toast("Бонус уже забран сегодня 🎁");
    return;
  }

  localStorage.setItem("golden_spin_bonus", today);

  balance += 250;
  saveBalance();

  showWin(250);
};


/* =========================
   VIP
========================= */

document.getElementById("vipBtn").onclick = () => {
  toast("VIP скоро будет доступен 👑");
  playSound("click");
};


/* =========================
   SOUND BUTTON
========================= */

function updateSoundButton() {
  document.getElementById("soundToggle").textContent =
    soundEnabled ? "🔊" : "🔇";
}

document.getElementById("soundToggle").onclick = () => {

  soundEnabled = !soundEnabled;

  localStorage.setItem(
    "golden_spin_sound",
    soundEnabled ? "on" : "off"
  );

  updateSoundButton();
  playSound("click");
};


/* =========================
   INIT
========================= */

updateBalance();
updateSoundButton();
renderSlots();