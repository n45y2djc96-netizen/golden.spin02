const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();

  try {
    tg.setHeaderColor("#060403");
    tg.setBackgroundColor("#060403");
  } catch (e) {}
}


const state = {
  balance: Number(localStorage.getItem("golden_balance")) || 12500,
  sound: localStorage.getItem("golden_sound") !== "off",
  lastBonus: localStorage.getItem("golden_bonus") || null,
  spinning: false
};


const $ = (selector) => document.querySelector(selector);


const balanceEl = $("#balance");
const gameArea = $("#gameArea");
const toastEl = $("#toast");
const modal = $("#modal");


function formatNumber(value) {
  return Math.floor(value).toLocaleString("ru-RU");
}


function save() {
  localStorage.setItem(
    "golden_balance",
    String(state.balance)
  );
}


function updateBalance() {
  balanceEl.textContent =
    formatNumber(state.balance);
}


function toast(message) {

  toastEl.textContent = message;
  toastEl.classList.add("show");

  clearTimeout(toast.timer);

  toast.timer = setTimeout(() => {
    toastEl.classList.remove("show");
  }, 2200);
}


function changeBalance(amount) {

  state.balance += amount;

  if (state.balance < 0) {
    state.balance = 0;
  }

  save();
  updateBalance();
}


/* SOUND */

let audioContext = null;


