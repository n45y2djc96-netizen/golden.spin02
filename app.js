const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();

  try {
    tg.setHeaderColor("#06070a");
    tg.setBackgroundColor("#06070a");
  } catch (_) {}
}


/* =========================
   STATE
========================= */

const saved = JSON.parse(
  localStorage.getItem("golden_spin_state") || "null"
);

const state = saved || {
  balance: 12500,
  xp: 0,
  level: 1,

  spins: 0,
  wins: 0,
  bestWin: 0,

  missionSpins: 0,
  missionWins: 0,
  missionBig: 0,

  streak: 3,

  sound: true,
  daily: null
};


/* =========================
   HELPERS
========================= */

const $ = id => document.getElementById(id);

function format(n) {
  return Math.floor(n).toLocaleString("ru-RU");
}

function save() {
  localStorage.setItem(
    "golden_spin_state",
    JSON.stringify(state)
  );
}

function updateUI() {

  $("balance").textContent = format(state.balance);

  $("level").textContent = state.level;
  $("progressLevel").textContent = state.level;

  $("totalSpins").textContent = format(state.spins);
  $("totalWins").textContent = format(state.wins);
  $("bestWin").textContent = format(state.bestWin);

  $("streak").textContent = state.streak;

  $("missionSpins").textContent =
    `${Math.min(state.missionSpins, 5)} / 5`;

  $("missionWins").textContent =
    `${Math.min(state.missionWins, 1)} / 1`;

  $("missionBig").textContent =
    `${Math.min(state.missionBig, 1)} / 1`;

  const completed =
    (state.missionSpins >= 5 ? 1 : 0) +
    (state.missionWins >= 1 ? 1 : 0) +
    (state.missionBig >= 1 ? 1 : 0);

  $("missionCounter").textContent =
    `${completed}/3`;

  const target = state.level * 500;

  $("xpCurrent").textContent = state.xp;
  $("xpTarget").textContent = target;

  $("xpBar").style.width =
    `${Math.min(100, state.xp / target * 100)}%`;

  $("soundButton").textContent =
    state.sound ? "🔊" : "🔇";
}


function addBalance(amount) {

  state.balance += amount;

  if (state.balance < 0) {
    state.balance = 0;
  }

  updateUI();
  save();
}


function addXP(amount) {

  state.xp += amount;

  while (state.xp >= state.level * 500) {

    state.xp -= state.level * 500;
    state.level++;

    toast(`✨ Новый уровень: ${state.level}`);

    sound("level");
  }

  updateUI();
  save();
}


function gamePlayed() {

  state.spins++;
  state.missionSpins++;

  addXP(20);

  updateUI();
  save();
}


function registerWin(amount) {

  state.wins++;
  state.missionWins++;

  if (amount >= 500) {
    state.missionBig++;
  }

  if (amount > state.bestWin) {
    state.bestWin = amount;
  }

  addXP(amount >= 500 ? 100 : 45);

  updateUI();
  save();
}


/* =========================
   SOUND
========================= */

let audioContext = null;

function getAudio() {

  if (!state.sound) return null;

  try {

    if (!audioContext) {
      audioContext =
        new (window.AudioContext ||
          window.webkitAudioContext)();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    return audioContext;

  } catch (_) {
    return null;
  }
}


function tone(
  frequency,
  duration = .12,
  type = "sine",
  volume = .055
) {

  const ctx = getAudio();

  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = frequency;

  gain.gain.setValueAtTime(
    .0001,
    ctx.currentTime
  );

  gain.gain.exponentialRampToValueAtTime(
    volume,
    ctx.currentTime + .01
  );

  gain.gain.exponentialRampToValueAtTime(
    .0001,
    ctx.currentTime + duration
  );

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + duration);
}


function sound(type) {

  if (!state.sound) return;

  if (type === "click") {
    tone(520, .08);
  }

  if (type === "spin") {
    tone(180, .4, "triangle", .045);

    setTimeout(() => tone(260, .15), 130);
  }

  if (type === "win") {

    tone(520, .12);

    setTimeout(() => tone(660, .12), 100);
    setTimeout(() => tone(880, .18), 210);
  }

  if (type === "bigwin") {

    tone(440, .12);

    setTimeout(() => tone(554, .12), 100);
    setTimeout(() => tone(659, .12), 200);
    setTimeout(() => tone(880, .25), 300);
  }

  if (type === "level") {

    tone(660, .12);
    setTimeout(() => tone(880, .12), 120);
    setTimeout(() => tone(1100, .2), 240);
  }
}


