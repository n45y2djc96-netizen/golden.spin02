/* =========================================================
   GOLDEN SPIN
   Virtual-token casino game
   ========================================================= */

const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();

  try {
    tg.setHeaderColor("#080604");
    tg.setBackgroundColor("#080604");
  } catch (_) {}
}


/* =========================================================
   STATE
   ========================================================= */

const saved = JSON.parse(
  localStorage.getItem("golden_spin_state") || "null"
);

const state = saved || {
  balance: 12500,
  xp: 0,
  level: 1,

  sound: true,

  lastBonus: null,

  missionSpins: 0,
  missionWins: 0,
  missionGames: 0,

  gamesPlayed: 0,
  totalWins: 0,

  currentGame: "slots"
};


/* =========================================================
   HELPERS
   ========================================================= */

const $ = id => document.getElementById(id);

const gameArea = $("gameArea");
const toastEl = $("toast");
const modal = $("modal");

function money(value) {
  return Math.floor(value).toLocaleString("ru-RU");
}

function save() {
  localStorage.setItem(
    "golden_spin_state",
    JSON.stringify(state)
  );
}

function updateBalance() {
  $("balance").textContent = money(state.balance);
}

function toast(text) {

  toastEl.textContent = text;
  toastEl.classList.add("show");

  clearTimeout(toastEl.timer);

  toastEl.timer = setTimeout(() => {
    toastEl.classList.remove("show");
  }, 2200);
}


/* =========================================================
   AUDIO
   ========================================================= */

let audioContext = null;

function audio() {

  if (!state.sound) return null;

  try {

    if (!audioContext) {

      const Audio =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!Audio) return null;

      audioContext = new Audio();

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
  volume = .05
) {

  const ctx = audio();

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

  osc.stop(
    ctx.currentTime + duration
  );
}


function sound(name) {

  if (!state.sound) return;

  if (name === "click") {
    tone(520,.1,"sine",.045);
  }

  if (name === "spin") {

    tone(180,.35,"sawtooth",.025);

    setTimeout(() => {
      tone(260,.25,"sawtooth",.02);
    },120);

  }

  if (name === "win") {

    tone(620,.12,"triangle",.06);

    setTimeout(() => {
      tone(820,.15,"triangle",.06);
    },100);

    setTimeout(() => {
      tone(1100,.25,"triangle",.07);
    },210);

  }

  if (name === "bigwin") {

    [520,660,820,1050,1350].forEach(
      (frequency,index) => {

        setTimeout(() => {
          tone(
            frequency,
            .2,
            "triangle",
            .07
          );
        },index * 100);

      }
    );

  }

  if (name === "lose") {
    tone(180,.25,"sawtooth",.035);
  }

}


/* =========================================================
   BALANCE / XP
   ========================================================= */

function addBalance(amount) {

  state.balance += amount;

  if (state.balance < 0) {
    state.balance = 0;
  }

  updateBalance();
  save();
}


function addXP(amount) {

  state.xp += amount;

  let needed = state.level * 1000;

  while (state.xp >= needed) {

    state.xp -= needed;

    state.level++;

    toast(
      `Новый уровень: ${state.level}!`
    );

    sound("bigwin");

    needed = state.level * 1000;
  }

  updateProgress();
  save();
}


function updateProgress() {

  const needed =
    state.level * 1000;

  $("levelText").textContent =
    `LEVEL ${state.level}`;

  $("heroLevel").textContent =
    `LVL ${state.level}`;

  $("xpCurrent").textContent =
    state.xp;

  $("xpNeeded").textContent =
    needed;

  $("xpFill").style.width =
    `${Math.min(
      100,
      state.xp / needed * 100
    )}%`;

  $("missionSpins").textContent =
    Math.min(state.missionSpins,5);

  $("missionWins").textContent =
    Math.min(state.missionWins,500);

  $("missionGames").textContent =
    Math.min(state.missionGames,3);
}


/* =========================================================
   MODAL
   ========================================================= */

function showModal(
  title,
  value,
  text,
  big = false
) {

  $("modalTitle").textContent = title;
  $("modalValue").textContent = value;
  $("modalText").textContent = text;

  modal.classList.add("open");

  sound(
    big ? "bigwin" : "win"
  );
}


function closeModal() {
  modal.classList.remove("open");
}


$("modalButton").addEventListener(
  "click",
  closeModal
);

modal.addEventListener(
  "click",
  e => {

    if (e.target === modal) {
      closeModal();
    }

  }
);


/* =========================================================
   PROFILE
   ========================================================= */

$("profileButton").addEventListener(
  "click",
  () => {

    sound("click");

    const user =
      tg?.initDataUnsafe?.user;

    if (user) {

      const name =
        user.first_name || "Player";

      $("profileButton")
        .textContent =
        name[0].toUpperCase();

      toast(
        `Привет, ${name}!`
      );

    } else {

      toast(
        `Golden Player • Level ${state.level}`
      );

    }

  }
);


/* =========================================================
   SOUND
   ========================================================= */

function updateSound() {

  $("soundButton").textContent =
    state.sound
      ? "🔊"
      : "🔇";

}

$("soundButton").addEventListener(
  "click",
  () => {

    state.sound = !state.sound;

    save();
    updateSound();

    if (state.sound) {
      sound("click");
      toast("Звук включён");
    } else {
      toast("Звук выключен");
    }

  }
);


/* =========================================================
   VIP
   ========================================================= */

$("vipButton").addEventListener(
  "click",
  () => {

    sound("click");

    showModal(
      "VIP CLUB",
      "VIP",
      "VIP-прогресс и дополнительные награды можно подключить к аккаунту позже."
    );

  }
);


/* =========================================================
   DAILY BONUS
   ========================================================= */

$("dailyBonus").addEventListener(
  "click",
  () => {

    const today =
      new Date().toISOString().slice(0,10);

    if (state.lastBonus === today) {

      toast(
        "Бонус уже получен сегодня"
      );

      return;
    }

    state.lastBonus = today;

    addBalance(250);
    addXP(100);

    save();

    showModal(
      "DAILY REWARD",
      "+250",
      "Ежедневный бонус добавлен на баланс."
    );

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

        sound("click");

        document
          .querySelectorAll(".game-card")
          .forEach(
            c => c.classList.remove("active")
          );

        card.classList.add("active");

        openGame(
          card.dataset.game
        );

      }
    );

  });


