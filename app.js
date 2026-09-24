const tg = window.Telegram?.WebApp;

tg?.ready();
tg?.expand?.();

try {
  tg?.setHeaderColor?.("#080503");
  tg?.setBackgroundColor?.("#080503");
} catch (e) {}


/* =========================
   STORAGE
========================= */

const BALANCE_KEY = "golden_spin_balance_final";
const BONUS_KEY = "golden_spin_bonus_final";
const SOUND_KEY = "golden_spin_sound_final";

let balance = Number(localStorage.getItem(BALANCE_KEY));

if (!Number.isFinite(balance) || balance < 0) {
  balance = 12500;
}

let soundEnabled =
  localStorage.getItem(SOUND_KEY) !== "off";

let currentGame = "slots";
let busy = false;
let selectedBet = 100;


/* =========================
   DOM
========================= */

const $ = (selector) =>
  document.querySelector(selector);

const $$ = (selector) =>
  [...document.querySelectorAll(selector)];

const balanceEl = $("#balance");
const gameEl = $("#game");
const toastEl = $("#toast");

const winModal = $("#winModal");
const vipModal = $("#vipModal");


/* =========================
   BALANCE
========================= */

function formatNumber(value) {
  return Number(value).toLocaleString("ru-RU");
}

function renderBalance() {
  if (balanceEl) {
    balanceEl.textContent =
      formatNumber(balance);
  }
}

function saveBalance() {
  localStorage.setItem(
    BALANCE_KEY,
    String(balance)
  );

  renderBalance();
}

function addBalance(amount) {
  balance += amount;
  saveBalance();
}

function removeBalance(amount) {

  if (balance < amount) {
    toast("Недостаточно токенов");
    sound("bad");
    return false;
  }

  balance -= amount;
  saveBalance();

  return true;
}


/* =========================
   TOAST
========================= */

let toastTimer;

function toast(message) {

  if (!toastEl) return;

  toastEl.textContent = message;

  toastEl.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toastEl.classList.remove("show");
  }, 2200);
}


/* =========================
   AUDIO
========================= */

let audioCtx = null;

function getAudio() {

  if (!soundEnabled) return null;

  if (!audioCtx) {

    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContext) return null;

    audioCtx = new AudioContext();
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  return audioCtx;
}