/* =========================
   TOAST
========================= */

let toastTimer;

function toast(message) {

  const el = $("toast");

  el.textContent = message;
  el.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    el.classList.remove("show");
  }, 2200);
}


/* =========================
   MODAL
========================= */

function modal(title, value, text) {

  $("modalTitle").textContent = title;
  $("modalValue").textContent = value;
  $("modalText").textContent = text;

  $("modal").classList.add("open");

  if (
    String(value).includes("1 000") ||
    String(value).includes("2 000") ||
    String(value).includes("5 000")
  ) {
    sound("bigwin");
  } else {
    sound("win");
  }
}

$("modalClose").addEventListener(
  "click",
  () => $("modal").classList.remove("open")
);

$("modal").addEventListener(
  "click",
  e => {
    if (e.target === $("modal")) {
      $("modal").classList.remove("open");
    }
  }
);


/* =========================
   SOUND BUTTON
========================= */

$("soundButton").addEventListener("click", () => {

  state.sound = !state.sound;

  updateUI();
  save();

  if (state.sound) {
    sound("click");
    toast("Звук включён");
  } else {
    toast("Звук выключен");
  }
});


/* =========================
   PROFILE
========================= */

$("profileButton").addEventListener("click", () => {

  sound("click");

  const user = tg?.initDataUnsafe?.user;

  if (user) {

    $("profileButton").textContent =
      (user.first_name || "G")[0].toUpperCase();

    toast(`Привет, ${user.first_name}!`);

  } else {

    toast(`Golden Player • уровень ${state.level}`);
  }
});


/* =========================
   DAILY
========================= */

$("dailyBonus").addEventListener("click", () => {

  const today =
    new Date().toISOString().slice(0,10);

  if (state.daily === today) {

    toast("🎁 Сегодня ты уже забрал награду");

    return;
  }

  state.daily = today;

  addBalance(250);
  addXP(50);

  sound("bigwin");

  modal(
    "DAILY DROP",
    "+250",
    "Ежедневная награда добавлена. Streak продолжается."
  );

  save();
});


/* =========================
   HERO
========================= */

$("heroPlay").addEventListener("click", () => {

  sound("click");

  openGame("slots");

  document
    .getElementById("gameArea")
    .scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
});


/* =========================
   GAME NAV
========================= */

document
  .querySelectorAll(".game-card")
  .forEach(card => {

    card.addEventListener("click", () => {

      document
        .querySelectorAll(".game-card")
        .forEach(x =>
          x.classList.remove("active")
        );

      card.classList.add("active");

      sound("click");

      openGame(card.dataset.game);

      setTimeout(() => {

        $("gameArea").scrollIntoView({
          behavior: "smooth",
          block: "center"
        });

      }, 80);
    });
  });


function openGame(game) {

  const renderers = {
    slots: renderSlots,
    roulette: renderRoulette,
    wheel: renderWheel,
    chests: renderChests,
    smash: renderSmash
  };

  if (renderers[game]) {
    renderers[game]();
  }
}


/* =========================
   SLOTS
========================= */

function renderSlots() {

  $("gameArea").innerHTML = `
    <div class="game-screen">

      <div class="game-header">
        <span class="mini-label">
          ROYAL SLOTS • JACKPOT x25
        </span>

        <h2>ROYAL SLOTS</h2>
      </div>

      <div class="game-stage">

        <div class="slot-machine">

          <div class="reels">

            <div class="reel" id="reel1">7</div>
            <div class="reel" id="reel2">★</div>
            <div class="reel" id="reel3">7</div>

          </div>

          <div class="bet-row">

            <button data-slot-bet="25">25</button>
            <button class="active" data-slot-bet="50">50</button>
            <button data-slot-bet="100">100</button>
            <button data-slot-bet="250">250</button>

          </div>

          <button class="spin-button" id="slotSpin">
            SPIN
          </button>

        </div>

      </div>

    </div>
  `;

  let bet = 50;

  document
    .querySelectorAll("[data-slot-bet]")
    .forEach(button => {

      button.addEventListener("click", () => {

        bet =
          Number(button.dataset.slotBet);

        document
          .querySelectorAll("[data-slot-bet]")
          .forEach(x =>
            x.classList.remove("active")
          );

        button.classList.add("active");

        sound("click");
      });
    });


  $("slotSpin").addEventListener(
    "click",
    () => {

      if (state.balance < bet) {

        toast("Недостаточно токенов");
        return;
      }

      addBalance(-bet);
      gamePlayed();

      sound("spin");

      const reels = [
        $("reel1"),
        $("reel2"),
        $("reel3")
      ];

      reels.forEach(r =>
        r.classList.add("spin")
      );

      const symbols = [
        "7",
        "★",
        "BAR",
        "◆",
        "GOLD"
      ];

      let stopped = 0;

      reels.forEach((reel,index) => {

        setTimeout(() => {

          reel.classList.remove("spin");

          reel.textContent =
            symbols[
              Math.floor(
                Math.random() *
                symbols.length
              )
            ];

          stopped++;

          if (stopped === 3) {

            finishSlots(
              bet,
              reels
            );
          }

        }, 700 + index * 450);

      });
    }
  );
}


