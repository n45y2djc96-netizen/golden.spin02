/* =========================================================
   GOLDEN SPIN — APP.JS
   5 WORKING GAMES
   ========================================================= */

const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();

  try {
    tg.setHeaderColor("#070504");
    tg.setBackgroundColor("#070504");
  } catch (_) {}
}


/* =========================================================
   STATE
   ========================================================= */

const state = {
  balance: Number(localStorage.getItem("golden_balance")) || 12500,
  sound: localStorage.getItem("golden_sound") !== "off",
  lastBonus: localStorage.getItem("golden_bonus") || null,

  currentGame: "slots",

  totalSpins:
    Number(localStorage.getItem("golden_spins")) || 0,

  wins:
    Number(localStorage.getItem("golden_wins")) || 0,

  bestWin:
    Number(localStorage.getItem("golden_best")) || 0,

  streak:
    Number(localStorage.getItem("golden_streak")) || 0
};


/* =========================================================
   HELPERS
   ========================================================= */

const $ = selector => document.querySelector(selector);

const gameArea =
  $("#gameArea") ||
  $("#game") ||
  document.querySelector(".game-area");

const balanceEl = $("#balance");

const toastEl =
  $("#toast") ||
  document.querySelector(".toast");

const modal =
  $("#modal") ||
  document.querySelector(".modal");


function formatNumber(value) {
  return Math.floor(value).toLocaleString("ru-RU");
}


function save() {
  localStorage.setItem(
    "golden_balance",
    state.balance
  );

  localStorage.setItem(
    "golden_spins",
    state.totalSpins
  );

  localStorage.setItem(
    "golden_wins",
    state.wins
  );

  localStorage.setItem(
    "golden_best",
    state.bestWin
  );

  localStorage.setItem(
    "golden_streak",
    state.streak
  );
}


function updateBalance() {
  if (balanceEl) {
    balanceEl.textContent =
      formatNumber(state.balance);
  }
}


function changeBalance(amount) {
  state.balance += amount;

  if (state.balance < 0) {
    state.balance = 0;
  }

  updateBalance();
  save();
}


function toast(message) {
  if (!toastEl) return;

  toastEl.textContent = message;
  toastEl.classList.add("show");

  clearTimeout(toast.timer);

  toast.timer = setTimeout(() => {
    toastEl.classList.remove("show");
  }, 2300);
}


function random(min, max) {
  return Math.floor(
    Math.random() * (max - min + 1)
  ) + min;
}


function chance(percent) {
  return Math.random() < percent;
}


/* =========================================================
   SOUND ENGINE
   ========================================================= */

let audioContext = null;


function getAudio() {
  if (!state.sound) return null;

  try {
    if (!audioContext) {
      const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioContext) return null;

      audioContext = new AudioContext();
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
    .0001,
    ctx.currentTime
  );

  gain.gain.exponentialRampToValueAtTime(
    volume,
    ctx.currentTime + .015
  );

  gain.gain.exponentialRampToValueAtTime(
    .0001,
    ctx.currentTime + duration
  );

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start();

  oscillator.stop(
    ctx.currentTime + duration + .02
  );
}


function playSound(type) {

  if (!state.sound) return;

  switch (type) {

    case "click":
      tone(520, .08);
      break;

    case "tick":
      tone(780, .045);
      break;

    case "spin":
      tone(180, .35, "triangle", .045);
      break;

    case "win":
      tone(660, .12);
      setTimeout(() => tone(880, .14), 100);
      break;

    case "bigwin":
      tone(523, .12);
      setTimeout(() => tone(659, .12), 110);
      setTimeout(() => tone(784, .18), 220);
      setTimeout(() => tone(1047, .25), 350);
      break;

    case "lose":
      tone(180, .18, "sawtooth", .035);
      break;

    case "coin":
      tone(1000, .07);
      setTimeout(() => tone(1400, .09), 70);
      break;
  }
}


/* =========================================================
   MODAL
   ========================================================= */

function openModal(
  title,
  value,
  text,
  big = false
) {

  if (!modal) {
    toast(`${title}: ${value}`);
    return;
  }

  const titleEl =
    $("#modalTitle") ||
    modal.querySelector("[data-modal-title]");

  const valueEl =
    $("#modalValue") ||
    modal.querySelector("[data-modal-value]");

  const textEl =
    $("#modalText") ||
    modal.querySelector("[data-modal-text]");

  if (titleEl) titleEl.textContent = title;
  if (valueEl) valueEl.textContent = value;
  if (textEl) textEl.textContent = text;

  modal.classList.add("open");

  playSound(big ? "bigwin" : "win");
}