$("heroPlay").addEventListener(
  "click",
  () => {

    sound("click");

    document
      .querySelector("#games")
      .scrollIntoView({
        behavior:"smooth"
      });

    setTimeout(
      () => openGame("slots"),
      450
    );

  }
);


function registerGame() {

  state.gamesPlayed++;
  state.missionGames++;

  if (state.missionGames === 3) {

    addBalance(100);

    toast(
      "Задание выполнено: +100"
    );

  }

  save();
  updateProgress();
}


/* =========================================================
   OPEN GAME
   ========================================================= */

function openGame(game) {

  state.currentGame = game;

  const renderers = {

    slots: renderSlots,
    roulette: renderRoulette,
    wheel: renderWheel,
    chests: renderChests,
    smash: renderSmash

  };

  if (renderers[game]) {

    renderers[game]();

    setTimeout(() => {

      gameArea.scrollIntoView({
        behavior:"smooth",
        block:"center"
      });

    },50);

  }

}


/* =========================================================
   SLOTS
   ========================================================= */

function renderSlots() {

  gameArea.innerHTML = `

    <div class="game-screen">

      <div class="game-head">

        <div>
          <span class="mini-label">
            GOLDEN JACKPOT
          </span>

          <h2>🎰 СЛОТЫ</h2>
        </div>

        <div class="game-status">
          777 = JACKPOT
        </div>

      </div>

      <div class="game-board">

        <div class="slot-machine">

          <div class="slot-reels">

            <div class="slot-reel">7</div>
            <div class="slot-reel">◆</div>
            <div class="slot-reel">7</div>

          </div>

          <div class="slot-message"
               id="slotMessage">
            Выбери ставку и крути
          </div>

          <div class="bet-panel">

            <span class="bet-label">
              СТАВКА
            </span>

            <div class="bet-buttons">

              <button
                class="active"
                data-slot-bet="25">
                25
              </button>

              <button
                data-slot-bet="50">
                50
              </button>

              <button
                data-slot-bet="100">
                100
              </button>

              <button
                data-slot-bet="250">
                250
              </button>

            </div>

          </div>

          <button
            class="game-action"
            id="slotSpin">
            SPIN
          </button>

        </div>

      </div>

    </div>
  `;


  let bet = 25;
  let spinning = false;

  const reels =
    document.querySelectorAll(
      ".slot-reel"
    );


  document
    .querySelectorAll("[data-slot-bet]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          bet =
            Number(
              button.dataset.slotBet
            );

          document
            .querySelectorAll(
              "[data-slot-bet]"
            )
            .forEach(
              b => b.classList.remove("active")
            );

          button.classList.add("active");

          sound("click");

        }
      );

    });


  $("slotSpin").addEventListener(
    "click",
    () => {

      if (spinning) return;

      if (state.balance < bet) {

        toast(
          "Недостаточно токенов"
        );

        sound("lose");

        return;
      }

      spinning = true;

      addBalance(-bet);

      state.missionSpins++;

      if (state.missionSpins === 5) {

        addBalance(100);

        toast(
          "Задание «5 спинов» выполнено!"
        );

      }

      addXP(20);

      save();
      updateProgress();

      sound("spin");

      reels.forEach(
        reel => reel.classList.add("spin")
      );

      $("slotMessage")
        .textContent =
        "Барабаны вращаются...";


      const symbols = [
        "7",
        "◆",
        "BAR",
        "GOLD",
        "★"
      ];

      const results = [];

      reels.forEach(
        (reel,index) => {

          setTimeout(
            () => {

              reel.classList.remove("spin");

              const result =
                symbols[
                  Math.floor(
                    Math.random() *
                    symbols.length
                  )
                ];

              reel.textContent =
                result;

              results.push(result);

            },
            800 + index * 500
          );

        }
      );


      setTimeout(
        () => {

          spinning = false;

          const [a,b,c] =
            reels;

          const values =
            [
              a.textContent,
              b.textContent,
              c.textContent
            ];


          let reward = 0;


          if (
            values[0] === "7" &&
            values[1] === "7" &&
            values[2] === "7"
          ) {

            reward = bet * 30;

          }

          else if (
            values.every(
              x => x === values[0]
            )
          ) {

            reward = bet * 12;

          }

          else if (
            values.filter(
              x => x === "7"
            ).length >= 2
          ) {

            reward = bet * 5;

          }

          else if (
            values.filter(
              x => x === "◆"
            ).length >= 2
          ) {

            reward = bet * 3;

          }


          if (reward > 0) {

            addBalance(reward);

            state.totalWins += reward;

            state.missionWins =
              Math.min(
                500,
                state.missionWins + reward
              );

            addXP(
              reward >= bet * 10
                ? 150
                : 60
            );

            save();
            updateProgress();

            $("slotMessage")
              .textContent =
              `WIN +${money(reward)}`;

            showModal(
              reward >= bet * 20
                ? "JACKPOT!"
                : "ВЫИГРЫШ!",
              `+${money(reward)}`,
              "Комбинация принесла награду.",
              reward >= bet * 20
            );

          } else {

            $("slotMessage")
              .textContent =
              "В этот раз мимо. Крути ещё!";

            sound("lose");

          }

          registerGame();

        },
        2400
      );

    }
  );

}


