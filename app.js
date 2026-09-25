/* =========================
   GOLDEN SPIN
   ========================= */

const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
}


/* =========================
   STATE
   ========================= */

let balance = Number(localStorage.getItem("golden_balance"));

if (!Number.isFinite(balance)) {
  balance = 12500;
}

let bet = 50;

let soundEnabled =
  localStorage.getItem("golden_sound") !== "off";

let audioContext = null;


/* =========================
   ELEMENTS
   ========================= */

const balanceEl =
  document.getElementById("balance");

const gameArea =
  document.getElementById("gameArea");

const toast =
  document.getElementById("toast");

const resultModal =
  document.getElementById("resultModal");

const resultTitle =
  document.getElementById("resultTitle");

const resultValue =
  document.getElementById("resultValue");

const resultText =
  document.getElementById("resultText");


/* =========================
   HELPERS
   ========================= */

function formatNumber(number) {

  return Math.floor(number)
    .toLocaleString("ru-RU")
    .replace(/\u00A0/g, " ");
}


function updateBalance() {

  balanceEl.textContent =
    formatNumber(balance);

  localStorage.setItem(
    "golden_balance",
    String(balance)
  );
}


function showToast(text) {

  toast.textContent = text;

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}


function showResult(title, amount, text) {

  resultTitle.textContent = title;

  resultValue.textContent =
    amount >= 0
      ? `+${formatNumber(amount)}`
      : formatNumber(amount);

  resultText.textContent = text;

  resultModal.classList.add("show");
}


function closeResult() {
  resultModal.classList.remove("show");
}


/* =========================
   AUDIO
   ========================= */