function closeModal() {
  if (modal) {
    modal.classList.remove("open");
  }
}


$("#modalClose")?.addEventListener(
  "click",
  closeModal
);

$("#modalButton")?.addEventListener(
  "click",
  closeModal
);

modal?.addEventListener(
  "click",
  event => {
    if (event.target === modal) {
      closeModal();
    }
  }
);


/* =========================================================
   SOUND BUTTONS
   ========================================================= */

function updateSoundButtons() {

  const soundButton =
    $("#soundButton");

  const soundFooter =
    $("#soundFooter");

  if (soundButton) {
    soundButton.textContent =
      state.sound ? "🔊" : "🔇";
  }

  if (soundFooter) {
    soundFooter.textContent =
      state.sound
        ? "🔊 SOUND"
        : "🔇 SOUND";
  }
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


$("#soundButton")?.addEventListener(
  "click",
  toggleSound
);

$("#soundFooter")?.addEventListener(
  "click",
  toggleSound
);


/* =========================================================
   PROFILE
   ========================================================= */

$("#profileButton")?.addEventListener(
  "click",
  () => {

    playSound("click");

    const user =
      tg?.initDataUnsafe?.user;

    if (user) {

      const letter =
        (user.first_name || "G")
          .charAt(0)
          .toUpperCase();

      if ($("#profileLetter")) {
        $("#profileLetter").textContent =
          letter;
      }

      toast(
        `Привет, ${user.first_name || "игрок"}!`
      );

    } else {

      toast("GOLDEN PLAYER");
    }
  }
);


/* =========================================================
   VIP
   ========================================================= */

$("#vipButton")?.addEventListener(
  "click",
  () => {

    playSound("click");

    openModal(
      "VIP CLUB",
      "GOLD",
      "VIP-клуб Golden Spin. Эксклюзивные режимы и бонусы.",
      false
    );
  }
);


/* =========================================================
   DAILY BONUS
   ========================================================= */

$("#dailyBonus")?.addEventListener(
  "click",
  () => {

    const today =
      new Date()
        .toISOString()
        .slice(0, 10);

    if (state.lastBonus === today) {

      toast(
        "Бонус уже получен сегодня"
      );

      return;
    }

    state.lastBonus = today;

    localStorage.setItem(
      "golden_bonus",
      today
    );

    changeBalance(250);

    playSound("coin");

    openModal(
      "DAILY REWARD",
      "+250",
      "Ежедневная награда добавлена на баланс."
    );
  }
);


/* =========================================================
   HERO
   ========================================================= */

$("#heroPlay")?.addEventListener(
  "click",
  () => {

    playSound("click");

    openGame("slots");

    setTimeout(() => {

      gameArea?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

    }, 100);
  }
);


/* =========================================================
   GAME NAVIGATION
   ========================================================= */

document
  .querySelectorAll(".game-card")
  .forEach(card => {

    card.addEventListener(
      "click",
      () => {

        const game =
          card.dataset.game;

        if (!game) return;

        playSound("click");

        document
          .querySelectorAll(".game-card")
          .forEach(item => {
            item.classList.remove(
              "selected",
              "active"
            );
          });

        card.classList.add(
          "selected",
          "active"
        );

        openGame(game);
      }
    );
  });


function openGame(game) {

  if (!gameArea) {
    console.error(
      "Golden Spin: gameArea not found"
    );

    return;
  }

  state.currentGame = game;

  const games = {
    slots: renderSlots,
    roulette: renderRoulette,
    wheel: renderWheel,
    chests: renderChests,
    smash: renderSmash
  };

  if (!games[game]) return;

  games[game]();

  setTimeout(() => {

    gameArea.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

  }, 80);
}


/* =========================================================
   COMMON GAME UI
   ========================================================= */

function gameHeader(
  label,
  title,
  subtitle
) {

  return `
    <div class="game-screen">

      <div class="game-screen-head">

        <div>
          <span class="mini-label">
            ${label}
          </span>

          <h2>${title}</h2>

          <p>
            ${subtitle}
          </p>
        </div>

        <div class="game-streak">
          <small>STREAK</small>
          <strong>${state.streak}</strong>
        </div>

      </div>

  `;
}


function finishGame() {

  setTimeout(() => {

    gameArea
      ?.querySelectorAll(
        "button"
      )
      .forEach(button => {
        button.disabled = false;
      });

  }, 100);
}


function registerSpin() {

  state.totalSpins++;

  save();
}


function registerWin(amount) {

  if (amount <= 0) {

    state.streak = 0;

    save();

    return;
  }

  state.wins++;

  state.streak++;

  if (amount > state.bestWin) {
    state.bestWin = amount;
  }

  save();
}


/* =========================================================
   1. SLOTS
   ========================================================= */

function renderSlots() {

  gameArea.innerHTML = `
    ${gameHeader(
      "GOLDEN JACKPOT",
      "🎰 GOLDEN SLOTS",
      "Собери комбинацию и попробуй поймать JACKPOT."
    )}

      <div class="slot-machine">

        <div class="slot-jackpot">
          JACKPOT
          <strong id="slotJackpot">
            ${formatNumber(
              50000 +
              state.totalSpins * 17
            )}
          </strong>
        </div>

        <div class="slot-reels">

          <div class="slot-reel" id="reel1">
            7
          </div>

          <div class="slot-reel" id="reel2">
            ◆
          </div>

          <div class="slot-reel" id="reel3">
            7
          </div>

        </div>

        <div class="slot-result" id="slotResult">
          УДАЧИ
        </div>

        <div class="slot-controls">

          <div class="bet-box">

            <span>СТАВКА</span>

            <strong id="slotBet">
              50
            </strong>

          </div>

          <div class="bet-buttons">

            <button data-slot-bet="10">
              10
            </button>

            <button data-slot-bet="50">
              50
            </button>

            <button data-slot-bet="100">
              100
            </button>

            <button data-slot-bet="250">
              250
            </button>

            <button data-slot-bet="500">
              500
            </button>

          </div>

          <button
            class="game-action"
            id="slotSpin"
          >
            SPIN
          </button>

        </div>

      </div>

      <div class="paytable">

        <div>
          <span>777</span>
          <strong>×100</strong>
        </div>

        <div>
          <span>GOLD</span>
          <strong>×25</strong>
        </div>

        <div>
          <span>BAR</span>
          <strong>×10</strong>
        </div>

        <div>
          <span>◆◆◆</span>
          <strong>×5</strong>
        </div>

      </div>

    </div>
  `;


  let bet = 50;

  gameArea
    .querySelectorAll(
      "[data-slot-bet]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          bet =
            Number(
              button.dataset.slotBet
            );

          $("#slotBet").textContent =
            bet;

          playSound("click");
        }
      );
    });


  $("#slotSpin")
    ?.addEventListener(
      "click",
      () => {

        const spinButton =
          $("#slotSpin");

        if (
          state.balance < bet
        ) {

          toast(
            "Недостаточно токенов"
          );

          return;
        }

        spinButton.disabled = true;

        changeBalance(-bet);

        registerSpin();

        playSound("spin");

        const reels = [
          $("#reel1"),
          $("#reel2"),
          $("#reel3")
        ];

        const symbols = [
          "7",
          "◆",
          "BAR",
          "GOLD",
          "777"
        ];

        reels.forEach(
          (reel, index) => {

            reel.classList.add(
              "spinning"
            );

            let ticks = 0;

            const timer =
              setInterval(() => {

                reel.textContent =
                  symbols[
                    random(
                      0,
                      symbols.length - 1
                    )
                  ];

                playSound("tick");

                ticks++;

                if (ticks >= 10 + index * 5) {

                  clearInterval(timer);

                  reel.classList.remove(
                    "spinning"
                  );

                }

              }, 75);

          }
        );


        setTimeout(() => {

          const roll =
            Math.random();

          let result;
          let multiplier = 0;

          if (roll < .012) {

            result =
              ["777", "777", "777"];

            multiplier = 100;

          } else if (roll < .045) {

            result =
              ["GOLD", "GOLD", "GOLD"];

            multiplier = 25;

          } else if (roll < .11) {

            result =
              ["BAR", "BAR", "BAR"];

            multiplier = 10;

          } else if (roll < .25) {

            result =
              ["◆", "◆", "◆"];

            multiplier = 5;

          } else if (roll < .38) {

            const symbol =
              symbols[
                random(
                  0,
                  symbols.length - 1
                )
              ];

            result =
              [symbol, symbol, symbol];

            multiplier = 2;

          } else {

            result = [
              symbols[
                random(0, 4)
              ],
              symbols[
                random(0, 4)
              ],
              symbols[
                random(0, 4)
              ]
            ];

          }


          reels.forEach(
            (reel, index) => {

              reel.textContent =
                result[index];

            }
          );


          const resultEl =
            $("#slotResult");


          if (multiplier > 0) {

            const reward =
              bet * multiplier;

            changeBalance(reward);

            registerWin(reward);

            resultEl.textContent =
              `WIN ×${multiplier}`;

            resultEl.classList.add(
              "win"
            );

            playSound(
              multiplier >= 25
                ? "bigwin"
                : "win"
            );

            openModal(
              multiplier >= 25
                ? "JACKPOT!"
                : "WINNER!",
              `+${formatNumber(
                reward
              )}`,
              `Комбинация ${result.join(
                " • "
              )} принесла ×${multiplier}.`,
              multiplier >= 25
            );

          } else {

            registerWin(0);

            resultEl.textContent =
              "TRY AGAIN";

            resultEl.classList.remove(
              "win"
            );

            playSound("lose");

            toast(
              "Комбинация не собрана"
            );
          }

          spinButton.disabled = false;

        }, 1450);

      }
    );
}