function playSound(type = "click") {

  if (!state.sound) return;

  try {

    if (!audioContext) {
      audioContext =
        new (window.AudioContext ||
        window.webkitAudioContext)();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const osc =
      audioContext.createOscillator();

    const gain =
      audioContext.createGain();

    const frequencies = {
      click: 520,
      spin: 180,
      win: 720,
      bigwin: 1050
    };

    osc.type =
      type === "bigwin"
        ? "triangle"
        : "sine";

    osc.frequency.value =
      frequencies[type] || 520;

    gain.gain.setValueAtTime(
      0.0001,
      audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      type === "bigwin" ? .13 : .07,
      audioContext.currentTime + .02
    );

    gain.gain.exponentialRampToValueAtTime(
      .0001,
      audioContext.currentTime +
      (type === "spin" ? .5 : .2)
    );

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.start();

    osc.stop(
      audioContext.currentTime +
      (type === "spin" ? .5 : .2)
    );

  } catch (e) {}
}


function updateSoundButtons() {

  $("#soundButton").textContent =
    state.sound ? "🔊" : "🔇";

  $("#soundFooter").textContent =
    state.sound
      ? "🔊 SOUND"
      : "🔇 SOUND";
}


function toggleSound() {

  state.sound = !state.sound;

  localStorage.setItem(
    "golden_sound",
    state.sound ? "on" : "off"
  );

  updateSoundButtons();

  if (state.sound) {
    playSound("click");
    toast("Звук включён");
  } else {
    toast("Звук выключен");
  }
}


$("#soundButton").onclick = toggleSound;
$("#soundFooter").onclick = toggleSound;


/* MODAL */

function openModal(title, value, text) {

  $("#modalTitle").textContent = title;
  $("#modalValue").textContent = value;
  $("#modalText").textContent = text;

  modal.classList.add("open");

  playSound(
    String(value).includes("1000")
      ? "bigwin"
      : "win"
  );
}


function closeModal() {
  modal.classList.remove("open");
}


$("#modalClose").onclick = closeModal;
$("#modalButton").onclick = closeModal;


modal.onclick = (event) => {

  if (event.target === modal) {
    closeModal();
  }

};


/* PROFILE */

$("#profileButton").onclick = () => {

  playSound();

  const user =
    tg?.initDataUnsafe?.user;

  if (user) {

    $("#profileLetter").textContent =
      (user.first_name || "G")[0]
        .toUpperCase();

    toast(
      `Привет, ${user.first_name || "игрок"}!`
    );

  } else {

    toast("Golden Player");

  }

};


/* VIP */

$("#vipButton").onclick = () => {

  playSound();

  openModal(
    "VIP CLUB",
    "VIP",
    "VIP-раздел Golden Spin."
  );

};


/* BONUS */

$("#dailyBonus").onclick = () => {

  const today =
    new Date().toISOString().slice(0,10);

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

  openModal(
    "ЕЖЕДНЕВНЫЙ БОНУС",
    "+250",
    "250 виртуальных токенов добавлены."
  );

};


/* GAME CARDS */

document.querySelectorAll(".game-card")
.forEach(card => {

  card.onclick = () => {

    const game =
      card.dataset.game;

    playSound();

    document
      .querySelectorAll(".game-card")
      .forEach(c =>
        c.classList.remove("selected")
      );

    card.classList.add("selected");

    openGame(game);

  };

});


/* HERO */

$("#heroPlay").onclick = () => {

  playSound();

  document
    .querySelector(".games")
    .scrollIntoView({
      behavior:"smooth"
    });

  setTimeout(() => {
    openGame("slots");
  }, 350);

};


/* OPEN GAME */

function openGame(game) {

  if (!gameArea) {
    console.error("gameArea not found");
    return;
  }

  const games = {
    slots: renderSlots,
    roulette: renderRoulette,
    wheel: renderWheel,
    chests: renderChests,
    smash: renderSmash
  };

  if (!games[game]) {
    console.error("Unknown game:", game);
    return;
  }

  games[game]();

  setTimeout(() => {

    gameArea.scrollIntoView({
      behavior:"smooth",
      block:"center"
    });

  },50);
}


/* SLOTS */

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

      button.onclick = () => {

        bet =
          Number(button.dataset.bet);

        $("#slotBet").textContent =
          bet;

        playSound();

      };

    });


  $("#slotSpin").onclick = () => {

    if (state.spinning) return;

    if (state.balance < bet) {

      toast("Недостаточно токенов");

      return;
    }

    state.spinning = true;

    changeBalance(-bet);

    playSound("spin");

    const symbols =
      ["7","BAR","◆","777","GOLD"];

    reels.forEach((reel,index) => {

      reel.style.animation =
        "none";

      void reel.offsetWidth;

      reel.style.animation =
        "slotReel .6s ease";

      setTimeout(() => {

        reel.textContent =
          symbols[
            Math.floor(
              Math.random() *
              symbols.length
            )
          ];

      },600 + index * 180);

    });


    setTimeout(() => {

      const win =
        Math.random() < .30;

      if (win) {

        const roll =
          Math.random();

        const multiplier =
          roll < .06 ? 20 :
          roll < .18 ? 10 :
          4;

        const reward =
          bet * multiplier;

        changeBalance(reward);

        openModal(
          multiplier >= 20
            ? "JACKPOT!"
            : "ВЫИГРЫШ!",
          `+${formatNumber(reward)}`,
          `${multiplier}× ставки`
        );

      } else {

        toast("Попробуй ещё раз");

      }

      state.spinning = false;

    },1450);

  };

}