function beep(
  frequency,
  duration = .08,
  type = "sine",
  volume = .045
) {

  const ctx = getAudio();

  if (!ctx) return;

  const oscillator =
    ctx.createOscillator();

  const gain =
    ctx.createGain();

  oscillator.type = type;

  oscillator.frequency.setValueAtTime(
    frequency,
    ctx.currentTime
  );

  gain.gain.setValueAtTime(
    volume,
    ctx.currentTime
  );

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

function sound(type) {

  if (!soundEnabled) return;

  if (type === "click") {
    beep(620,.055,"sine",.035);
    return;
  }

  if (type === "spin") {

    beep(170,.07,"square",.025);

    setTimeout(
      () => beep(220,.07,"square",.025),
      90
    );

    setTimeout(
      () => beep(290,.07,"square",.025),
      180
    );

    return;
  }

  if (type === "win") {

    beep(523,.12);
    setTimeout(
      () => beep(659,.12),
      110
    );

    setTimeout(
      () => beep(784,.18),
      220
    );

    return;
  }

  if (type === "big") {

    beep(392,.12);
    setTimeout(
      () => beep(523,.12),
      120
    );

    setTimeout(
      () => beep(659,.12),
      240
    );

    setTimeout(
      () => beep(1046,.3),
      380
    );

    return;
  }

  if (type === "bad") {

    beep(190,.16,"sawtooth",.035);

    setTimeout(
      () => beep(125,.2,"sawtooth",.025),
      130
    );

    return;
  }

  if (type === "chest") {

    beep(300,.08);
    setTimeout(
      () => beep(450,.1),
      90
    );

    setTimeout(
      () => beep(700,.18),
      200
    );
  }
}


/* =========================
   WIN MODAL
========================= */

function showWin(amount) {

  $("#winAmount").textContent =
    "+" + formatNumber(amount);

  winModal?.classList.add("show");

  if (amount >= 500) {
    sound("big");
  } else {
    sound("win");
  }
}

function closeWin() {
  winModal?.classList.remove("show");
}

$("#closeWin")?.addEventListener(
  "click",
  closeWin
);

winModal?.addEventListener(
  "click",
  (event) => {

    if (event.target === winModal) {
      closeWin();
    }

  }
);


/* =========================
   VIP
========================= */

$("#vipButton")?.addEventListener(
  "click",
  () => {

    sound("click");

    vipModal?.classList.add("show");

  }
);

$("#closeVip")?.addEventListener(
  "click",
  () => {
    vipModal?.classList.remove("show");
  }
);

vipModal?.addEventListener(
  "click",
  event => {

    if (event.target === vipModal) {
      vipModal.classList.remove("show");
    }

  }
);


/* =========================
   PROFILE
========================= */

function setupProfile() {

  const letter =
    $("#profileLetter");

  const user =
    tg?.initDataUnsafe?.user;

  const name =
    user?.first_name ||
    "G";

  if (letter) {
    letter.textContent =
      name
        .trim()
        .charAt(0)
        .toUpperCase() || "G";
  }
}

$("#profileButton")?.addEventListener(
  "click",
  () => {

    sound("click");

    const name =
      tg?.initDataUnsafe?.user?.first_name ||
      "Игрок";

    toast(
      `Добро пожаловать, ${name}!`
    );

  }
);


/* =========================
   GAME NAVIGATION
========================= */

$$(".game-card").forEach(card => {

  card.addEventListener(
    "click",
    () => {

      const game =
        card.dataset.game;

      if (!game) return;

      sound("click");

      selectGame(game);

      setTimeout(() => {

        gameEl?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

      }, 80);

    }
  );

});


function selectGame(game) {

  currentGame = game;

  $$(".game-card").forEach(card => {

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


/* =========================
   SLOTS
========================= */

const slotSymbols = [
  "7",
  "BAR",
  "◆",
  "♦",
  "★",
  "G"
];

function randomSlot() {

  return slotSymbols[
    Math.floor(
      Math.random() *
      slotSymbols.length
    )
  ];
}

function renderSlots() {

  gameEl.innerHTML = `

    <section class="game-panel">

      <div class="game-heading">

        <div>
          <span class="eyebrow">
            GOLDEN JACKPOT
          </span>

          <h2>Золотые слоты</h2>

          <p>
            Крути барабаны и собирай комбинации
          </p>
        </div>

        <div class="game-badge">
          ×500
        </div>

      </div>


      <div class="slots-machine">

        <div class="slot-top">
          <span>◆ GOLDEN SPIN</span>
          <span>● LIVE</span>
        </div>

        <div class="reels">

          <div class="reel">
            <div class="reel-symbol">7</div>
          </div>

          <div class="reel">
            <div class="reel-symbol">BAR</div>
          </div>

          <div class="reel">
            <div class="reel-symbol">♦</div>
          </div>

        </div>

        <div class="slot-line"></div>

        <div class="slot-jackpot">

          <span>
            JACKPOT
          </span>

          <strong>
            2 500 000
          </strong>

        </div>

      </div>


      <div class="bet-row">

        ${[50,100,250,500].map(
          bet => `

            <button
              class="bet ${bet === selectedBet ? "active" : ""}"
              data-bet="${bet}"
            >
              ${bet}
            </button>

          `
        ).join("")}

      </div>


      <button
        class="spin-game-btn"
        id="slotsSpin"
      >

        <span>
          КРУТИТЬ / SPIN
        </span>

        <small>
          −${selectedBet} токенов
        </small>

      </button>


      <div class="payouts">

        <div>
          <span>7 7 7</span>
          <b>×500</b>
        </div>

        <div>
          <span>BAR BAR BAR</span>
          <b>×100</b>
        </div>

        <div>
          <span>◆ ◆ ◆</span>
          <b>×25</b>
        </div>

        <div>
          <span>2 одинаковых</span>
          <b>×2</b>
        </div>

      </div>

    </section>

  `;


  $$(".bet").forEach(button => {

    button.addEventListener(
      "click",
      () => {

        selectedBet =
          Number(button.dataset.bet);

        sound("click");

        renderSlots();

      }
    );

  });


  $("#slotsSpin")?.addEventListener(
    "click",
    spinSlots
  );
}


function spinSlots() {

  if (busy) return;

  if (!removeBalance(selectedBet)) {
    return;
  }

  busy = true;

  sound("spin");

  const reels =
    $$(".reel");

  reels.forEach(
    (reel,index) => {

      reel.classList.add("spinning");

      const symbol =
        reel.querySelector(
          ".reel-symbol"
        );

      let count = 0;

      const timer =
        setInterval(
          () => {

            symbol.textContent =
              randomSlot();

            count++;

            if (
              count >=
              16 + index * 5
            ) {

              clearInterval(timer);

            }

          },
          65
        );

    }
  );


  setTimeout(() => {

    let result = [
      randomSlot(),
      randomSlot(),
      randomSlot()
    ];


    const roll =
      Math.random();


    if (roll < .012) {

      result = ["7","7","7"];

    } else if (roll < .045) {

      result = ["BAR","BAR","BAR"];

    } else if (roll < .09) {

      result = ["◆","◆","◆"];

    } else if (roll < .22) {

      const symbol =
        randomSlot();

      result[0] = symbol;
      result[1] = symbol;

    }


    reels.forEach(
      (reel,index) => {

        reel.classList.remove(
          "spinning"
        );

        const symbol =
          reel.querySelector(
            ".reel-symbol"
          );

        symbol.textContent =
          result[index];

      }
    );


    let multiplier = 0;


    if (
      result.every(
        x => x === "7"
      )
    ) {
      multiplier = 500;

    } else if (
      result.every(
        x => x === "BAR"
      )
    ) {
      multiplier = 100;

    } else if (
      result.every(
        x => x === "◆"
      )
    ) {
      multiplier = 25;

    } else if (
      result[0] === result[1] ||
      result[1] === result[2] ||
      result[0] === result[2]
    ) {
      multiplier = 2;
    }


    const win =
      selectedBet *
      multiplier;


    busy = false;


    if (win > 0) {

      addBalance(win);

      showWin(win);

    } else {

      toast(
        "Комбинации нет — попробуй ещё"
      );

      sound("bad");

    }

  }, 1800);
}


/* =========================
   ROULETTE
========================= */

function renderRoulette() {

  gameEl.innerHTML = `

    <section class="game-panel">

      <div class="game-heading">

        <div>
          <span class="eyebrow">
            EURO ROULETTE
          </span>

          <h2>Золотая рулетка</h2>

          <p>
            Выбери цвет и крути колесо
          </p>
        </div>

        <div class="game-badge">
          ×2
        </div>

      </div>


      <div class="roulette-stage">

        <div class="roulette-pointer"></div>

        <div
          class="roulette-wheel"
          id="rouletteWheel"
        >

          <div class="roulette-center">
            GS
          </div>

        </div>

      </div>


      <div class="game-info-row">
        <span>СТАВКА</span>
        <strong>100</strong>
      </div>


      <button
        class="game-action"
        id="rouletteSpin"
      >
        КРУТИТЬ РУЛЕТКУ
      </button>

      <div class="mini-note">
        Красное или чёрное — выплата ×2
      </div>

    </section>

  `;


  $("#rouletteSpin")?.addEventListener(
    "click",
    spinRoulette
  );
}


function spinRoulette() {

  if (busy) return;

  const bet = 100;

  if (!removeBalance(bet)) {
    return;
  }

  busy = true;

  sound("spin");

  const wheel =
    $("#rouletteWheel");

  const rotations =
    5 + Math.floor(
      Math.random() * 3
    );

  const degrees =
    rotations * 360 +
    Math.floor(
      Math.random() * 360
    );

  wheel.style.transform =
    `rotate(${degrees}deg)`;


  setTimeout(() => {

    busy = false;

    const win =
      Math.random() < .47;


    if (win) {

      addBalance(200);

      showWin(200);

    } else {

      toast(
        "Рулетка остановилась на проигрыше"
      );

      sound("bad");

    }

  }, 3300);
}


/* =========================
   WHEEL
========================= */

function renderWheel() {

  gameEl.innerHTML = `

    <section class="game-panel">

      <div class="game-heading">

        <div>
          <span class="eyebrow">
            LUCKY WHEEL
          </span>

          <h2>Колесо Фортуны</h2>

          <p>
            Крути колесо и забирай приз
          </p>
        </div>

        <div class="game-badge">
          ×5
        </div>

      </div>


      <div class="wheel-stage">

        <div class="wheel-pointer"></div>

        <div
          class="prize-wheel"
          id="prizeWheel"
        >

          <div class="wheel-center">
            SPIN
          </div>

        </div>

      </div>


      <div class="game-info-row">
        <span>СТОИМОСТЬ</span>
        <strong>100</strong>
      </div>


      <button
        class="game-action"
        id="wheelSpin"
      >
        КРУТИТЬ КОЛЕСО
      </button>

    </section>

  `;


  $("#wheelSpin")?.addEventListener(
    "click",
    spinWheel
  );
}


function spinWheel() {

  if (busy) return;

  if (!removeBalance(100)) {
    return;
  }

  busy = true;

  sound("spin");

  const wheel =
    $("#prizeWheel");

  const degrees =
    6 * 360 +
    Math.floor(
      Math.random() * 360
    );

  wheel.style.transform =
    `rotate(${degrees}deg)`;


  setTimeout(() => {

    busy = false;

    const prizes = [
      0,
      50,
      100,
      150,
      250,
      500
    ];

    const prize =
      prizes[
        Math.floor(
          Math.random() *
          prizes.length
        )
      ];


    if (prize > 0) {

      addBalance(prize);

      showWin(prize);

    } else {

      toast(
        "Колесо остановилось на 0"
      );

      sound("bad");

    }

  }, 3600);
}


/* =========================
   CHESTS
========================= */

function renderChests() {

  gameEl.innerHTML = `

    <section class="game-panel">

      <div class="game-heading">

        <div>
          <span class="eyebrow">
            TREASURE ROOM
          </span>

          <h2>Золотые сундуки</h2>

          <p>
            Выбери один из трёх сундуков
          </p>
        </div>

        <div class="game-badge">
          LUCK
        </div>

      </div>


      <div class="chests-grid">

        <button
          class="chest"
          data-chest="1"
        >
          <span class="chest-lock">◆</span>
          <strong>СУНДУК 01</strong>
          <small>100 токенов</small>
        </button>


        <button
          class="chest"
          data-chest="2"
        >
          <span class="chest-lock">◆</span>
          <strong>СУНДУК 02</strong>
          <small>100 токенов</small>
        </button>


        <button
          class="chest"
          data-chest="3"
        >
          <span class="chest-lock">◆</span>
          <strong>СУНДУК 03</strong>
          <small>100 токенов</small>
        </button>

      </div>


      <div class="game-info-row">

        <span>
          ОТКРЫТИЕ
        </span>

        <strong>
          100
        </strong>

      </div>

    </section>

  `;


  $$(".chest").forEach(
    chest => {

      chest.addEventListener(
        "click",
        () => openChest(chest)
      );

    }
  );
}


function openChest(chest) {

  if (busy) return;

  if (!removeBalance(100)) {
    return;
  }

  busy = true;

  chest.classList.add(
    "opened"
  );

  sound("chest");


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
      prizes[
        Math.floor(
          Math.random() *
          prizes.length
        )
      ];


    busy = false;


    if (prize > 0) {

      addBalance(prize);

      showWin(prize);

    } else {

      toast(
        "Сундук оказался пустым"
      );

      sound("bad");

    }

  }, 1100);
}


/* =========================
   SMASH
========================= */

function renderSmash() {

  gameEl.innerHTML = `

    <section class="game-panel">

      <div class="game-heading">

        <div>
          <span class="eyebrow">
            SMASH GAME
          </span>

          <h2>Разбей блок</h2>

          <p>
            Один удар — один шанс
          </p>
        </div>

        <div class="game-badge">
          ×250
        </div>

      </div>


      <div class="smash-stage">

        <button
          class="smash-block"
          id="smashBlock"
        >
          ?
        </button>

        <div class="smash-hammer">
          🔨
        </div>

      </div>


      <div class="game-info-row">

        <span>
          СТОИМОСТЬ УДАРА
        </span>

        <strong>
          50
        </strong>

      </div>


      <button
        class="game-action"
        id="smashButton"
      >
        РАЗБИТЬ
      </button>

    </section>

  `;


  $("#smashButton")?.addEventListener(
    "click",
    smash
  );

  $("#smashBlock")?.addEventListener(
    "click",
    smash
  );
}


function smash() {

  if (busy) return;

  if (!removeBalance(50)) {
    return;
  }

  busy = true;

  const block =
    $("#smashBlock");

  block?.classList.add(
    "smashing"
  );

  sound("click");


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
      prizes[
        Math.floor(
          Math.random() *
          prizes.length
        )
      ];


    block?.classList.remove(
      "smashing"
    );

    block?.classList.add(
      "broken"
    );


    busy = false;


    if (prize > 0) {

      addBalance(prize);

      showWin(prize);

    } else {

      toast(
        "Внутри ничего ценного"
      );

      sound("bad");

    }


    setTimeout(
      () => renderSmash(),
      850
    );

  }, 750);
}


