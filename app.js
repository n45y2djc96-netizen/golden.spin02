const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();

  try {
    tg.setHeaderColor("#090604");
    tg.setBackgroundColor("#090604");
  } catch (_) {}
}


/* =========================
   STATE
========================= */

const state = {
  balance: Number(localStorage.getItem("golden_balance")) || 12500,
  sound: localStorage.getItem("golden_sound") !== "off",
  lastBonus: localStorage.getItem("golden_bonus") || null,
  currentGame: "slots",
  busy: false
};


/* =========================
   HELPERS
========================= */

const $ = (selector) => document.querySelector(selector);

const balanceEl = $("#balance");
const gameArea = $("#game");
const toastEl = $("#toast");

function formatNumber(number) {
  return Math.floor(number).toLocaleString("ru-RU");
}

function save() {
  localStorage.setItem("golden_balance", String(state.balance));
}

function updateBalance() {
  if (balanceEl) {
    balanceEl.textContent = formatNumber(state.balance);
  }
}

function changeBalance(amount) {
  state.balance += amount;

  if (state.balance < 0) {
    state.balance = 0;
  }

  save();
  updateBalance();
}

function toast(message) {
  if (!toastEl) return;

  toastEl.textContent = message;
  toastEl.classList.add("show");

  clearTimeout(toast.timer);

  toast.timer = setTimeout(() => {
    toastEl.classList.remove("show");
  }, 2200);
}


/* =========================
   SOUND
========================= */

let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContext) return null;

    audioContext = new AudioContext();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }

  return audioContext;
}

function playTone(frequency, duration = 0.12, type = "sine", volume = 0.07) {
  if (!state.sound) return;

  try {
    const ctx = getAudioContext();

    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);

    gain.gain.exponentialRampToValueAtTime(
      volume,
      ctx.currentTime + 0.015
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      ctx.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  } catch (_) {}
}

function playSound(type) {
  if (!state.sound) return;

  if (type === "click") {
    playTone(520, 0.08);
    return;
  }

  if (type === "spin") {
    playTone(180, 0.35, "triangle", 0.05);
    return;
  }

  if (type === "win") {
    playTone(660, 0.12);
    setTimeout(() => playTone(880, 0.16), 90);
    return;
  }

  if (type === "bigwin") {
    playTone(660, 0.12);
    setTimeout(() => playTone(880, 0.12), 100);
    setTimeout(() => playTone(1100, 0.22), 210);
  }
}


/* =========================
   SOUND BUTTON
========================= */

function updateSoundButton() {
  const button = $("#soundToggle");

  if (!button) return;

  button.textContent =
    state.sound
      ? "🔊 ЗВУК"
      : "🔇 ЗВУК";
}

$("#soundToggle")?.addEventListener("click", () => {
  state.sound = !state.sound;

  localStorage.setItem(
    "golden_sound",
    state.sound ? "on" : "off"
  );

  updateSoundButton();

  if (state.sound) {
    playSound("click");
    toast("Звук включён");
  } else {
    toast("Звук выключен");
  }
});


/* =========================
   PROFILE
========================= */

$("#profileButton")?.addEventListener("click", () => {
  playSound("click");

  const user = tg?.initDataUnsafe?.user;

  const letter =
    user?.first_name?.charAt(0)?.toUpperCase() || "G";

  const profileLetter = $("#profileLetter");

  if (profileLetter) {
    profileLetter.textContent = letter;
  }

  toast(
    user
      ? `Привет, ${user.first_name}!`
      : "Golden Player"
  );
});


/* =========================
   VIP
========================= */

$("#vipButton")?.addEventListener("click", () => {
  playSound("click");

  const modal = $("#vipModal");

  if (modal) {
    modal.classList.add("open");
  }
});

$("#closeVip")?.addEventListener("click", () => {
  $("#vipModal")?.classList.remove("open");
});

$("#vipModal")?.addEventListener("click", (event) => {
  if (event.target.id === "vipModal") {
    event.currentTarget.classList.remove("open");
  }
});