function finishSlots(bet,reels) {

  const values =
    reels.map(x => x.textContent);

  let multiplier = 0;

  if (
    values[0] === values[1] &&
    values[1] === values[2]
  ) {

    multiplier =
      values[0] === "7" ? 25 :
      values[0] === "GOLD" ? 15 :
      10;

  } else if (
    values[0] === values[1] ||
    values[1] === values[2]
  ) {

    multiplier = 2;
  }

  if (multiplier > 0) {

    const reward =
      bet * multiplier;

    addBalance(reward);
    registerWin(reward);

    modal(
      multiplier >= 15
        ? "🔥 JACKPOT!"
        : "ВЫИГРЫШ!",
      `+${format(reward)}`,
      `${multiplier}× ставки • отличная комбинация!`
    );

  } else {

    toast("Почти! Попробуй следующую комбинацию.");
  }
}


/* =========================
   ROULETTE
========================= */

function renderRoulette() {

  $("gameArea").innerHTML = `
    <div class="game-screen">

      <div class="game-header">
        <span class="mini-label">
          EURO ROULETTE
        </span>
        <h2>ROULETTE</h2>
      </div>

      <div class="game-stage">

        <div class="roulette-layout">

          <div>

            <div class="wheel-pointer">▼</div>

            <div
              class="big-wheel"
              id="rouletteWheel">
            </div>

          </div>

          <div class="options">

            <button
              class="option red active"
              data-color="red">
              🔴 КРАСНОЕ
            </button>

            <button
              class="option black"
              data-color="black">
              ⚫ ЧЁРНОЕ
            </button>

            <button
              class="option green"
              data-color="green">
              🟢 ZERO
            </button>

            <button
              class="spin-button"
              id="rouletteSpin">
              SPIN
            </button>

          </div>

        </div>

      </div>

    </div>
  `;

  let selected = "red";

  document
    .querySelectorAll("[data-color]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          selected =
            button.dataset.color;

          document
            .querySelectorAll("[data-color]")
            .forEach(x =>
              x.classList.remove("active")
            );

          button.classList.add("active");

          sound("click");
        }
      );
    });


  $("rouletteSpin").addEventListener(
    "click",
    () => {

      const bet = 50;

      if (state.balance < bet) {

        toast("Недостаточно токенов");
        return;
      }

      addBalance(-bet);
      gamePlayed();

      const wheel =
        $("rouletteWheel");

      sound("spin");

      wheel.classList.remove("spinning");

      void wheel.offsetWidth;

      wheel.classList.add("spinning");

      setTimeout(() => {

        const r = Math.random();

        const result =
          r < .47
            ? "red"
            : r < .94
              ? "black"
              : "green";

        if (result === selected) {

          const reward =
            result === "green"
              ? 1750
              : 100;

          addBalance(reward);
          registerWin(reward);

          modal(
            "ROULETTE WIN",
            `+${format(reward)}`,
            result === "green"
              ? "ZERO! Большой множитель."
              : "Твоя ставка сыграла."
          );

        } else {

          toast(
            `Выпало ${result === "red"
              ? "КРАСНОЕ"
              : result === "black"
                ? "ЧЁРНОЕ"
                : "ZERO"}`
          );

        }

      }, 2350);
    }
  );
}


/* =========================
   FORTUNE WHEEL
========================= */