/* =========================================================
   ROULETTE
   ========================================================= */

function renderRoulette() {

  gameArea.innerHTML = `

    <div class="game-screen">

      <div class="game-head">

        <div>
          <span class="mini-label">
            EURO ROULETTE
          </span>

          <h2>🎲 РУЛЕТКА</h2>
        </div>

        <div class="game-status">
          0 = ×35
        </div>

      </div>

      <div class="roulette-layout">

        <div>

          <div
            class="roulette-wheel"
            id="rouletteWheel">

            <div class="roulette-pointer">
              ▼
            </div>

          </div>

        </div>

        <div>

          <div class="roulette-options">

            <button
              class="roulette-option active"
              data-roulette="red">
              🔴 КРАСНОЕ
            </button>

            <button
              class="roulette-option"
              data-roulette="black">
              ⚫ ЧЁРНОЕ
            </button>

            <button
              class="roulette-option"
              data-roulette="green">
              🟢 ZERO
            </button>

          </div>

          <div class="bet-panel">

            <span class="bet-label">
              СТАВКА
            </span>

            <div class="bet-buttons">

              <button
                class="active"
                data-roulette-bet="25">
                25
              </button>

              <button
                data-roulette-bet="50">
                50
              </button>

              <button
                data-roulette-bet="100">
                100
              </button>

            </div>

          </div>

          <button
            class="game-action"
            id="rouletteSpin">
            КРУТИТЬ РУЛЕТКУ
          </button>

        </div>

      </div>

    </div>
  `;


  let selected = "red";
  let bet = 25;
  let spinning = false;


  document
    .querySelectorAll("[data-roulette]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          selected =
            button.dataset.roulette;

          document
            .querySelectorAll(
              "[data-roulette]"
            )
            .forEach(
              b => b.classList.remove("active")
            );

          button.classList.add("active");

          sound("click");

        }
      );

    });


  document
    .querySelectorAll(
      "[data-roulette-bet]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          bet =
            Number(
              button.dataset.rouletteBet
            );

          document
            .querySelectorAll(
              "[data-roulette-bet]"
            )
            .forEach(
              b => b.classList.remove("active")
            );

          button.classList.add("active");

          sound("click");

        }
      );

    });


  $("rouletteSpin").addEventListener(
    "click",
    () => {

      if (spinning) return;

      if (state.balance < bet) {

        toast(
          "Недостаточно токенов"
        );

        return;
      }

      spinning = true;

      addBalance(-bet);
      addXP(20);

      sound("spin");

      const wheel =
        $("rouletteWheel");

      const resultRoll =
        Math.random();

      let result;

      if (resultRoll < .46) {
        result = "red";
      } else if (resultRoll < .92) {
        result = "black";
      } else {
        result = "green";
      }


      const rotation =
        1440 +
        Math.floor(
          Math.random() * 720
        );

      wheel.style.transform =
        `rotate(${rotation}deg)`;


      setTimeout(
        () => {

          spinning = false;

          let reward = 0;

          if (result === selected) {

            reward =
              result === "green"
                ? bet * 35
                : bet * 2;

          }


          if (reward > 0) {

            addBalance(reward);

            state.totalWins += reward;

            state.missionWins =
              Math.min(
                500,
                state.missionWins + reward
              );

            addXP(
              result === "green"
                ? 200
                : 60
            );

            showModal(
              result === "green"
                ? "ZERO!"
                : "РУЛЕТКА",
              `+${money(reward)}`,
              `Выпало: ${result === "red" ? "КРАСНОЕ" : result === "black" ? "ЧЁРНОЕ" : "ZERO"}.`
            );

          } else {

            toast(
              `Выпало: ${
                result === "red"
                  ? "КРАСНОЕ"
                  : result === "black"
                    ? "ЧЁРНОЕ"
                    : "ZERO"
              }`
            );

            sound("lose");

          }

          save();
          updateProgress();
          registerGame();

        },
        2800
      );

    }
  );

}