function initAudio() {

  if (!soundEnabled) return;

  if (!audioContext) {

    audioContext =
      new (
        window.AudioContext ||
        window.webkitAudioContext
      )();

  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}


function tone(
  frequency = 440,
  duration = .1,
  type = "sine",
  volume = .035
) {

  if (!soundEnabled) return;

  initAudio();

  if (!audioContext) return;

  const oscillator =
    audioContext.createOscillator();

  const gain =
    audioContext.createGain();

  oscillator.type = type;

  oscillator.frequency.value =
    frequency;

  gain.gain.setValueAtTime(
    volume,
    audioContext.currentTime
  );

  gain.gain.exponentialRampToValueAtTime(
    .001,
    audioContext.currentTime + duration
  );

  oscillator.connect(gain);

  gain.connect(audioContext.destination);

  oscillator.start();

  oscillator.stop(
    audioContext.currentTime + duration
  );
}


function winSound() {

  tone(523, .1);
  setTimeout(() => tone(659, .1), 90);
  setTimeout(() => tone(784, .18), 180);
}


function loseSound() {

  tone(180, .15, "sawtooth", .025);

  setTimeout(
    () => tone(120, .2, "sawtooth", .02),
    130
  );
}


function clickSound() {
  tone(700, .035, "square", .018);
}


/* =========================
   BET
   ========================= */

function changeBet(amount) {

  bet += amount;

  if (bet < 10) bet = 10;

  if (bet > 1000) bet = 1000;

  renderCurrentGame();

  clickSound();
}


/* =========================
   SLOTS
   ========================= */

const slotSymbols = [
  "7",
  "BAR",
  "🍒",
  "💎",
  "⭐",
  "🍋"
];


function randomSlot() {

  return slotSymbols[
    Math.floor(
      Math.random() *
      slotSymbols.length
    )
  ];
}


function playSlots() {

  if (balance < bet) {

    showToast("Недостаточно токенов");

    loseSound();

    return;
  }

  initAudio();

  balance -= bet;

  updateBalance();

  const reels =
    document.querySelectorAll(".reel");

  const button =
    document.getElementById("slotSpin");

  button.disabled = true;

  reels.forEach(reel => {
    reel.classList.add("spinning");
  });

  let ticks = 0;

  const interval =
    setInterval(() => {

      reels.forEach(reel => {

        reel.textContent =
          randomSlot();

      });

      tone(
        150 + ticks * 10,
        .025,
        "square",
        .012
      );

      ticks++;

    }, 90);


  setTimeout(() => {

    clearInterval(interval);

    const result = [
      randomSlot(),
      randomSlot(),
      randomSlot()
    ];

    reels.forEach((reel, index) => {

      reel.classList.remove("spinning");

      reel.textContent =
        result[index];

    });

    let win = 0;

    if (
      result[0] === result[1] &&
      result[1] === result[2]
    ) {

      win = bet * 12;

    } else if (
      result[0] === result[1] ||
      result[1] === result[2] ||
      result[0] === result[2]
    ) {

      win = bet * 2;

    }


    if (win > 0) {

      balance += win;

      updateBalance();

      winSound();

      showResult(
        "ВЫИГРЫШ!",
        win,
        "Комбинация принесла награду."
      );

    } else {

      loseSound();

      showResult(
        "ПОПРОБУЙ ЕЩЁ",
        0,
        "В этот раз комбинация не совпала."
      );

    }

    button.disabled = false;

  }, 1500);
}


/* =========================
   ROULETTE
   ========================= */

function playRoulette() {

  if (balance < bet) {

    showToast("Недостаточно токенов");

    return;
  }

  initAudio();

  balance -= bet;

  updateBalance();

  const wheel =
    document.getElementById("rouletteWheel");

  const button =
    document.getElementById("rouletteSpin");

  button.disabled = true;

  const rotation =
    1800 +
    Math.floor(Math.random() * 1800);

  wheel.style.transform =
    `rotate(${rotation}deg)`;


  let ticks = 0;

  const timer =
    setInterval(() => {

      tone(
        300 + ticks * 15,
        .025,
        "square",
        .015
      );

      ticks++;

      if (ticks > 20) {
        clearInterval(timer);
      }

    }, 120);


  setTimeout(() => {

    const win =
      Math.random() < .33;

    if (win) {

      const prize =
        bet * (2 + Math.floor(Math.random() * 4));

      balance += prize;

      updateBalance();

      winSound();

      showResult(
        "РУЛЕТКА!",
        prize,
        "Колесо остановилось на выигрышном секторе."
      );

    } else {

      loseSound();

      showResult(
        "РУЛЕТКА",
        0,
        "Сегодня удача прошла рядом."
      );

    }

    button.disabled = false;

  }, 3900);
}


/* =========================
   FORTUNE WHEEL
   ========================= */

function playFortune() {

  if (balance < bet) {

    showToast("Недостаточно токенов");

    return;
  }

  initAudio();

  balance -= bet;

  updateBalance();

  const wheel =
    document.getElementById("fortuneWheel");

  const button =
    document.getElementById("fortuneSpin");

  button.disabled = true;

  const rotation =
    1440 +
    Math.floor(Math.random() * 1440);

  wheel.style.transform =
    `rotate(${rotation}deg)`;


  setTimeout(() => {

    const multipliers = [
      0,
      1,
      2,
      3,
      5,
      0,
      2,
      10
    ];

    const multiplier =
      multipliers[
        Math.floor(
          Math.random() *
          multipliers.length
        )
      ];

    const prize =
      bet * multiplier;

    if (prize > 0) {

      balance += prize;

      updateBalance();

      winSound();

      showResult(
        "КОЛЕСО ФОРТУНЫ",
        prize,
        `Множитель x${multiplier}!`
      );

    } else {

      loseSound();

      showResult(
        "КОЛЕСО ФОРТУНЫ",
        0,
        "Сектор без выигрыша."
      );

    }

    button.disabled = false;

  }, 4100);
}


/* =========================
   CHESTS
   ========================= */

function openChest(index) {

  const chests =
    document.querySelectorAll(".chest");

  if (chests[index].classList.contains("opened")) {
    return;
  }

  chests.forEach(chest => {
    chest.disabled = true;
  });

  chests[index].classList.add("opened");

  const rewards = [
    bet,
    bet * 3,
    bet * 6,
    bet * 10
  ];

  const prize =
    rewards[
      Math.floor(
        Math.random() *
        rewards.length
      )
    ];


  setTimeout(() => {

    balance += prize;

    updateBalance();

    winSound();

    showResult(
      "СУНДУК ОТКРЫТ!",
      prize,
      "Внутри оказалась награда."
    );

  }, 500);
}


/* =========================
   SMASH
   ========================= */

function smashBlock(block) {

  if (
    block.classList.contains("broken")
  ) {
    return;
  }

  block.classList.add("broken");

  clickSound();

  const reward =
    Math.floor(
      20 + Math.random() * 130
    );

  balance += reward;

  updateBalance();

  block.textContent = "💰";

  setTimeout(() => {

    block.textContent = "?";

    block.classList.remove("broken");

  }, 900);

  showToast(
    `+${formatNumber(reward)} токенов`
  );
}


/* =========================
   RENDER SLOTS
   ========================= */

function renderSlots() {

  gameArea.innerHTML = `

    <section class="game-panel">

      <h2 class="game-heading">
        🎰 СЛОТЫ
      </h2>

      <div class="slot-machine">

        <div class="slot-top">
          <span>GOLDEN JACKPOT</span>
          <span>ЕЩЁ 3 ИГРЫ ДО БОНУСА</span>
        </div>

        <div class="reels">

          <div class="reel">7</div>
          <div class="reel">BAR</div>
          <div class="reel">7</div>

        </div>

        <div class="game-controls">

          <div class="bet-control">

            <button onclick="changeBet(-10)">
              −
            </button>

            <span>
              СТАВКА:
              <b>${formatNumber(bet)}</b>
            </span>

            <button onclick="changeBet(10)">
              +
            </button>

          </div>

          <button
            class="gold-big-btn"
            id="slotSpin"
            onclick="playSlots()"
          >
            КРУТИТЬ / SPIN
          </button>

        </div>

      </div>

    </section>
  `;
}


/* =========================
   RENDER ROULETTE
   ========================= */

function renderRoulette() {

  gameArea.innerHTML = `

    <section class="game-panel">

      <h2 class="game-heading">
        🎡 РУЛЕТКА
      </h2>

      <div class="roulette-layout">

        <div class="roulette-wheel" id="rouletteWheel">
          <div class="pointer"></div>
        </div>

        <div class="game-controls">

          <div class="bet-control">

            <button onclick="changeBet(-10)">−</button>

            <span>
              СТАВКА:
              <b>${formatNumber(bet)}</b>
            </span>

            <button onclick="changeBet(10)">+</button>

          </div>

          <button
            class="gold-big-btn"
            id="rouletteSpin"
            onclick="playRoulette()"
          >
            КРУТИТЬ
          </button>

        </div>

      </div>

    </section>
  `;
}


/* =========================
   RENDER WHEEL
   ========================= */

function renderWheel() {

  gameArea.innerHTML = `

    <section class="game-panel">

      <h2 class="game-heading">
        ⭐ КОЛЕСО ФОРТУНЫ
      </h2>

      <div class="fortune-layout">

        <div class="wheel-pointer">
          ▼
        </div>

        <div
          class="fortune-wheel"
          id="fortuneWheel"
        ></div>

        <div class="game-controls">

          <div class="bet-control">

            <button onclick="changeBet(-10)">−</button>

            <span>
              СТАВКА:
              <b>${formatNumber(bet)}</b>
            </span>

            <button onclick="changeBet(10)">+</button>

          </div>

          <button
            class="gold-big-btn"
            id="fortuneSpin"
            onclick="playFortune()"
          >
            КРУТИТЬ
          </button>

        </div>

      </div>

    </section>
  `;
}


/* =========================
   RENDER CHESTS
   ========================= */

function renderChests() {

  gameArea.innerHTML = `

    <section class="game-panel">

      <h2 class="game-heading">
        🧰 СУНДУКИ
      </h2>

      <p style="
        text-align:center;
        color:#caa76b;
      ">
        Выбери один сундук и узнай награду
      </p>

      <div class="chests">

        <button
          class="chest"
          onclick="openChest(0)"
        >
          🧰
        </button>

        <button
          class="chest"
          onclick="openChest(1)"
        >
          🧰
        </button>

        <button
          class="chest"
          onclick="openChest(2)"
        >
          🧰
        </button>

      </div>

    </section>
  `;
}


/* =========================
   RENDER SMASH
   ========================= */

function renderSmash() {

  gameArea.innerHTML = `

    <section class="game-panel smash-game">

      <h2 class="game-heading">
        🔨 РАЗБЕЙ БЛОК
      </h2>

      <p style="
        color:#caa76b;
      ">
        Разбивай блоки и получай виртуальные токены
      </p>

      <div class="blocks">

        ${Array.from(
          { length: 9 },
          (_, i) => `
            <button
              class="block"
              onclick="smashBlock(this)"
            >
              ?
            </button>
          `
        ).join("")}

      </div>

    </section>
  `;
}


/* =========================
   CURRENT GAME
   ========================= */

let currentGame = "slots";


function renderCurrentGame() {

  switch (currentGame) {

    case "roulette":
      renderRoulette();
      break;

    case "wheel":
      renderWheel();
      break;

    case "chests":
      renderChests();
      break;

    case "smash":
      renderSmash();
      break;

    default:
      renderSlots();

  }

}


/* =========================
   NAVIGATION
   ========================= */

document
  .querySelectorAll(".game-nav-card")
  .forEach(card => {

    card.addEventListener("click", () => {

      currentGame =
        card.dataset.game;

      document
        .querySelectorAll(".game-nav-card")
        .forEach(item => {
          item.classList.remove("active");
        });

      card.classList.add("active");

      clickSound();

      renderCurrentGame();

      setTimeout(() => {

        gameArea.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

      }, 50);

    });

  });


/* =========================
   HERO SPIN
   ========================= */

document
  .getElementById("mainSpin")
  .addEventListener("click", () => {

    clickSound();

    currentGame = "slots";

    document
      .querySelectorAll(".game-nav-card")
      .forEach(card => {

        card.classList.toggle(
          "active",
          card.dataset.game === "slots"
        );

      });

    renderSlots();

    setTimeout(() => {

      gameArea.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    }, 50);

  });


/* =========================
   BONUS
   ========================= */

document
  .getElementById("bonusBtn")
  .addEventListener("click", () => {

    const today =
      new Date().toISOString().slice(0, 10);

    const claimed =
      localStorage.getItem(
        "golden_bonus_date"
      );

    if (claimed === today) {

      showToast(
        "Бонус уже получен сегодня"
      );

      return;
    }

    localStorage.setItem(
      "golden_bonus_date",
      today
    );

    balance += 250;

    updateBalance();

    winSound();

    showResult(
      "ЕЖЕДНЕВНЫЙ БОНУС",
      250,
      "Возвращайся завтра за новым бонусом!"
    );

  });


/* =========================
   VIP
   ========================= */

document
  .getElementById("vipBtn")
  .addEventListener("click", () => {

    showResult(
      "GOLDEN VIP",
      0,
      "VIP-раздел будет доступен в следующей версии."
    );

  });


/* =========================
   TOURNAMENT
   ========================= */

document
  .getElementById("tournamentBtn")
  .addEventListener("click", () => {

    showToast(
      "Ты добавлен в турнир!"
    );

    clickSound();

  });


/* =========================
   MODAL
   ========================= */

document
  .getElementById("closeModal")
  .addEventListener(
    "click",
    closeResult
  );


resultModal.addEventListener(
  "click",
  event => {

    if (
      event.target === resultModal
    ) {
      closeResult();
    }

  }
);


/* =========================
   SOUND BUTTON
   ========================= */

const soundBtn =
  document.getElementById("soundBtn");


function updateSoundButton() {

  soundBtn.textContent =
    soundEnabled
      ? "🔊"
      : "🔇";

}


soundBtn.addEventListener(
  "click",
  () => {

    soundEnabled =
      !soundEnabled;

    localStorage.setItem(
      "golden_sound",
      soundEnabled ? "on" : "off"
    );

    updateSoundButton();

    if (soundEnabled) {
      initAudio();
      tone(700, .08);
    }

  }
);


/* =========================
   MOBILE SWIPE NAV
   ========================= */

const nav =
  document.querySelector(".game-nav");

let startX = 0;


nav.addEventListener(
  "touchstart",
  event => {

    startX =
      event.touches[0].clientX;

  },
  { passive: true }
);


nav.addEventListener(
  "touchend",
  event => {

    const endX =
      event.changedTouches[0].clientX;

    const distance =
      startX - endX;

    if (Math.abs(distance) < 50) {
      return;
    }

    if (distance > 0) {

      nav.scrollBy({
        left: 220,
        behavior: "smooth"
      });

    } else {

      nav.scrollBy({
        left: -220,
        behavior: "smooth"
      });

    }

  },
  { passive: true }
);


/* =========================
   INIT
   ========================= */

updateBalance();

updateSoundButton();

renderSlots();