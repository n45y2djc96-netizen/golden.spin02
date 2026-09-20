let balance =
  Number(localStorage.getItem("goldenBalance")) || 12500;

const balanceElement =
  document.getElementById("balance");

function saveBalance() {
  localStorage.setItem(
    "goldenBalance",
    balance
  );

  balanceElement.textContent =
    balance.toLocaleString("ru-RU");
}

function message(text) {

  const box =
    document.getElementById("message");

  box.textContent = text;

  box.classList.add("show");

  setTimeout(() => {
    box.classList.remove("show");
  }, 1800);
}

function spend(amount) {

  if (balance < amount) {

    message(
      "Недостаточно виртуальных токенов"
    );

    return false;
  }

  balance -= amount;

  saveBalance();

  return true;
}

function win(amount) {

  balance += amount;

  saveBalance();

  message(
    "+" +
    amount.toLocaleString("ru-RU") +
    " токенов"
  );
}


/* СЛОТЫ */

function slots() {

  return `

  <h1 class="game-title">
    🎰 СЛОТЫ
  </h1>

  <div class="slot">

    <div class="reels">

      <div class="reel" id="r1">
        7️⃣
      </div>

      <div class="reel" id="r2">
        🍒
      </div>

      <div class="reel" id="r3">
        💎
      </div>

    </div>

    <div class="controls">

      <select
        id="slotBet"
        class="bet"
      >

        <option value="50">
          Ставка 50
        </option>

        <option value="100">
          Ставка 100
        </option>

        <option value="250">
          Ставка 250
        </option>

      </select>

      <button
        class="gold-button"
        onclick="spinSlots()"
      >
        SPIN
      </button>

    </div>

  </div>

  `;
}


function spinSlots() {

  const bet =
    Number(
      document.getElementById(
        "slotBet"
      ).value
    );

  if (!spend(bet))
    return;

  const symbols = [
    "7️⃣",
    "🍒",
    "💎",
    "🍋",
    "🔔",
    "⭐",
    "BAR"
  ];

  const result = [];

  for (let i = 0; i < 3; i++) {

    result.push(
      symbols[
        Math.floor(
          Math.random() *
          symbols.length
        )
      ]
    );
  }

  document.getElementById("r1")
    .textContent = result[0];

  document.getElementById("r2")
    .textContent = result[1];

  document.getElementById("r3")
    .textContent = result[2];


  if (
    result[0] === result[1] &&
    result[1] === result[2]
  ) {

    win(bet * 5);

  } else if (
    result.filter(
      x => x === "💎"
    ).length >= 2
  ) {

    win(bet * 2);

  } else {

    message(
      "Попробуй ещё раз"
    );
  }
}


/* РУЛЕТКА */

function roulette() {

  return `

  <h1 class="game-title">
    🎲 РУЛЕТКА
  </h1>

  <div class="roulette"
       id="roulette">

    ●

  </div>

  <div class="controls">

    <button
      class="gold-button"
      onclick="spinRoulette()"
    >
      КРУТИТЬ
    </button>

  </div>

  `;
}


function spinRoulette() {

  const bet = 100;

  if (!spend(bet))
    return;

  const wheel =
    document.getElementById(
      "roulette"
    );

  wheel.style.transform =
    "rotate(" +
    (720 +
      Math.floor(
        Math.random() * 720
      )) +
    "deg)";

  setTimeout(() => {

    if (
      Math.random() < 0.35
    ) {

      win(bet * 2);

    } else {

      message(
        "Проигрышный сектор"
      );
    }

  }, 2000);
}


/* КОЛЕСО */

function wheel() {

  return `

  <h1 class="game-title">
    🎡 КОЛЕСО ФОРТУНЫ
  </h1>

  <div
    class="wheel"
    id="wheel"
  >
    ⭐
  </div>

  <div class="controls">

    <button
      class="gold-button"
      onclick="spinWheel()"
    >
      КРУТИТЬ
    </button>

  </div>

  `;
}