/* =========================================================
   2. ROULETTE
   ========================================================= */

function renderRoulette() {

  gameArea.innerHTML = `
    ${gameHeader(
      "EURO ROULETTE",
      "🎡 ROULETTE",
      "Выбери цвет и попробуй угадать результат."
    )}

      <div class="roulette-game">

        <div class="roulette-table">

          <div
            class="roulette-wheel"
            id="rouletteWheel"
          >

            <div class="roulette-number">
              0
            </div>

          </div>

          <div class="roulette-pointer">
            ▼
          </div>

        </div>

        <div class="roulette-controls">

          <div class="roulette-bet">
            <span>BET</span>
            <strong>50</strong>
          </div>

          <div class="color-bets">

            <button
              data-color="red"
              class="active"
            >
              🔴 RED
            </button>

            <button data-color="black">
              ⚫ BLACK
            </button>

            <button data-color="green">
              🟢 ZERO
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

      <div class="roulette-history">
        <span>HISTORY</span>
        <div id="rouletteHistory">
          <i>0</i>
          <i class="red">7</i>
          <i>18</i>
          <i class="red">32</i>
          <i>9</i>
        </div>
      </div>

    </div>
  `;


  let selected = "red";


  gameArea
    .querySelectorAll(
      "[data-color]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          selected =
            button.dataset.color;

          gameArea
            .querySelectorAll(
              "[data-color]"
            )
            .forEach(
              item =>
                item.classList.remove(
                  "active"
                )
            );

          button.classList.add(
            "active"
          );

          playSound("click");
        }
      );
    });


  $("#rouletteSpin")
    ?.addEventListener(
      "click",
      () => {

        const bet = 50;

        if (
          state.balance < bet
        ) {

          toast(
            "Недостаточно токенов"
          );

          return;
        }

        const button =
          $("#rouletteSpin");

        button.disabled = true;

        changeBalance(-bet);

        registerSpin();

        const wheel =
          $("#rouletteWheel");

        playSound("spin");

        wheel.classList.add(
          "spinning"
        );


        setTimeout(() => {

          wheel.classList.remove(
            "spinning"
          );


          const roll =
            Math.random();

          let result;

          if (roll < .47) {

            result = "red";

          } else if (
            roll < .94
          ) {

            result = "black";

          } else {

            result = "green";
          }


          const number =
            result === "green"
              ? 0
              : random(1, 36);


          const history =
            $("#rouletteHistory");


          if (history) {

            const item =
              document.createElement(
                "i"
              );

            item.textContent =
              number;

            if (result === "red") {
              item.classList.add(
                "red"
              );
            }

            history.prepend(item);

            while (
              history.children.length > 8
            ) {
              history.lastElementChild.remove();
            }
          }


          const win =
            result === selected;


          if (win) {

            const multiplier =
              result === "green"
                ? 35
                : 2;

            const reward =
              bet * multiplier;

            changeBalance(reward);

            registerWin(reward);

            openModal(
              "ROULETTE WIN",
              `+${formatNumber(
                reward
              )}`,
              `Выпало ${number}. ${result.toUpperCase()} выиграл.`,
              result === "green"
            );

          } else {

            registerWin(0);

            playSound("lose");

            toast(
              `Выпало ${number}. Попробуй ещё раз.`
            );
          }


          button.disabled = false;

        }, 2100);
      }
    );
}