/* =========================================================
   FORTUNE WHEEL
   ========================================================= */

function renderWheel() {

  gameArea.innerHTML = `

    <div class="game-screen">

      <div class="game-head">

        <div>
          <span class="mini-label">
            FORTUNE WHEEL
          </span>

          <h2>🎡 КОЛЕСО УДАЧИ</h2>
        </div>

        <div class="game-status">
          LUCK
        </div>

      </div>

      <div class="fortune-wrap">

        <div style="position:relative">

          <div class="fortune-pointer">
            ▼
          </div>

          <div
            class="fortune-wheel"
            id="fortuneWheel">

            <span>◆</span>

          </div>

        </div>

        <div class="wheel-rewards">
          <span>0×</span>
          <span>1×</span>
          <span>2×</span>
          <span>3×</span>
          <span>5×</span>
          <span>8×</span>
          <span>10×</span>
          <span>20×</span>
        </div>

        <div class="bet-panel"
             style="justify-content:center">

          <span class="bet-label">
            СТАВКА
          </span>

          <div class="bet-buttons">

            <button
              class="active"
              data-wheel-bet="25">
              25
            </button>

            <button
              data-wheel-bet="50">
              50
            </button>

            <button
              data-wheel-bet="100">
              100
            </button>

          </div>

        </div>

        <button
          class="game-action"
          id="wheelSpin">
          SPIN WHEEL
        </button>

      </div>

    </div>
  `;


  let bet = 25;
  let spinning = false;


  document
    .querySelectorAll("[data-wheel-bet]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          bet =
            Number(
              button.dataset.wheelBet
            );

          document
            .querySelectorAll(
              "[data-wheel-bet]"
            )
            .forEach(
              b => b.classList.remove("active")
            );

          button.classList.add("active");

          sound("click");

        }
      );

    });


  $("wheelSpin").addEventListener(
    "click",
    () => {

      if (spinning) return;

      if (state.balance < bet) {

        toast(
          "Недостаточно токенов"
        );

        return;
      }

      spinning = true;

      addBalance(-bet);
      addXP(20);

      sound("spin");


      const multipliers =
        [0,1,2,3,5,8,10,20];

      const index =
        Math.floor(
          Math.random() *
          multipliers.length
        );

      const multiplier =
        multipliers[index];

      const wheel =
        $("fortuneWheel");


      const rotation =
        1440 +
        index * 45 +
        Math.floor(
          Math.random() * 30
        );


      wheel.style.transform =
        `rotate(${rotation}deg)`;


      setTimeout(
        () => {

          spinning = false;

          const reward =
            bet * multiplier;


          if (reward > 0) {

            addBalance(reward);

            state.totalWins += reward;

            state.missionWins =
              Math.min(
                500,
                state.missionWins + reward
              );

            addXP(
              multiplier >= 10
                ? 150
                : 50
            );

            showModal(
              multiplier >= 10
                ? "BIG WIN!"
                : "КОЛЕСО УДАЧИ",
              `+${money(reward)}`,
              `${multiplier}× ставки.`,
              multiplier >= 10
            );

          } else {

            toast(
              "Пустой сектор!"
            );

            sound("lose");

          }

          save();
          updateProgress();
          registerGame();

        },
        3000
      );

    }
  );

}


