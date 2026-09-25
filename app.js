/* =========================================================
   GOLDEN SPIN
   Complete front-end game engine
========================================================= */

const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
}


/* =========================================================
   STATE
========================================================= */

const savedBalance = Number(localStorage.getItem("golden_balance"));

const state = {
  balance: Number.isFinite(savedBalance) ? savedBalance : 12500,
  bet: Number(localStorage.getItem("golden_bet")) || 50,
  sound: localStorage.getItem("golden_sound") !== "off",
  game: "slots",
  busy: false,
  dailyClaimed: localStorage.getItem("golden_daily") === new Date().toDateString()
};

const betSteps = [10, 25, 50, 100, 250, 500, 1000];


/* =========================================================
   ELEMENTS
========================================================= */

const balanceEl = document.getElementById("balance");
const gameArea = document.getElementById("gameArea");
const toastEl = document.getElementById("toast");

const soundBtn = document.getElementById("soundBtn");
const vipBtn = document.getElementById("vipBtn");
const vipModal = document.getElementById("vipModal");
const closeVip = document.getElementById("closeVip");

const winModal = document.getElementById("winModal");
const winValue = document.getElementById("winValue");
const closeWin = document.getElementById("closeWin");

const dailyBtn = document.getElementById("dailyBtn");

const gameTabs = [...document.querySelectorAll(".game-tab")];

const heroSpin = document.getElementById("heroSpin");


/* =========================================================
   HELPERS
========================================================= */

function save() {
  localStorage.setItem("golden_balance", String(state.balance));
  localStorage.setItem("golden_bet", String(state.bet));
}

function formatNumber(value) {
  return Math.floor(value).toLocaleString("ru-RU").replace(/\u00a0/g, " ");
}

function updateBalance() {
  balanceEl.textContent = formatNumber(state.balance);
}

function moneyEnough() {
  if (state.balance < state.bet) {
    toast("Недостаточно токенов");
    sound("error");
    return false;
  }

  return true;
}

function spend(amount) {
  state.balance -= amount;
  save();
  updateBalance();
}

function add(amount) {
  state.balance += amount;
  save();
  updateBalance();
}

function toast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");

  clearTimeout(toast.timer);

  toast.timer = setTimeout(() => {
    toastEl.classList.remove("show");
  }, 2200);
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


/* =========================================================
   SOUND ENGINE
========================================================= */

let audioContext = null;