/* =========================================================
   3. FORTUNE WHEEL
   ========================================================= */

function renderWheel() {

  const rewards = [
    0,
    50,
    100,
    150,
    250,
    500,
    1000,
    2500
  ];


  gameArea.innerHTML = `
    ${gameHeader(
      "FORTUNE WHEEL",
      "🎡 WHEEL OF FORTUNE",
      "Крути колесо и попробуй поймать крупный сектор."
    )}

      <div class="fortune-game">

        <div class="fortune-wheel-wrap">

          <div class="fortune-pointer">
            ▼
          </div>

          <div
            class="fortune-wheel"
            id="fortuneWheel"
          >

            ${rewards.map(
              (reward, i) => `
                <div class="fortune-sector sector-${i}">
                  <span>
                    ${reward === 0
                      ? "LOSE"
                      : "+" + reward}
                  </span>
                </div>
              `
            ).join("")}

            <div class="fortune-center">
              ◆
            </div>

          </div>

        </div>

        <button
          class="game-action"
          id="fortuneSpin"
        >
          SPIN — 50
        </button>

      </div>

    </div>
  `;


  $("#fortuneSpin")
    ?.addEventListener(
      "click",
      () => {

        const bet = 50;

        if (
          state.balance < bet
        ) {

          toast(
            "Недостаточно токенов"
          );

          return;
        }

        const button =
          $("#fortuneSpin");

        button.disabled = true;

        changeBalance(-bet);

        registerSpin();

        const wheel =
          $("#fortuneWheel");

        const sector =
          random(
            0,
            rewards.length - 1
          );

        const rotation =
          360 * 6 +
          sector *
            (360 / rewards.length) +
          random(-8, 8);


        playSound("spin");

        wheel.style.transform =
          `rotate(${rotation}deg)`;


        setTimeout(() => {

          const reward =
            rewards[sector];


          if (reward > 0) {

            changeBalance(reward);

            registerWin(reward);

            openModal(
              reward >= 1000
                ? "MEGA WIN!"
                : "FORTUNE WIN",
              `+${formatNumber(
                reward
              )}`,
              "Колесо остановилось на выигрышном секторе.",
              reward >= 1000
            );

          } else {

            registerWin(0);

            playSound("lose");

            toast(
              "Колесо остановилось на LOSE"
            );
          }


          button.disabled = false;

        }, 4200);
      }
    );
}