function spinWheel() {

  const bet = 100;

  if (!spend(bet))
    return;

  const wheelElement =
    document.getElementById(
      "wheel"
    );

  wheelElement.style.transform =
    "rotate(" +
    (720 +
      Math.random() * 720) +
    "deg)";

  setTimeout(() => {

    const prizes =
      [0, 50, 100, 150, 250, 500];

    const prize =
      prizes[
        Math.floor(
          Math.random() *
          prizes.length
        )
      ];

    if (prize) {

      win(prize);

    } else {

      message(
        "Пустой сектор"
      );
    }

  }, 1800);
}


/* СУНДУКИ */

function chests() {

  return `

  <h1 class="game-title">
    🧰 ВЫБЕРИ СУНДУК
  </h1>

  <div class="chests">

    <button
      class="chest"
      onclick="openChest(this)"
    >
      <div class="chest-icon">
        🧰
      </div>

      СУНДУК №1
    </button>

    <button
      class="chest"
      onclick="openChest(this)"
    >
      <div class="chest-icon">
        🧰
      </div>

      СУНДУК №2
    </button>

    <button
      class="chest"
      onclick="openChest(this)"
    >
      <div class="chest-icon">
        🧰
      </div>

      СУНДУК №3
    </button>

  </div>

  `;
}


function openChest(element) {

  if (
    element.dataset.opened
  )
    return;

  if (!spend(100))
    return;

  element.dataset.opened =
    "true";

  element.querySelector(
    ".chest-icon"
  ).textContent = "🎁";

  const prizes =
    [0, 50, 100, 250, 500];

  const prize =
    prizes[
      Math.floor(
        Math.random() *
        prizes.length
      )
    ];

  if (prize) {

    win(prize);

  } else {

    message(
      "В сундуке ничего нет"
    );
  }
}


/* РАЗБИТЬ */

function smash() {

  let html = `

  <h1 class="game-title">
    🔨 РАЗБИТЬ БЛОК
  </h1>

  <p style="text-align:center">
    Стоимость попытки — 50 виртуальных токенов
  </p>

  <div class="bricks">
  `;

  for (
    let i = 0;
    i < 20;
    i++
  ) {

    html += `

      <button
        class="brick"
        onclick="breakBrick(this)"
      ></button>

    `;
  }

  html += `
  </div>
  `;

  return html;
}


function breakBrick(element) {

  if (
    element.classList.contains(
      "broken"
    )
  )
    return;

  if (!spend(50))
    return;

  element.classList.add(
    "broken"
  );

  if (
    Math.random() < 0.25
  ) {

    const prizes =
      [50, 100, 250];

    const prize =
      prizes[
        Math.floor(
          Math.random() *
          prizes.length
        )
      ];

    win(prize);

  } else {

    message(
      "Здесь ничего нет"
    );
  }
}


/* ПЕРЕКЛЮЧЕНИЕ ИГР */

function showGame(game) {

  const container =
    document.getElementById(
      "game"
    );

  if (game === "slots") {

    container.innerHTML =
      slots();

  }

  if (game === "roulette") {

    container.innerHTML =
      roulette();

  }

  if (game === "wheel") {

    container.innerHTML =
      wheel();

  }

  if (game === "chests") {

    container.innerHTML =
      chests();

  }

  if (game === "smash") {

    container.innerHTML =
      smash();

  }
}


/* ЕЖЕДНЕВНЫЙ БОНУС */

function dailyBonus() {

  const today =
    new Date()
      .toISOString()
      .slice(0, 10);

  const received =
    localStorage.getItem(
      "dailyBonus"
    );

  if (
    received === today
  ) {

    message(
      "Бонус уже получен сегодня"
    );

    return;
  }

  localStorage.setItem(
    "dailyBonus",
    today
  );

  win(250);
}


/* ЗАПУСК */

saveBalance();

showGame("slots");