function audio() {
  if (!state.sound) return null;

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

function tone(freq, duration = .08, type = "sine", volume = .05) {

  const ctx = audio();

  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.value = freq;

  gain.gain.setValueAtTime(volume, ctx.currentTime);

  gain.gain.exponentialRampToValueAtTime(
    .001,
    ctx.currentTime + duration
  );

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start();

  oscillator.stop(
    ctx.currentTime + duration
  );
}

function sound(name) {

  if (!state.sound) return;

  if (name === "click") {
    tone(500, .05, "square", .035);
  }

  if (name === "spin") {
    tone(130, .08, "sawtooth", .025);
    setTimeout(() => tone(180, .08, "sawtooth", .02), 90);
  }

  if (name === "win") {
    tone(523, .12, "sine", .06);
    setTimeout(() => tone(659, .12, "sine", .06), 100);
    setTimeout(() => tone(784, .2, "sine", .07), 210);
  }

  if (name === "bigwin") {
    tone(392, .12, "sine", .06);
    setTimeout(() => tone(523, .12, "sine", .07), 120);
    setTimeout(() => tone(659, .12, "sine", .07), 240);
    setTimeout(() => tone(1046, .35, "sine", .08), 380);
  }

  if (name === "error") {
    tone(130, .15, "square", .04);
    setTimeout(() => tone(100, .18, "square", .03), 120);
  }

  if (name === "chest") {
    tone(300, .1, "triangle", .05);
    setTimeout(() => tone(500, .1, "triangle", .05), 100);
    setTimeout(() => tone(800, .25, "triangle", .07), 200);
  }
}

function toggleSound() {

  state.sound = !state.sound;

  localStorage.setItem(
    "golden_sound",
    state.sound ? "on" : "off"
  );

  soundBtn.textContent =
    state.sound ? "🔊 ЗВУК" : "🔇 ЗВУК";

  if (state.sound) {
    sound("click");
  }
}


/* =========================================================
   CONFETTI
========================================================= */

function confetti() {

  for (let i = 0; i < 70; i++) {

    const piece = document.createElement("div");

    piece.className = "confetti";

    piece.style.setProperty(
      "--x",
      Math.random()
    );

    piece.style.setProperty(
      "--y",
      Math.random()
    );

    piece.style.left =
      `${45 + Math.random() * 10}%`;

    piece.style.background =
      [
        "#ffd84d",
        "#fff0a0",
        "#ff9d00",
        "#ffffff"
      ][random(0, 3)];

    document.body.appendChild(piece);

    setTimeout(() => piece.remove(), 1700);
  }
}


/* =========================================================
   WIN
========================================================= */

function win(amount) {

  if (amount <= 0) return;

  add(amount);

  winValue.textContent = "+" + formatNumber(amount);

  winModal.classList.add("show");

  if (amount >= state.bet * 8) {
    sound("bigwin");
  } else {
    sound("win");
  }

  confetti();
}

function closeWinModal() {
  winModal.classList.remove("show");
}


/* =========================================================
   BET CONTROLS
========================================================= */

function betControls() {

  return `
    <div class="controls">

      <div class="bet-box">

        <button data-bet="-1">−</button>

        <div>
          СТАВКА
          <strong class="bet-value">
            ${formatNumber(state.bet)}
          </strong>
        </div>

        <button data-bet="1">+</button>

      </div>

    </div>
  `;
}

function changeBet(direction) {

  let index = betSteps.indexOf(state.bet);

  if (index === -1) index = 2;

  index += direction;

  index = Math.max(
    0,
    Math.min(betSteps.length - 1, index)
  );

  state.bet = betSteps[index];

  save();

  renderGame();

  sound("click");
}


/* =========================================================
   SLOTS
========================================================= */

const slotSymbols = [
  "🍋",
  "🍒",
  "💎",
  "⭐",
  "7️⃣",
  "BAR",
  "🍀"
];

function slotsGame() {

  gameArea.innerHTML = `

    <section class="game-screen">

      <div class="game-title">
        <small>GOLDEN JACKPOT</small>
        <h2>🎰 СЛОТЫ</h2>
      </div>

      <div class="slot-machine">

        <div class="slot-top">
          <span>GOLDEN SPIN</span>
          <span>★ JACKPOT ★</span>
        </div>

        <div class="slot-window">

          <div class="reel" id="reel0">7️⃣</div>
          <div class="reel" id="reel1">BAR</div>
          <div class="reel" id="reel2">💎</div>

        </div>

      </div>

      ${betControls()}

      <div class="controls">

        <button class="gold-btn" id="slotSpin">
          КРУТИТЬ / SPIN
        </button>

      </div>

    </section>
  `;

  document
    .getElementById("slotSpin")
    .addEventListener("click", spinSlots);

  bindBetButtons();
}

function spinSlots() {

  if (state.busy) return;
  if (!moneyEnough()) return;

  state.busy = true;

  spend(state.bet);

  const reels = [
    document.getElementById("reel0"),
    document.getElementById("reel1"),
    document.getElementById("reel2")
  ];

  reels.forEach(r => r.classList.add("spin"));

  sound("spin");

  let ticks = 0;

  const interval = setInterval(() => {

    reels.forEach(reel => {
      reel.textContent =
        slotSymbols[random(0, slotSymbols.length - 1)];
    });

    ticks++;

    sound("spin");

    if (ticks >= 25) {

      clearInterval(interval);

      const result = [
        slotSymbols[random(0, slotSymbols.length - 1)],
        slotSymbols[random(0, slotSymbols.length - 1)],
        slotSymbols[random(0, slotSymbols.length - 1)]
      ];

      reels.forEach((reel, i) => {
        reel.textContent = result[i];
        reel.classList.remove("spin");
      });

      const same =
        result[0] === result[1] &&
        result[1] === result[2];

      const pair =
        result[0] === result[1] ||
        result[1] === result[2] ||
        result[0] === result[2];

      let multiplier = 0;

      if (same) {

        if (result[0] === "💎") {
          multiplier = 20;
        } else if (result[0] === "7️⃣") {
          multiplier = 15;
        } else if (result[0] === "BAR") {
          multiplier = 12;
        } else {
          multiplier = 8;
        }

      } else if (pair) {
        multiplier = 2;
      }

      const amount =
        state.bet * multiplier;

      reels.forEach(r => {
        if (multiplier > 0) {
          r.classList.add("win");
        }
      });

      setTimeout(() => {

        if (amount > 0) {

          toast(
            `Выигрыш +${formatNumber(amount)}`
          );

          win(amount);

        } else {

          toast("Не повезло. Попробуй ещё раз.");
          sound("error");

        }

        state.busy = false;

      }, 450);

    }

  }, 75);
}


/* =========================================================
   ROULETTE
========================================================= */

function rouletteGame() {

  gameArea.innerHTML = `

    <section class="game-screen">

      <div class="game-title">
        <small>EURO ROULETTE</small>
        <h2>🎯 РУЛЕТКА</h2>
      </div>

      <div class="roulette-wrap">

        <div class="pointer">▼</div>

        <div class="roulette" id="rouletteWheel"></div>

      </div>

      ${betControls()}

      <div class="controls">

        <button
          class="gold-btn"
          id="rouletteSpin"
        >
          КРУТИТЬ РУЛЕТКУ
        </button>

      </div>

      <div class="controls">

        <button class="outline-choice" data-color="red">
          🔴 КРАСНОЕ
        </button>

        <button class="outline-choice" data-color="black">
          ⚫ ЧЁРНОЕ
        </button>

      </div>

    </section>
  `;

  let selected = "red";

  document
    .querySelectorAll(".outline-choice")
    .forEach(btn => {

      btn.style.cssText = `
        padding:12px 18px;
        border:1px solid #a96814;
        background:#160903;
        color:#ffd66c;
        border-radius:6px;
      `;

      btn.addEventListener("click", () => {

        selected = btn.dataset.color;

        document
          .querySelectorAll(".outline-choice")
          .forEach(x => x.style.boxShadow = "");

        btn.style.boxShadow =
          "0 0 18px rgba(255,180,30,.55)";

        sound("click");

      });

    });

  document
    .getElementById("rouletteSpin")
    .addEventListener("click", () => {

      if (state.busy) return;
      if (!moneyEnough()) return;

      state.busy = true;

      spend(state.bet);

      const wheel =
        document.getElementById("rouletteWheel");

      const extra =
        1440 * 3 + random(0, 359);

      wheel.style.transform =
        `rotate(${extra}deg)`;

      sound("spin");

      setTimeout(() => {

        const red =
          Math.random() < .48;

        const resultColor =
          red ? "red" : "black";

        const number =
          random(1, 36);

        if (resultColor === selected) {

          const amount =
            state.bet * 2;

          win(amount);

          toast(
            `${number} — ${resultColor === "red" ? "красное" : "чёрное"}`
          );

        } else {

          toast(
            `${number} — ${resultColor === "red" ? "красное" : "чёрное"}`
          );

          sound("error");

        }

        state.busy = false;

      }, 4200);

    });

  bindBetButtons();
}


/* =========================================================
   FORTUNE WHEEL
========================================================= */

function wheelGame() {

  gameArea.innerHTML = `

    <section class="game-screen">

      <div class="game-title">
        <small>LUCKY WHEEL</small>
        <h2>🎡 КОЛЕСО ФОРТУНЫ</h2>
      </div>

      <div class="fortune-wrap">

        <div class="fortune-pointer">▼</div>

        <div
          class="fortune-wheel"
          id="fortuneWheel"
        ></div>

      </div>

      <div class="controls">

        <button
          class="gold-btn"
          id="fortuneSpin"
        >
          КРУТИТЬ
        </button>

      </div>

      <p style="
        text-align:center;
        color:#b99450;
        margin-top:20px;
      ">
        Возможный выигрыш: 0× — 2× — 3× — 5× — 10×
      </p>

    </section>
  `;

  document
    .getElementById("fortuneSpin")
    .addEventListener("click", () => {

      if (state.busy) return;
      if (!moneyEnough()) return;

      state.busy = true;

      spend(state.bet);

      const wheel =
        document.getElementById("fortuneWheel");

      const extra =
        1440 * 3 + random(0, 359);

      wheel.style.transform =
        `rotate(${extra}deg)`;

      sound("spin");

      setTimeout(() => {

        const multipliers = [
          0, 2, 2, 3,
          3, 5, 5, 10
        ];

        const multiplier =
          multipliers[
            random(0, multipliers.length - 1)
          ];

        const amount =
          state.bet * multiplier;

        if (amount > 0) {
          win(amount);
        } else {
          toast("Колесо остановилось на 0×");
          sound("error");
        }

        state.busy = false;

      }, 4200);

    });
}


/* =========================================================
   CHESTS
========================================================= */

function chestsGame() {

  gameArea.innerHTML = `

    <section class="game-screen">

      <div class="game-title">
        <small>TREASURE ROOM</small>
        <h2>💎 СУНДУКИ</h2>
      </div>

      <p style="
        text-align:center;
        color:#c09a56;
      ">
        Выбери один сундук и узнай награду
      </p>

      <div class="chests">

        <button class="chest" data-chest="1">
          <span class="chest-icon">🧰</span>
          <small>СУНДУК I</small>
        </button>

        <button class="chest" data-chest="2">
          <span class="chest-icon">💰</span>
          <small>СУНДУК II</small>
        </button>

        <button class="chest" data-chest="3">
          <span class="chest-icon">💎</span>
          <small>СУНДУК III</small>
        </button>

      </div>

    </section>
  `;

  document
    .querySelectorAll(".chest")
    .forEach(chest => {

      chest.addEventListener("click", () => {

        if (state.busy) return;
        if (!moneyEnough()) return;

        state.busy = true;

        spend(state.bet);

        chest.style.transform =
          "scale(1.08) rotate(-2deg)";

        sound("chest");

        setTimeout(() => {

          const multipliers = [
            .5,
            1,
            2,
            3,
            5,
            10
          ];

          const multiplier =
            multipliers[
              random(0, multipliers.length - 1)
            ];

          const amount =
            Math.floor(
              state.bet * multiplier
            );

          if (amount > 0) {

            win(amount);

            toast(
              `Сундук: +${formatNumber(amount)}`
            );

          }

          state.busy = false;

          setTimeout(
            () => chest.style.transform = "",
            400
          );

        }, 800);

      });

    });
}


/* =========================================================
   SMASH
========================================================= */

function smashGame() {

  gameArea.innerHTML = `

    <section class="game-screen">

      <div class="game-title">
        <small>SMASH GAME</small>
        <h2>🔨 РАЗБЕЙ БЛОК</h2>
      </div>

      <p style="
        text-align:center;
        color:#c09a56;
      ">
        Один из блоков содержит большой приз
      </p>

      <div class="smash-board">

        ${Array.from(
          {length:9},
          (_,i) => `
            <button
              class="block"
              data-index="${i}"
            >
              ?
            </button>
          `
        ).join("")}

      </div>

    </section>
  `;

  const winningIndex =
    random(0, 8);

  document
    .querySelectorAll(".block")
    .forEach((block, index) => {

      block.addEventListener("click", () => {

        if (state.busy) return;
        if (!moneyEnough()) return;

        state.busy = true;

        spend(state.bet);

        block.classList.add("broken");

        sound("click");

        setTimeout(() => {

          if (index === winningIndex) {

            const amount =
              state.bet * 6;

            win(amount);

          } else {

            toast("Пусто!");

            sound("error");

          }

          state.busy = false;

        }, 450);

      });

    });
}


/* =========================================================
   RENDER
========================================================= */

function renderGame() {

  state.busy = false;

  gameTabs.forEach(tab => {
    tab.classList.toggle(
      "active",
      tab.dataset.game === state.game
    );
  });

  if (state.game === "slots") {
    slotsGame();
  }

  if (state.game === "roulette") {
    rouletteGame();
  }

  if (state.game === "wheel") {
    wheelGame();
  }

  if (state.game === "chests") {
    chestsGame();
  }

  if (state.game === "smash") {
    smashGame();
  }

  window.scrollTo({
    top: gameArea.offsetTop - 70,
    behavior: "smooth"
  });
}


/* =========================================================
   NAVIGATION
========================================================= */

gameTabs.forEach(tab => {

  tab.addEventListener("click", () => {

    state.game = tab.dataset.game;

    sound("click");

    renderGame();

  });

});

const gameOrder = [
  "slots",
  "roulette",
  "wheel",
  "chests",
  "smash"
];

function moveGame(direction) {

  let index =
    gameOrder.indexOf(state.game);

  index += direction;

  if (index < 0) {
    index = gameOrder.length - 1;
  }

  if (index >= gameOrder.length) {
    index = 0;
  }

  state.game =
    gameOrder[index];

  sound("click");

  renderGame();
}

document
  .getElementById("prevGame")
  .addEventListener(
    "click",
    () => moveGame(-1)
  );

document
  .getElementById("nextGame")
  .addEventListener(
    "click",
    () => moveGame(1)
  );

heroSpin.addEventListener("click", () => {

  state.game = "slots";

  sound("click");

  renderGame();

  setTimeout(() => {

    document
      .getElementById("slotSpin")
      ?.click();

  }, 350);

});


/* =========================================================
   BET
========================================================= */

function bindBetButtons() {

  document
    .querySelectorAll("[data-bet]")
    .forEach(button => {

      button.addEventListener("click", () => {

        changeBet(
          Number(button.dataset.bet)
        );

      });

    });

}


/* =========================================================
   DAILY BONUS
========================================================= */

function updateDaily() {

  if (state.dailyClaimed) {

    dailyBtn.textContent =
      "БОНУС ПОЛУЧЕН";

    dailyBtn.disabled = true;

    dailyBtn.style.opacity = ".5";

  }

}

dailyBtn.addEventListener("click", () => {

  if (state.dailyClaimed) {

    toast("Бонус уже получен сегодня");

    return;

  }

  state.dailyClaimed = true;

  localStorage.setItem(
    "golden_daily",
    new Date().toDateString()
  );

  add(250);

  dailyBtn.textContent =
    "БОНУС ПОЛУЧЕН";

  dailyBtn.disabled = true;

  dailyBtn.style.opacity = ".5";

  toast("+250 токенов");

  win(250);

});


/* =========================================================
   VIP
========================================================= */

vipBtn.addEventListener("click", () => {

  vipModal.classList.add("show");

  sound("click");

});

closeVip.addEventListener("click", () => {

  vipModal.classList.remove("show");

  sound("click");

});

vipModal.addEventListener("click", event => {

  if (event.target === vipModal) {
    vipModal.classList.remove("show");
  }

});


/* =========================================================
   MODAL
========================================================= */

closeWin.addEventListener(
  "click",
  closeWinModal
);

winModal.addEventListener("click", event => {

  if (event.target === winModal) {
    closeWinModal();
  }

});


/* =========================================================
   PROFILE
========================================================= */

document
  .getElementById("profileBtn")
  .addEventListener("click", () => {

    toast(
      "Профиль Golden Player"
    );

    sound("click");

  });


/* =========================================================
   SOUND BUTTON
========================================================= */

soundBtn.addEventListener(
  "click",
  toggleSound
);


/* =========================================================
   TELEGRAM USER
========================================================= */

if (tg?.initDataUnsafe?.user) {

  const user =
    tg.initDataUnsafe.user;

  const letter =
    (
      user.first_name ||
      "G"
    ).charAt(0).toUpperCase();

  document.querySelector(
    "#profileBtn span"
  ).textContent = letter;

}


/* =========================================================
   INITIALIZE
========================================================= */

updateBalance();

soundBtn.textContent =
  state.sound
    ? "🔊 ЗВУК"
    : "🔇 ЗВУК";

updateDaily();

renderGame();