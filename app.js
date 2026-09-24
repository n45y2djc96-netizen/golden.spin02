let balance = Number(localStorage.getItem("goldenBalance"));

if (!balance || balance < 100) {
  balance = 12550;
}

let currentGame = "slots";
let rouletteChoice = null;
let wheelRotation = 0;
let hits = 0;
let audioContext = null;

const symbols = ["🍋", "🍊", "🍇", "⭐", "💎", "7️⃣"];

function saveBalance() {
  localStorage.setItem("goldenBalance", balance);
  document.getElementById("balance").textContent = balance.toLocaleString("ru-RU");
}

function sound(type = "click") {

  try {

    if (!audioContext) {
      audioContext = new (
        window.AudioContext ||
        window.webkitAudioContext
      )();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(audioContext.destination);

    const now = audioContext.currentTime;

    if (type === "win") {

      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + .25);

      gain.gain.setValueAtTime(.001, now);
      gain.gain.exponentialRampToValueAtTime(.22, now + .03);
      gain.gain.exponentialRampToValueAtTime(.001, now + .5);

      osc.start(now);
      osc.stop(now + .5);

    } else if (type === "lose") {

      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + .3);

      gain.gain.setValueAtTime(.001, now);
      gain.gain.exponentialRampToValueAtTime(.16, now + .02);
      gain.gain.exponentialRampToValueAtTime(.001, now + .35);

      osc.start(now);
      osc.stop(now + .35);

    } else {

      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + .08);

      gain.gain.setValueAtTime(.001, now);
      gain.gain.exponentialRampToValueAtTime(.1, now + .01);
      gain.gain.exponentialRampToValueAtTime(.001, now + .12);

      osc.start(now);
      osc.stop(now + .12);
    }

  } catch (e) {
    console.log("Audio unavailable");
  }
}

function toast(text) {

  const element = document.getElementById("toast");

  element.textContent = text;
  element.classList.add("show");

  setTimeout(() => {
    element.classList.remove("show");
  }, 2200);
}

function selectGame(game) {

  currentGame = game;

  document.querySelectorAll(".game-panel").forEach(panel => {
    panel.classList.add("hidden");
  });

  document.querySelectorAll(".game-tab").forEach(tab => {
    tab.classList.remove("active");
  });

  const panel = document.getElementById(game + "Game");

  if (panel) {
    panel.classList.remove("hidden");
  }

  const icons = {
    slots: "🎰",
    roulette: "🎲",
    wheel: "🎡",
    chests: "🧰",
    block: "🔨"
  };

  const titles = {
    slots: "СЛОТЫ",
    roulette: "РУЛЕТКА",
    wheel: "КОЛЕСО",
    chests: "СУНДУКИ",
    block: "РАЗБИТЬ БЛОК"
  };

  document.getElementById("gameIcon").textContent = icons[game];
  document.getElementById("gameTitle").textContent = titles[game];

  const index = ["slots", "roulette", "wheel", "chests", "block"].indexOf(game);

  document.querySelectorAll(".game-tab")[index]
    ?.classList.add("active");

  sound();
}

function playCurrentGame() {

  sound();

  if (currentGame === "slots") spinSlots();
  if (currentGame === "roulette") spinRoulette();
  if (currentGame === "wheel") spinFortuneWheel();
  if (currentGame === "chests") openRandomChest();
  if (currentGame === "block") hitBlock();
}

function spinSlots() {

  const bet = Number(document.getElementById("slotBet").value);

  if (balance < bet) {
    toast("Недостаточно токенов");
    sound("lose");
    return;
  }

  balance -= bet;
  saveBalance();

  const reels = [
    document.getElementById("reel1"),
    document.getElementById("reel2"),
    document.getElementById("reel3")
  ];

  reels.forEach(r => r.classList.add("spinning"));

  sound();

  let ticks = 0;

  const animation = setInterval(() => {

    reels.forEach(r => {
      r.textContent =
        symbols[Math.floor(Math.random() * symbols.length)];
    });

    ticks++;

    if (ticks >= 22) {

      clearInterval(animation);

      reels.forEach(r => r.classList.remove("spinning"));

      const result = reels.map(r => r.textContent);

      let win = 0;

      if (
        result[0] === result[1] &&
        result[1] === result[2]
      ) {

        if (result[0] === "7️⃣") {
          win = bet * 20;
        } else if (result[0] === "💎") {
          win = bet * 15;
        } else {
          win = bet * 8;
        }

      } else if (
        result[0] === result[1] ||
        result[1] === result[2] ||
        result[0] === result[2]
      ) {
        win = bet * 2;
      }

      if (win > 0) {

        balance += win;
        saveBalance();

        document.getElementById("slotMessage").textContent =
          `🎉 ВЫИГРЫШ +${win.toLocaleString("ru-RU")} ТОКЕНОВ`;

        sound("win");
        toast(`Выигрыш +${win}`);

      } else {

        document.getElementById("slotMessage").textContent =
          "Попробуй ещё раз";

        sound("lose");
      }

    }

  }, 80);
}