/* =========================================================
   CHESTS
   ========================================================= */

function renderChests() {

  gameArea.innerHTML = `

    <div class="game-screen">

      <div class="game-head">

        <div>
          <span class="mini-label">
            TREASURE ROOM
          </span>

          <h2>🧰 GOLD CHESTS</h2>
        </div>

        <div class="game-status">
          FIND THE GOLD
        </div>

      </div>

      <div class="chest-grid">

        <button
          class="chest"
          data-chest="0">

          <div class="chest-icon">
            🧰
          </div>

          <span>
            CHEST I
          </span>

        </button>

        <button
          class="chest"
          data-chest="1">

          <div class="chest-icon">
            🧰
          </div>

          <span>
            CHEST II
          </span>

        </button>

        <button
          class="chest"
          data-chest="2">

          <div class="chest-icon">
            🧰
          </div>

          <span>
            CHEST III
          </span>

        </button>

      </div>

      <p style="
        text-align:center;
        color:#817362;
        font-size:11px;
      ">
        Каждый сундук стоит 50 токенов
      </p>

    </div>
  `;


  let opened = false;


  document
    .querySelectorAll(".chest")
    .forEach(chest => {

      chest.addEventListener(
        "click",
        () => {

          if (opened) return;

          const cost = 50;

          if (state.balance < cost) {

            toast(
              "Недостаточно токенов"
            );

            return;
          }

          opened = true;

          addBalance(-cost);
          addXP(15);

          sound("click");

          chest.classList.add(
            "opened"
          );


          setTimeout(
            () => {

              const roll =
                Math.random();

              let reward;

              if (roll < .05) {
                reward = 1000;
              } else if (roll < .15) {
                reward = 500;
              } else if (roll < .35) {
                reward = 250;
              } else if (roll < .65) {
                reward = 100;
              } else {
                reward = 25;
              }


              if (reward > 0) {

                addBalance(reward);

                state.totalWins += reward;

                state.missionWins =
                  Math.min(
                    500,
                    state.missionWins + reward
                  );

                addXP(
                  reward >= 500
                    ? 120
                    : 35
                );

                showModal(
                  reward >= 500
                    ? "RARE TREASURE!"
                    : "СУНДУК ОТКРЫТ!",
                  `+${money(reward)}`,
                  "Ты нашёл виртуальную награду.",
                  reward >= 500
                );

              }

              save();
              updateProgress();
              registerGame();

              setTimeout(
                () => {
                  opened = false;
                },
                500
              );

            },
            700
          );

        }
      );

    });

}