/* =========================
   WIN MODAL
========================= */

function showWin(amount, title = "ВЫИГРЫШ!") {
  const modal = $("#winModal");
  const amountEl = $("#winAmount");

  if (!modal) {
    toast(`+${formatNumber(amount)} токенов`);
    return;
  }

  if (amountEl) {
    amountEl.textContent =
      `+${formatNumber(amount)}`;
  }

  const titleEl = modal.querySelector("h2");

  if (titleEl) {
    titleEl.textContent = title;
  }

  modal.classList.add("open");

  playSound(
    amount >= 1000
      ? "bigwin"
      : "win"
  );
}

function closeWin() {
  $("#winModal")?.classList.remove("open");
}

$("#closeWin")?.addEventListener("click", closeWin);

$("#winModal")?.addEventListener("click", (event) => {
  if (event.target.id === "winModal") {
    closeWin();
  }
});


/* =========================
   DAILY BONUS
========================= */

$("#dailyBonus")?.addEventListener("click", () => {
  const today =
    new Date().toISOString().slice(0, 10);

  if (state.lastBonus === today) {
    toast("Бонус уже получен сегодня");
    return;
  }

  state.lastBonus = today;

  localStorage.setItem(
    "golden_bonus",
    today
  );

  changeBalance(250);

  showWin(250, "ЕЖЕДНЕВНЫЙ БОНУС");
});


/* =========================
   HERO BUTTON
========================= */

$("#heroSpin")?.addEventListener("click", () => {
  playSound("click");

  openGame("slots");

  setTimeout(() => {
    gameArea?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }, 100);
});


/* =========================
   GAME CARDS
========================= */

document
  .querySelectorAll(".game-card")
  .forEach(card => {

    card.addEventListener("click", () => {

      const game = card.dataset.game;

      if (!game) return;

      playSound("click");

      document
        .querySelectorAll(".game-card")
        .forEach(item => {
          item.classList.remove("active");
        });

      card.classList.add("active");

      openGame(game);
    });

  });


/* =========================
   OPEN GAME
========================= */