/* =========================
   DAILY BONUS
========================= */

function setupBonus() {

  const button =
    $("#dailyBonus");

  if (!button) return;


  const today =
    new Date()
      .toISOString()
      .slice(0,10);


  if (
    localStorage.getItem(
      BONUS_KEY
    ) === today
  ) {

    button.textContent =
      "✓ БОНУС ПОЛУЧЕН";

    button.disabled = true;

    return;
  }


  button.addEventListener(
    "click",
    () => {

      const day =
        new Date()
          .toISOString()
          .slice(0,10);


      if (
        localStorage.getItem(
          BONUS_KEY
        ) === day
      ) {

        toast(
          "Бонус уже получен"
        );

        return;
      }


      localStorage.setItem(
        BONUS_KEY,
        day
      );


      addBalance(250);

      button.textContent =
        "✓ БОНУС ПОЛУЧЕН";

      button.disabled = true;

      showWin(250);

    }
  );
}


/* =========================
   SOUND BUTTON
========================= */

function setupSound() {

  const button =
    $("#soundToggle");

  if (!button) return;


  function update() {

    button.textContent =
      soundEnabled
        ? "🔊 ЗВУК"
        : "🔇 ЗВУК";

  }

  update();


  button.addEventListener(
    "click",
    () => {

      soundEnabled =
        !soundEnabled;

      localStorage.setItem(
        SOUND_KEY,
        soundEnabled
          ? "on"
          : "off"
      );

      update();


      if (soundEnabled) {

        sound("click");

        toast(
          "Звук включён"
        );

      } else {

        toast(
          "Звук выключен"
        );

      }

    }
  );
}


/* =========================
   HERO SPIN
========================= */

$("#heroSpin")?.addEventListener(
  "click",
  () => {

    sound("click");

    selectGame("slots");

    setTimeout(() => {

      gameEl?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

      setTimeout(() => {

        $("#slotsSpin")?.click();

      }, 500);

    }, 80);

  }
);


/* =========================
   TOURNAMENT
========================= */

$("#tournamentButton")?.addEventListener(
  "click",
  () => {

    sound("click");

    toast(
      "Турнир скоро будет доступен"
    );

  }
);


/* =========================
   INIT
========================= */

renderBalance();

setupProfile();

setupBonus();

setupSound();

selectGame("slots");


/*
  ВАЖНО:
  Первый звук на iPhone/Safari
  разрешается только после
  действия пользователя.
*/

document.addEventListener(
  "pointerdown",
  () => {

    if (soundEnabled) {
      getAudio();
    }

  },
  {
    once: true,
    passive: true
  }
);