/* =========================================================
   4. GOLD CHESTS
   ========================================================= */

function renderChests() {

  gameArea.innerHTML = `
    ${gameHeader(
      "TREASURE ROOM",
      "💰 GOLD CHESTS",
      "Только один сундук может скрывать главный приз."
    )}

      <div class="chest-game">

        <div class="chest-pot">
          <span>CHEST POT</span>
          <strong>
            2 500
          </strong>
        </div>

        <div class="chest-row">

          <button
            class="open-chest"
            data-chest="0"
          >
            <span>◆</span>
            <small>CHEST I</small>
          </button>

          <button
            class="open-chest"
            data-chest="1"
          >
            <span>◆</span>
            <small>CHEST II</small>
          </button>

          <button
            class="open-chest"
            data-chest="2"
          >
            <span>◆</span>
            <small>CHEST III</small>
          </button>

        </div>

        <p class="game-note">
          Стоимость открытия: <strong>50</strong>
        </p>

      </div>

    </div>
  `;


  const buttons =
    gameArea.querySelectorAll(
      ".open-chest"
    );


  buttons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const cost = 50;

        if (
          state.balance < cost
        ) {

          toast(
            "Недостаточно токенов"
          );

          return;
        }

        buttons.forEach(
          b => b.disabled = true
        );

        changeBalance(-cost);

        registerSpin();

        playSound("click");

        button.classList.add(
          "opening"
        );


        setTimeout(() => {

          const roll =
            Math.random();

          let reward;

          if (roll < .02) {

            reward = 2500;

          } else if (roll < .08) {

            reward = 750;

          } else if (roll < .22) {

            reward = 300;

          } else if (roll < .55) {

            reward = 150;

          } else if (roll < .82) {

            reward = 75;

          } else {

            reward = 25;
          }


          changeBalance(reward);

          registerWin(reward);


          button.classList.add(
            "opened"
          );


          openModal(
            reward >= 750
              ? "TREASURE!"
              : "CHEST OPENED",
            `+${formatNumber(
              reward
            )}`,
            "В сундуке обнаружена виртуальная награда.",
            reward >= 750
          );


          buttons.forEach(
            b => b.disabled = false
          );

        }, 900);
      }
    );
  });
}