function renderWheel() {

  $("gameArea").innerHTML = `
    <div class="game-screen">

      <div class="game-header">
        <span class="mini-label">
          FORTUNE WHEEL
        </span>

        <h2>FORTUNE</h2>
      </div>

      <div class="game-stage">

        <div class="wheel-pointer">▼</div>

        <div
          class="fortune-wheel"
          id="fortuneWheel">
        </div>

        <button
          class="spin-button"
          id="fortuneSpin">
          SPIN • 50
        </button>

      </div>

    </div>
  `;


  $("fortuneSpin").addEventListener(
    "click",
    () => {

      const bet = 50;

      if (state.balance < bet) {

        toast("Недостаточно токенов");
        return;
      }

      addBalance(-bet);
      gamePlayed();

      const wheel =
        $("fortuneWheel");

      sound("spin");

      wheel.classList.remove("spinning");

      void wheel.offsetWidth;

      wheel.classList.add("spinning");

      setTimeout(() => {

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
              Math.random() *
              rewards.length
            )
          ];

        if (reward > 0) {

          addBalance(reward);
          registerWin(reward);

          modal(
            reward >= 500
              ? "🔥 LUCKY HIT!"
              : "FORTUNE WIN",
            `+${format(reward)}`,
            "Колесо остановилось на твоём призе."
          );

        } else {

          toast(
            "Пустой сектор. Удача любит настойчивых."
          );
        }

      }, 2600);
    }
  );
}


/* =========================
   CHESTS
========================= */

function renderChests() {

  $("gameArea").innerHTML = `
    <div class="game-screen">

      <div class="game-header">
        <span class="mini-label">
          TREASURE ROOM
        </span>

        <h2>GOLDEN CHESTS</h2>
      </div>

      <div class="game-stage">

        <div class="chests">

          <button class="chest" data-chest="1">
            ◆
          </button>

          <button class="chest" data-chest="2">
            ◆
          </button>

          <button class="chest" data-chest="3">
            ◆
          </button>

        </div>

        <p class="game-note">
          Один сундук содержит большой приз.
        </p>

      </div>

    </div>
  `;


  document
    .querySelectorAll(".chest")
    .forEach(chest => {

      chest.addEventListener(
        "click",
        () => {

          const cost = 50;

          if (state.balance < cost) {

            toast("Недостаточно токенов");
            return;
          }

          addBalance(-cost);
          gamePlayed();

          chest.classList.add("opening");

          sound("click");

          setTimeout(() => {

            const rewards = [
              0,
              25,
              75,
              150,
              300,
              750
            ];

            const reward =
              rewards[
                Math.floor(
                  Math.random() *
                  rewards.length
                )
              ];

            if (reward > 0) {

              addBalance(reward);
              registerWin(reward);

              modal(
                reward >= 500
                  ? "💎 RARE TREASURE"
                  : "СУНДУК ОТКРЫТ",
                `+${format(reward)}`,
                "Ты нашёл награду внутри."
              );

            } else {

              toast(
                "Этот сундук оказался пустым."
              );
            }

            chest.classList.remove(
              "opening"
            );

          }, 650);
        }
      );
    });
}


/* =========================
   GOLD SMASH
========================= */

function renderSmash() {

  $("gameArea").innerHTML = `
    <div class="game-screen">

      <div class="game-header">
        <span class="mini-label">
          BREAK THE VAULT
        </span>

        <h2>GOLD SMASH</h2>
      </div>

      <div class="game-stage">

        <button
          class="vault"
          id="vault">
          ?
        </button>

        <p class="game-note">
          Нажми и разбей хранилище.
        </p>

        <small style="
          color:#756f65;
          margin-top:10px;
        ">
          Стоимость удара: 25 ◆
        </small>

      </div>

    </div>
  `;


  $("vault").addEventListener(
    "click",
    () => {

      const cost = 25;

      if (state.balance < cost) {

        toast("Недостаточно токенов");
        return;
      }

      addBalance(-cost);
      gamePlayed();

      const vault =
        $("vault");

      vault.classList.add("hit");

      sound("click");

      setTimeout(() => {

        const rewards = [
          0,
          25,
          50,
          100,
          250,
          500,
          1000
        ];

        const reward =
          rewards[
            Math.floor(
              Math.random() *
              rewards.length
            )
          ];

        vault.classList.remove("hit");

        if (reward > 0) {

          addBalance(reward);
          registerWin(reward);

          modal(
            reward >= 500
              ? "💥 VAULT BREAK!"
              : "SMASH WIN",
            `+${format(reward)}`,
            "Хранилище разбито. Награда твоя."
          );

        } else {

          toast(
            "Пусто. Но следующий удар может изменить всё."
          );
        }

      }, 300);
    }
  );
}


/* =========================
   RESET
========================= */

$("resetButton").addEventListener(
  "click",
  () => {

    const ok =
      confirm(
        "Сбросить весь локальный прогресс?"
      );

    if (!ok) return;

    localStorage.removeItem(
      "golden_spin_state"
    );

    location.reload();
  }
);


/* =========================
   START
========================= */

updateUI();
openGame("slots");