function rouletteBet(choice) {

  rouletteChoice = choice;

  document.getElementById("rouletteMessage").textContent =
    `Ставка: ${choice === "red" ? "🔴 КРАСНОЕ" :
    choice === "black" ? "⚫ ЧЁРНОЕ" :
    "🟢 ZERO"}`;

  sound();
}

function spinRoulette() {

  if (!rouletteChoice) {
    toast("Сначала выбери ставку");
    sound("lose");
    return;
  }

  const bet = Number(document.getElementById("rouletteBet").value);

  if (balance < bet) {
    toast("Недостаточно токенов");
    return;
  }

  balance -= bet;
  saveBalance();

  const wheel = document.getElementById("rouletteWheel");

  const rotation =
    1440 + Math.floor(Math.random() * 720);

  wheel.style.transition =
    "transform 4s cubic-bezier(.12,.7,.15,1)";

  wheel.style.transform =
    `rotate(${rotation}deg)`;

  sound();

  setTimeout(() => {

    const number = Math.floor(Math.random() * 12);

    let color;

    if (number === 0) {
      color = "green";
    } else {
      color = number % 2 === 0 ? "black" : "red";
    }

    let win = 0;

    if (rouletteChoice === color) {

      if (color === "green") {
        win = bet * 10;
      } else {
        win = bet * 2;
      }

    }

    if (win > 0) {

      balance += win;
      saveBalance();

      document.getElementById("rouletteMessage").textContent =
        `🎉 Выпало ${number} — выигрыш +${win}`;

      sound("win");

    } else {

      document.getElementById("rouletteMessage").textContent =
        `Выпало ${number}. Попробуй ещё раз`;

      sound("lose");
    }

  }, 4100);
}

function spinFortuneWheel() {

  const wheel = document.getElementById("fortuneWheel");

  wheelRotation +=
    1800 + Math.floor(Math.random() * 720);

  wheel.style.transform =
    `rotate(${wheelRotation}deg)`;

  sound();

  setTimeout(() => {

    const prizes = [
      10,
      25,
      50,
      100,
      250,
      500,
      1000,
      0
    ];

    const prize =
      prizes[Math.floor(Math.random() * prizes.length)];

    if (prize > 0) {

      balance += prize;
      saveBalance();

      document.getElementById("wheelMessage").textContent =
        `🎉 КОЛЕСО: +${prize} ТОКЕНОВ`;

      sound("win");

    } else {

      document.getElementById("wheelMessage").textContent =
        "💥 Бум! В этот раз ничего";

      sound("lose");
    }

  }, 4100);
}

function openChest(button) {

  if (button.dataset.opened === "true") {
    return;
  }

  button.dataset.opened = "true";

  sound();

  button.textContent = "✨";

  setTimeout(() => {

    const prizes = [
      25,
      50,
      100,
      150,
      250,
      500,
      1000
    ];

    const prize =
      prizes[Math.floor(Math.random() * prizes.length)];

    balance += prize;
    saveBalance();

    button.innerHTML =
      `💰<span>+${prize}</span>`;

    document.getElementById("chestMessage").textContent =
      `🎉 Ты получил ${prize} токенов!`;

    sound("win");

  }, 600);
}

function openRandomChest() {

  const chests =
    document.querySelectorAll(".chest");

  const available =
    [...chests].filter(c =>
      c.dataset.opened !== "true"
    );

  if (!available.length) {
    toast("Все сундуки уже открыты");
    return;
  }

  const chest =
    available[Math.floor(Math.random() * available.length)];

  openChest(chest);
}

function hitBlock() {

  const block =
    document.getElementById("bigBlock");

  hits++;

  document.getElementById("hits").textContent =
    hits;

  block.classList.add("hit");

  setTimeout(() => {
    block.classList.remove("hit");
  }, 80);

  sound();

  if (hits >= 5) {

    const prize =
      50 + Math.floor(Math.random() * 451);

    balance += prize;
    saveBalance();

    hits = 0;

    document.getElementById("hits").textContent = 0;

    document.getElementById("blockMessage").textContent =
      `💥 БЛОК РАЗБИТ! +${prize} ТОКЕНОВ`;

    sound("win");

    toast(`+${prize} токенов`);

  } else {

    document.getElementById("blockMessage").textContent =
      `Удар! Осталось ${5 - hits}`;
  }
}

document.addEventListener("DOMContentLoaded", () => {

  saveBalance();

  selectGame("slots");

  /*
   * Создаём аудио только после первого
   * нажатия пользователя.
   */
  document.addEventListener(
    "pointerdown",
    () => {
      sound();
    },
    { once: true }
  );

});