function openGame(game) {

  if (!gameArea) {
    console.error("Не найден #game");
    return;
  }

  state.currentGame = game;
  state.busy = false;

  switch (game) {

    case "slots":
      renderSlots();
      break;

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

  setTimeout(() => {
    gameArea.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }, 80);
}


/* =========================
   SLOTS
========================= */

function renderSlots() {

  gameArea.innerHTML = `
    <div class="game-screen">

      <span class="mini-label">
        GOLDEN JACKPOT
      </span>

      <h2>🎰 SLOTS</h2>

      <div class="slot-machine">

        <div class="slot-reels">

          <div class="slot-reel">7</div>
          <div class="slot-reel">BAR</div>
          <div class="slot-reel">7</div>

        </div>

        <div class="slot-controls">

          <div class="bet">

            <span>СТАВКА</span>

            <strong id="slotBet">
              50
            </strong>

          </div>

          <div class="bet-buttons">

            <button data-bet="10">10</button>
            <button data-bet="50">50</button>
            <button data-bet="100">100</button>
            <button data-bet="250">250</button>

          </div>

          <button
            class="game-action"
            id="slotSpin"
          >
            SPIN
          </button>

        </div>

      </div>

    </div>
  `;

  let bet = 50;

  const reels =
    gameArea.querySelectorAll(".slot-reel");

  gameArea
    .querySelectorAll("[data-bet]")
    .forEach(button => {

      button.addEventListener("click", () => {

        bet = Number(button.dataset.bet);

        $("#slotBet").textContent = bet;

        playSound("click");

      });

    });


  $("#slotSpin").addEventListener("click", () => {

    if (state.busy) return;

    if (state.balance < bet) {
      toast("Недостаточно токенов");
      return;
    }

    state.busy = true;

    changeBalance(-bet);

    playSound("spin");

    const symbols = [
      "7",
      "BAR",
      "◆",
      "777",
      "GOLD"
    ];

    reels.forEach((reel, index) => {

      reel.classList.add("spinning");

      setTimeout(() => {

        reel.textContent =
          symbols[
            Math.floor(
              Math.random() * symbols.length
            )
          ];

        reel.classList.remove("spinning");

      }, 650 + index * 250);

    });


    setTimeout(() => {

      const roll = Math.random();

      let reward = 0;

      if (roll < 0.05) {
        reward = bet * 20;
      }
      else if (roll < 0.16) {
        reward = bet * 10;
      }
      else if (roll < 0.32) {
        reward = bet * 4;
      }

      if (reward > 0) {

        changeBalance(reward);

        showWin(
          reward,
          reward >= bet * 20
            ? "JACKPOT!"
            : "ВЫИГРЫШ!"
        );

      } else {

        toast("Повезёт в следующий раз");

      }

      state.busy = false;

    }, 1500);

  });
}


/* =========================
   ROULETTE
========================= */

function renderRoulette() {

  gameArea.innerHTML = `
    <div class="game-screen">

      <span class="mini-label">
        EURO ROULETTE
      </span>

      <h2>🎡 РУЛЕТКА</h2>

      <div class="roulette-game">

        <div class="big-roulette">

          <div class="roulette-ball"></div>

          <span>0</span>

        </div>

        <div class="roulette-controls">

          <div class="bet">

            <span>СТАВКА</span>

            <strong>50</strong>

          </div>

          <div class="color-bets">

            <button data-color="red">
              КРАСНОЕ
            </button>

            <button data-color="black">
              ЧЁРНОЕ
            </button>

            <button data-color="green">
              ZERO
            </button>

          </div>

          <button
            class="game-action"
            id="rouletteSpin"
          >
            SPIN ROULETTE
          </button>

        </div>

      </div>

    </div>
  `;

  let selected = "red";

  gameArea
    .querySelectorAll("[data-color]")
    .forEach(button => {

      button.addEventListener("click", () => {

        selected = button.dataset.color;

        gameArea
          .querySelectorAll("[data-color]")
          .forEach(item =>
            item.classList.remove("active")
          );

        button.classList.add("active");

        playSound("click");

      });

    });


  $("#rouletteSpin").addEventListener("click", () => {

    if (state.busy) return;

    const bet = 50;

    if (state.balance < bet) {
      toast("Недостаточно токенов");
      return;
    }

    state.busy = true;

    changeBalance(-bet);

    playSound("spin");

    const wheel =
      gameArea.querySelector(".big-roulette");

    wheel.classList.add("spinning");

    setTimeout(() => {

      wheel.classList.remove("spinning");

      const roll = Math.random();

      let result;

      if (roll < 0.47) {
        result = "red";
      }
      else if (roll < 0.94) {
        result = "black";
      }
      else {
        result = "green";
      }

      if (result === selected) {

        const reward =
          result === "green"
            ? 1750
            : 100;

        changeBalance(reward);

        showWin(
          reward,
          "РУЛЕТКА"
        );

      } else {

        toast(
          `Выпало ${result === "green"
            ? "ZERO"
            : result === "red"
              ? "КРАСНОЕ"
              : "ЧЁРНОЕ"}`
        );

      }

      state.busy = false;

    }, 2200);

  });
}


/* =========================
   FORTUNE WHEEL
========================= */

function renderWheel() {

  gameArea.innerHTML = `
    <div class="game-screen">

      <span class="mini-label">
        FORTUNE WHEEL
      </span>

      <h2>🎡 КОЛЕСО УДАЧИ</h2>

      <div class="fortune-game">

        <div class="fortune-big">

          <div class="pointer">
            ▼
          </div>

          <div class="fortune-center">
            ◆
          </div>

        </div>

        <button
          class="game-action"
          id="fortuneSpin"
        >
          SPIN
        </button>

      </div>

    </div>
  `;


  $("#fortuneSpin").addEventListener("click", () => {

    if (state.busy) return;

    const bet = 50;

    if (state.balance < bet) {
      toast("Недостаточно токенов");
      return;
    }

    state.busy = true;

    changeBalance(-bet);

    const wheel =
      gameArea.querySelector(".fortune-big");

    playSound("spin");

    wheel.classList.add("spinning");

    setTimeout(() => {

      wheel.classList.remove("spinning");

      const rewards = [
        0,
        50,
        100,
        150,
        250,
        500,
        1000
      ];

      const reward =
        rewards[
          Math.floor(
            Math.random() * rewards.length
          )
        ];

      if (reward > 0) {

        changeBalance(reward);

        showWin(
          reward,
          "КОЛЕСО УДАЧИ"
        );

      } else {

        toast("Пустой сектор");

      }

      state.busy = false;

    }, 2500);

  });
}


/* =========================
   CHESTS
========================= */

function renderChests() {

  gameArea.innerHTML = `
    <div class="game-screen">

      <span class="mini-label">
        TREASURE ROOM
      </span>

      <h2>🧰 GOLD CHESTS</h2>

      <div class="chest-game">

        <button
          class="open-chest"
          data-chest="0"
        >
          ◆
        </button>

        <button
          class="open-chest"
          data-chest="1"
        >
          ◆
        </button>

        <button
          class="open-chest"
          data-chest="2"
        >
          ◆
        </button>

      </div>

      <p class="game-note">
        Выбери один сундук
      </p>

    </div>
  `;


  gameArea
    .querySelectorAll(".open-chest")
    .forEach(chest => {

      chest.addEventListener("click", () => {

        if (state.busy) return;

        const cost = 50;

        if (state.balance < cost) {
          toast("Недостаточно токенов");
          return;
        }

        state.busy = true;

        changeBalance(-cost);

        playSound("click");

        chest.classList.add("opening");

        setTimeout(() => {

          const rewards = [
            25,
            75,
            150,
            300,
            750
          ];

          const reward =
            rewards[
              Math.floor(
                Math.random() * rewards.length
              )
            ];

          changeBalance(reward);

          showWin(
            reward,
            "СУНДУК ОТКРЫТ!"
          );

          state.busy = false;

        }, 800);

      });

    });
}


/* =========================
   SMASH
========================= */

function renderSmash() {

  gameArea.innerHTML = `
    <div class="game-screen">

      <span class="mini-label">
        BREAK & WIN
      </span>

      <h2>🔨 GOLD SMASH</h2>

      <div class="smash-game">

        <button
          class="smash-block"
          id="smashBlock"
        >
          ?
        </button>

        <p>
          Разбей блок и узнай награду.
        </p>

      </div>

    </div>
  `;


  $("#smashBlock").addEventListener("click", () => {

    if (state.busy) return;

    const cost = 25;

    if (state.balance < cost) {
      toast("Недостаточно токенов");
      return;
    }

    state.busy = true;

    changeBalance(-cost);

    const block = $("#smashBlock");

    playSound("click");

    block.classList.add("broken");

    setTimeout(() => {

      const rewards = [
        0,
        25,
        50,
        100,
        250,
        500
      ];

      const reward =
        rewards[
          Math.floor(
            Math.random() * rewards.length
          )
        ];

      if (reward > 0) {

        changeBalance(reward);

        showWin(
          reward,
          "БЛОК РАЗБИТ!"
        );

      } else {

        toast("Внутри ничего нет!");

      }

      block.classList.remove("broken");

      state.busy = false;

    }, 600);

  });
}


/* =========================
   TOURNAMENT
========================= */

$("#tournamentButton")?.addEventListener(
  "click",
  () => {

    playSound("click");

    toast(
      "Турнир скоро будет доступен"
    );

  }
);


/* =========================
   START
========================= */

updateBalance();
updateSoundButton();

openGame("slots");