/* =========================================================
   5. GOLD SMASH
   ========================================================= */

function renderSmash() {

  gameArea.innerHTML = `
    ${gameHeader(
      "BREAK & WIN",
      "🔨 GOLD SMASH",
      "Разбей блок. Иногда внутри находится большой приз."
    )}

      <div class="smash-game">

        <div class="smash-meter">

          <span>
            JACKPOT CHANCE
          </span>

          <div>
            <i style="width: 32%"></i>
          </div>

          <small>
            32%
          </small>

        </div>

        <button
          class="smash-block"
          id="smashBlock"
        >

          <span class="smash-question">
            ?
          </span>

          <span class="smash-hammer">
            🔨
          </span>

        </button>

        <div class="smash-cost">
          BREAK COST
          <strong>25</strong>
        </div>

        <p>
          Нажми несколько раз,
          чтобы разбить золотой блок.
        </p>

      </div>

    </div>
  `;


  const block =
    $("#smashBlock");

  let hits = 0;

  const requiredHits =
    random(3, 6);


  block?.addEventListener(
    "click",
    () => {

      const cost = 25;


      if (hits === 0) {

        if (
          state.balance < cost
        ) {

          toast(
            "Недостаточно токенов"
          );

          return;
        }

        changeBalance(-cost);

        registerSpin();
      }


      hits++;

      playSound("click");

      block.classList.add(
        "hit"
      );

      setTimeout(() => {
        block.classList.remove(
          "hit"
        );
      }, 120);


      const progress =
        Math.min(
          100,
          hits /
          requiredHits *
          100
        );


      block.style.setProperty(
        "--smash-progress",
        `${progress}%`
      );


      if (
        hits >= requiredHits
      ) {

        block.classList.add(
          "broken"
        );

        setTimeout(() => {

          const roll =
            Math.random();

          let reward;

          if (roll < .015) {

            reward = 1500;

          } else if (roll < .06) {

            reward = 500;

          } else if (roll < .18) {

            reward = 250;

          } else if (roll < .45) {

            reward = 100;

          } else if (roll < .75) {

            reward = 50;

          } else {

            reward = 0;
          }


          if (reward > 0) {

            changeBalance(reward);

            registerWin(reward);

            openModal(
              reward >= 500
                ? "SMASH JACKPOT!"
                : "BLOCK BROKEN!",
              `+${formatNumber(
                reward
              )}`,
              "Ты разбил золотой блок и нашёл награду.",
              reward >= 500
            );

          } else {

            registerWin(0);

            playSound("lose");

            toast(
              "Внутри ничего нет..."
            );
          }


          setTimeout(() => {
            renderSmash();
          }, 1000);

        }, 400);
      }

    }
  );
}


/* =========================================================
   TOURNAMENT
   ========================================================= */

$("#tournamentButton")
  ?.addEventListener(
    "click",
    () => {

      playSound("click");

      openModal(
        "TOURNAMENT",
        `#${random(4, 48)}`,
        `Твои результаты: ${state.wins} побед, лучший выигрыш ${formatNumber(state.bestWin)}.`,
        false
      );
    }
  );


/* =========================================================
   START
   ========================================================= */

updateBalance();
updateSoundButtons();


/*
   Открываем слоты только если игровая
   область действительно существует.
*/

if (gameArea) {

  openGame("slots");

  document
    .querySelector(
      '.game-card[data-game="slots"]'
    )
    ?.classList.add(
      "selected",
      "active"
    );
}