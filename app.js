(() => {

  const tg = window.Telegram?.WebApp;

  tg?.ready();
  tg?.expand();

  tg?.setHeaderColor?.("#170804");
  tg?.setBackgroundColor?.("#090504");


  const $ = (selector) =>
    document.querySelector(selector);


  const game = $("#game");
  const balanceElement = $("#balance");


  let balance =
    Number(
      localStorage.getItem("gs_balance")
    ) || 12550;


  let busy = false;


  let soundEnabled =
    localStorage.getItem("gs_sound") !== "0";


  let audio;


  const slotSymbols = [
    "🍋",
    "7️⃣",
    "⭐",
    "🍒",
    "💎",
    "🔔",
    "BAR"
  ];


  const slotPayout = {

    "💎💎💎": 12,

    "7️⃣7️⃣7️⃣": 10,

    "⭐⭐⭐": 8,

    "BARBARBAR": 7,

    "🍒🍒🍒": 6,

    "🍋🍋🍋": 5,

    "🔔🔔🔔": 4

  };


  function formatNumber(number) {

    return Math.max(
      0,
      Math.floor(number)
    ).toLocaleString("ru-RU");

  }


  function saveBalance() {

    localStorage.setItem(
      "gs_balance",
      String(balance)
    );

    balanceElement.textContent =
      formatNumber(balance);

  }


  function spend(amount) {

    if (balance < amount) {

      showToast(
        "Недостаточно токенов"
      );

      beep("bad");

      return false;
    }


    balance -= amount;

    saveBalance();

    return true;

  }


  function win(amount) {

    balance += amount;

    saveBalance();

  }


  function randomItem(array) {

    return array[
      Math.floor(
        Math.random() *
        array.length
      )
    ];

  }


  function showToast(text) {

    const toast =
      $("#toast");

    toast.textContent =
      text;

    toast.classList.add(
      "show"
    );

    clearTimeout(
      toast.timer
    );

    toast.timer =
      setTimeout(() => {

        toast.classList.remove(
          "show"
        );

      }, 2200);

  }


  /* SOUND */

  function beep(type = "click") {

    if (!soundEnabled)
      return;


    try {

      audio ||=
        new (
          window.AudioContext ||
          window.webkitAudioContext
        )();


      const oscillator =
        audio.createOscillator();


      const gain =
        audio.createGain();


      const now =
        audio.currentTime;


      const sounds = {

        click: [500, 0.05],

        spin: [170, 0.18],

        win: [740, 0.18],

        big: [980, 0.3],

        bad: [120, 0.22],

        open: [430, 0.14]

      };


      const sound =
        sounds[type] ||
        sounds.click;


      oscillator.frequency
        .setValueAtTime(
          sound[0],
          now
        );


      if (
        type === "win" ||
        type === "big"
      ) {

        oscillator.frequency
          .exponentialRampToValueAtTime(
            sound[0] * 1.5,
            now + sound[1]
          );

      }


      if (type === "spin") {

        oscillator.frequency
          .exponentialRampToValueAtTime(
            60,
            now + sound[1]
          );

      }


      gain.gain
        .setValueAtTime(
          0.0001,
          now
        );


      gain.gain
        .exponentialRampToValueAtTime(
          0.09,
          now + 0.01
        );


      gain.gain
        .exponentialRampToValueAtTime(
          0.0001,
          now + sound[1]
        );


      oscillator
        .connect(gain)
        .connect(audio.destination);


      oscillator.start();

      oscillator.stop(
        now +
        sound[1] +
        0.02
      );

    } catch (error) {

    }

  }


  /* NAVIGATION */

  function openGame(name) {

    document
      .querySelectorAll(".game-tab")
      .forEach(button => {

        button.classList.toggle(
          "active",
          button.dataset.game === name
        );

      });


    if (name === "slots")
      renderSlots();


    if (name === "roulette")
      renderRoulette();


    if (name === "wheel")
      renderWheel();


    if (name === "chests")
      renderChests();


    if (name === "smash")
      renderSmash();


    window.scrollTo({
      top: 170,
      behavior: "smooth"
    });

  }


  /* SLOTS */

  function renderSlots() {

    game.innerHTML = `

      <section class="game-card">

        <h1 class="game-title">
          🎰 СЛОТЫ
        </h1>

        <p class="sub">
          Крути барабаны и собирай комбинации
        </p>

        <div class="slot-machine">

          <div class="reels">

            <div class="reel" id="reel0">
              ${randomItem(slotSymbols)}
            </div>

            <div class="reel" id="reel1">
              ${randomItem(slotSymbols)}
            </div>

            <div class="reel" id="reel2">
              ${randomItem(slotSymbols)}
            </div>

          </div>

        </div>


        <div class="controls">

          <label class="bet-box">

            Ставка

            <select id="bet">

              <option value="50">
                50
              </option>

              <option value="100">
                100
              </option>

              <option value="250">
                250
              </option>

              <option value="500">
                500
              </option>

            </select>

            🪙

          </label>


          <button
            class="gold-btn big"
            id="spinButton"
          >
            SPIN
          </button>

        </div>


        <div
          class="result"
          id="slotResult"
        ></div>

      </section>

    `;


    $("#spinButton")
      .onclick =
      spinSlots;

  }


  async function spinSlots() {

    if (busy)
      return;


    const bet =
      Number(
        $("#bet").value
      );


    if (!spend(bet))
      return;


    busy = true;


    beep("spin");


    const reels = [

      $("#reel0"),

      $("#reel1"),

      $("#reel2")

    ];


    reels.forEach(
      reel =>
        reel.classList.add(
          "spin"
        )
    );


    const stopTimes = [
      850,
      1250,
      1650
    ];


    stopTimes.forEach(
      (time, index) => {

        setTimeout(() => {

          reels[index]
            .classList
            .remove("spin");


          reels[index]
            .textContent =
            randomItem(
              slotSymbols
            );

        }, time);

      }
    );


    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          1700
        )
    );


    const values =
      reels.map(
        reel =>
          reel.textContent
      );


    const combination =
      values.join("");


    let multiplier =
      slotPayout[
        combination
      ] || 0;


    if (
      !multiplier &&
      values.filter(
        value =>
          value === "💎"
      ).length >= 2
    ) {

      multiplier = 2;

    }


    const result =
      $("#slotResult");


    if (multiplier) {

      const prize =
        bet * multiplier;


      win(prize);


      result.className =
        "result win";


      result.textContent =
        `🎉 ВЫИГРЫШ +${formatNumber(prize)} 🪙`;


      beep(
        multiplier >= 8
          ? "big"
          : "win"
      );

    } else {

      result.className =
        "result lose";


      result.textContent =
        "Попробуй ещё раз";


      beep("bad");

    }


    busy = false;

  }


  /* ROULETTE */

  function renderRoulette() {

    game.innerHTML = `

      <section class="game-card">

        <h1 class="game-title">
          🎲 РУЛЕТКА
        </h1>

        <p class="sub">
          Ставка 100 🪙 · шанс выигрыша 35%
        </p>

        <div class="roulette-wrap">

          <div class="pointer"></div>

          <div
            class="roulette-wheel"
            id="rouletteWheel"
          ></div>

        </div>


        <div class="controls">

          <button
            class="gold-btn big"
            id="rouletteButton"
          >
            КРУТИТЬ · 100
          </button>

        </div>


        <div
          class="result"
          id="rouletteResult"
        ></div>

      </section>

    `;


    $("#rouletteButton")
      .onclick =
      spinRoulette;

  }


  function spinRoulette() {

    if (busy)
      return;


    if (!spend(100))
      return;


    busy = true;


    beep("spin");


    const wheel =
      $("#rouletteWheel");


    wheel.style.transform =
      `rotate(
        ${2160 + Math.random() * 360}deg
      )`;


    setTimeout(() => {

      const won =
        Math.random() < 0.35;


      const result =
        $("#rouletteResult");


      if (won) {

        win(200);


        result.className =
          "result win";


        result.textContent =
          "🎉 ПОБЕДА +200 🪙";


        beep("win");

      } else {

        result.className =
          "result lose";


        result.textContent =
          "Не повезло";


        beep("bad");

      }


      busy = false;

    }, 2900);

  }


  /* PRIZE WHEEL */

  function renderWheel() {

    game.innerHTML = `

      <section class="game-card">

        <h1 class="game-title">
          🎡 КОЛЕСО
        </h1>

        <p class="sub">
          Стоимость вращения 100 🪙
        </p>

        <div class="wheel-box">

          <div class="pointer"></div>

          <div
            class="prize-wheel"
            id="prizeWheel"
          >

            <span>
              0 · 50 · 100<br>
              150 · 250 · 500
            </span>

          </div>

        </div>


        <div class="controls">

          <button
            class="gold-btn big"
            id="wheelButton"
          >
            КРУТИТЬ · 100
          </button>

        </div>


        <div
          class="result"
          id="wheelResult"
        ></div>

      </section>

    `;


    $("#wheelButton")
      .onclick =
      spinPrizeWheel;

  }


  function spinPrizeWheel() {

    if (busy)
      return;


    if (!spend(100))
      return;


    busy = true;


    beep("spin");


    const prizes = [
      0,
      50,
      100,
      150,
      250,
      500
    ];


    const prize =
      randomItem(prizes);


    const index =
      prizes.indexOf(prize);


    $("#prizeWheel")
      .style.transform =
      `rotate(
        ${1800 +
          index * 60 +
          Math.random() * 45}deg
      )`;


    setTimeout(() => {

      const result =
        $("#wheelResult");


      if (prize) {

        win(prize);


        result.className =
          "result win";


        result.textContent =
          `🎁 ПРИЗ +${formatNumber(prize)} 🪙`;


        beep(
          prize >= 250
            ? "big"
            : "win"
        );

      } else {

        result.className =
          "result lose";


        result.textContent =
          "Выпало 0";


        beep("bad");

      }


      busy = false;

    }, 3000);

  }


  /* CHESTS */

  function renderChests() {

    game.innerHTML = `

      <section class="game-card">

        <h1 class="game-title">
          🧰 СУНДУКИ
        </h1>

        <p class="sub">
          Выбери один сундук · стоимость 100 🪙
        </p>


        <div class="chests">

          <button class="chest">
            🧰
            <small>
              СУНДУК 1
            </small>
          </button>

          <button class="chest">
            🧰
            <small>
              СУНДУК 2
            </small>
          </button>

          <button class="chest">
            🧰
            <small>
              СУНДУК 3
            </small>
          </button>

        </div>


        <div
          class="result"
          id="chestResult"
        ></div>

      </section>

    `;


    document
      .querySelectorAll(".chest")
      .forEach(
        chest =>
          chest.onclick =
            () =>
              openChest(chest)
      );

  }


  function openChest(chest) {

    if (busy)
      return;


    if (!spend(100))
      return;


    busy = true;


    chest.classList.add(
      "open"
    );


    beep("open");


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
        randomItem(prizes);


      const result =
        $("#chestResult");


      if (prize) {

        win(prize);


        result.className =
          "result win";


        result.textContent =
          `✨ В сундуке ${formatNumber(prize)} 🪙`;


        beep(
          prize >= 250
            ? "big"
            : "win"
        );

      } else {

        result.className =
          "result lose";


        result.textContent =
          "Сундук пуст";


        beep("bad");

      }


      busy = false;

    }, 550);

  }


  /* SMASH */

  function renderSmash() {

    game.innerHTML = `

      <section class="game-card">

        <h1 class="game-title">
          🔨 РАЗБИТЬ БЛОК
        </h1>

        <p class="sub">
          Каждый удар стоит 50 🪙
        </p>


        <div class="bricks">

          ${Array.from(
            { length: 12 },
            () =>
              `<button class="brick">
                🧱
              </button>`
          ).join("")}

        </div>


        <div
          class="result"
          id="smashResult"
        ></div>

      </section>

    `;


    document
      .querySelectorAll(".brick")
      .forEach(
        brick =>
          brick.onclick =
            () =>
              smashBrick(brick)
      );

  }


  function smashBrick(brick) {

    if (busy)
      return;


    if (
      brick.classList.contains(
        "hit"
      )
    )
      return;


    if (!spend(50))
      return;


    busy = true;


    brick.classList.add(
      "hit"
    );


    beep("click");


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
        randomItem(prizes);


      const result =
        $("#smashResult");


      if (prize) {

        win(prize);


        result.className =
          "result win";


        result.textContent =
          `💥 НАЙДЕНО +${formatNumber(prize)} 🪙`;


        beep(
          prize >= 100
            ? "big"
            : "win"
        );

      } else {

        result.className =
          "result lose";


        result.textContent =
          "Только осколки...";


        beep("bad");

      }


      busy = false;

    }, 350);

  }


  /* MENU */

  document
    .querySelectorAll(".game-tab")
    .forEach(
      button => {

        button.onclick =
          () => {

            beep("click");

            openGame(
              button.dataset.game
            );

          };

      }
    );


  $("#heroSpin").onclick =
    () => {

      beep("click");

      openGame("slots");

    };


  /* VIP */

  $("#vipBtn").onclick =
    () => {

      $("#modalTitle")
        .textContent =
        "👑 VIP";


      $("#modalText")
        .textContent =
        "VIP-раздел подготовлен как интерфейс. Покупки и денежные операции отключены в этой версии.";


      $("#modal")
        .classList
        .add("show");

    };


  $("#modalClose").onclick =
    () =>
      $("#modal")
        .classList
        .remove("show");


  $("#modalOk").onclick =
    () =>
      $("#modal")
        .classList
        .remove("show");


  /* SOUND */

  $("#soundToggle").onclick =
    () => {

      soundEnabled =
        !soundEnabled;


      localStorage.setItem(
        "gs_sound",
        soundEnabled
          ? "1"
          : "0"
      );


      $("#soundToggle")
        .textContent =
        soundEnabled
          ? "🔊"
          : "🔇";


      if (soundEnabled)
        beep("click");

    };


  if (!soundEnabled) {

    $("#soundToggle")
      .textContent =
      "🔇";

  }


  /* DAILY BONUS */

  $("#dailyBtn").onclick =
    () => {

      const today =
        new Date()
          .toISOString()
          .slice(0,10);


      const last =
        localStorage.getItem(
          "gs_daily"
        );


      if (last === today) {

        showToast(
          "Бонус уже забран сегодня"
        );

        return;

      }


      localStorage.setItem(
        "gs_daily",
        today
      );


      win(250);


      showToast(
        "🎁 +250 токенов"
      );


      beep("win");

    };


  saveBalance();

  renderSlots();

})();