/* ROULETTE */

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
  `;


  let selected = "red";


  gameArea
    .querySelectorAll("[data-color]")
    .forEach(button => {

      button.onclick = () => {

        selected =
          button.dataset.color;

        gameArea
          .querySelectorAll("[data-color]")
          .forEach(x =>
            x.classList.remove("active")
          );

        button.classList.add("active");

        playSound();

      };

    });


  $("#rouletteSpin").onclick = () => {

    if (state.spinning) return;

    const bet = 50;

    if (state.balance < bet) {

      toast("Недостаточно токенов");

      return;
    }

    state.spinning = true;

    changeBalance(-bet);

    const wheel =
      gameArea.querySelector(
        ".big-roulette"
      );

    wheel.classList.add("spinning");

    playSound("spin");


    setTimeout(() => {

      wheel.classList.remove("spinning");

      const roll =
        Math.random();

      let result;

      if (roll < .475) {
        result = "red";
      } else if (roll < .95) {
        result = "black";
      } else {
        result = "green";
      }


      if (result === selected) {

        const reward =
          result === "green"
            ? 1750
            : 100;

        changeBalance(reward);

        openModal(
          "РУЛЕТКА",
          `+${formatNumber(reward)}`,
          "Ставка выиграла."
        );

      } else {

        toast(
          `Выпало: ${
            result === "red"
              ? "красное"
              : result === "black"
                ? "чёрное"
                : "ZERO"
          }`
        );

      }

      state.spinning = false;

    },2200);

  };

}


/* WHEEL */

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


  $("#fortuneSpin").onclick = () => {

    if (state.spinning) return;

    const bet = 50;

    if (state.balance < bet) {

      toast("Недостаточно токенов");

      return;
    }

    state.spinning = true;

    changeBalance(-bet);

    const wheel =
      gameArea.querySelector(
        ".fortune-big"
      );

    wheel.classList.add("spinning");

    playSound("spin");


    setTimeout(() => {

      wheel.classList.remove("spinning");

      const rewards =
        [0,50,100,150,250,500,1000];

      const reward =
        rewards[
          Math.floor(
            Math.random() *
            rewards.length
          )
        ];

      if (reward > 0) {

        changeBalance(reward);

        openModal(
          "КОЛЕСО УДАЧИ",
          `+${formatNumber(reward)}`,
          "Награда добавлена."
        );

      } else {

        toast("Пустой сектор");

      }

      state.spinning = false;

    },2200);

  };

}


/* CHESTS */

function renderChests() {

  gameArea.innerHTML = `

    <div class="game-screen">

      <span class="mini-label">
        TREASURE ROOM
      </span>

      <h2>🧰 GOLD CHESTS</h2>

      <div class="chest-game">

        <button class="open-chest">
          ◆
        </button>

        <button class="open-chest">
          ◆
        </button>

        <button class="open-chest">
          ◆
        </button>

      </div>

      <p class="game-note">
        Стоимость открытия: 50 токенов
      </p>

    </div>
  `;


  gameArea
    .querySelectorAll(".open-chest")
    .forEach(chest => {

      chest.onclick = () => {

        if (state.spinning) return;

        const cost = 50;

        if (state.balance < cost) {

          toast("Недостаточно токенов");

          return;
        }

        state.spinning = true;

        changeBalance(-cost);

        chest.classList.add("opening");

        playSound("click");


        setTimeout(() => {

          const rewards =
            [25,75,150,300,750];

          const reward =
            rewards[
              Math.floor(
                Math.random() *
                rewards.length
              )
            ];

          changeBalance(reward);

          openModal(
            "СУНДУК ОТКРЫТ!",
            `+${formatNumber(reward)}`,
            "Ты нашёл награду."
          );

          chest.classList.remove("opening");

          state.spinning = false;

        },700);

      };

    });

}


/* SMASH */

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


  $("#smashBlock").onclick = () => {

    if (state.spinning) return;

    const cost = 25;

    if (state.balance < cost) {

      toast("Недостаточно токенов");

      return;
    }

    state.spinning = true;

    changeBalance(-cost);

    const block =
      $("#smashBlock");

    block.classList.add("broken");

    playSound("click");


    setTimeout(() => {

      const rewards =
        [0,25,50,100,250,500];

      const reward =
        rewards[
          Math.floor(
            Math.random() *
            rewards.length
          )
        ];


      if (reward > 0) {

        changeBalance(reward);

        openModal(
          "БЛОК РАЗБИТ!",
          `+${formatNumber(reward)}`,
          "Награда добавлена."
        );

      } else {

        toast("Внутри ничего нет!");

      }

      block.classList.remove("broken");

      state.spinning = false;

    },500);

  };

}


/* EXTRA ANIMATION */

const extraStyle =
document.createElement("style");

extraStyle.textContent = `

@keyframes slotReel {

  0% {
    transform:translateY(-15px);
    filter:blur(5px);
  }

  50% {
    transform:translateY(10px);
    filter:blur(2px);
  }

  100% {
    transform:translateY(0);
    filter:blur(0);
  }

}

`;

document.head.appendChild(extraStyle);


/* START */

updateBalance();
updateSoundButtons();

openGame("slots");