/* =========================================================
   SMASH
   ========================================================= */

function renderSmash() {

  gameArea.innerHTML = `

    <div class="game-screen">

      <div class="game-head">

        <div>
          <span class="mini-label">
            BREAK & WIN
          </span>

          <h2>🔨 GOLD SMASH</h2>
        </div>

        <div class="game-status">
          25 TOKENS
        </div>

      </div>

      <p style="
        color:#887866;
        text-align:center;
        font-size:12px;
      ">
        Выбери блок. Один из них может
        скрывать большую награду.
      </p>

      <div class="smash-grid">

        <button
          class="smash-block"
          data-smash="0">
          ?
        </button>

        <button
          class="smash-block"
          data-smash="1">
          ?
        </button>

        <button
          class="smash-block"
          data-smash="2">
          ?
        </button>

        <button
          class="smash-block"
          data-smash="3">
          ?
        </button>

        <button
          class="smash-block"
          data-smash="4">
          ?
        </button>

        <button
          class="smash-block"
          data-smash="5">
          ?
        </button>

      </div>

    </div>
  `;


  let played = false;


  document
    .querySelectorAll(".smash-block")
    .forEach(block => {

      block.addEventListener(
        "click",
        () => {

          if (played) return;

          const cost = 25;

          if (state.balance < cost) {

            toast(
              "Недостаточно токенов"
            );

            return;
          }

          played = true;

          addBalance(-cost);
          addXP(10);

          sound("click");

          block.classList.add("hit");


          setTimeout(
            () => {

              const roll =
                Math.random();

              let reward;

              if (roll < .04) {
                reward = 750;
              } else if (roll < .12) {
                reward = 300;
              } else if (roll < .28) {
                reward = 150;
              } else if (roll < .55) {
                reward = 50;
              } else {
                reward = 0;
              }


              if (reward) {

                addBalance(reward);

                state.totalWins += reward;

                state.missionWins =
                  Math.min(
                    500,
                    state.missionWins + reward
                  );

                addXP(
                  reward >= 300
                    ? 100
                    : 30
                );

                showModal(
                  reward >= 300
                    ? "MEGA SMASH!"
                    : "БЛОК РАЗБИТ!",
                  `+${money(reward)}`,
                  "Ты нашёл виртуальную награду.",
                  reward >= 300
                );

              } else {

                toast(
                  "Пусто! Попробуй другой блок."
                );

                sound("lose");

              }

              save();
              updateProgress();
              registerGame();

              setTimeout(
                () => {

                  block.classList.remove(
                    "hit"
                  );

                  played = false;

                },
                500
              );

            },
            500
          );

        }
      );

    });

}


/* =========================================================
   INITIAL
   ========================================================= */

updateBalance();
updateProgress();
updateSound();
openGame("slots");