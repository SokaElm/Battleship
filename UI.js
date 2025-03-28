import { Player } from "./script.js";

const showGame = function () {
  const name = prompt("What's your name?");
  const playerGameGrid = document.querySelector(".playerGameGrid");
  const playerAttackGrid = document.querySelector(".playerAttackGrid");
  const message = document.querySelector(".message");
  let realPlayer = Player("real", name);
  let computer = Player("computer");
  let shipContainer;
  let activePlayer = realPlayer;
  let divBoard = [];
  let placementResolver;
  let computerLastHit;

  const createGameGrid = async () => {
    playerGameGrid.innerHTML = "";
    playerAttackGrid.innerHTML = "";
    divBoard = [];

    for (let i = 0; i < 100; i++) {
      const div = document.createElement("div");
      const y = i % 10;
      const x = Math.floor(i / 10);

      div.id = i;

      playerGameGrid.appendChild(div);
      playerGameGrid.classList.add("grid-ready");
    }
    showGrids(realPlayer);

    message.textContent =
      "Place your ships (drag and drop, double click to change orientation)";
    await initShipPlacement();

    for (let i = 0; i < 100; i++) {
      const divAttackGrid = document.createElement("div");
      const y = i % 10;
      const x = Math.floor(i / 10);
      divAttackGrid.id = "%" + i;
      divBoard.push(divAttackGrid);
      playerAttackGrid.appendChild(divAttackGrid);
    }

    showGrids(computer);
    playerAttackGrid.classList.add("grid-ready");
    randomShipPlacement(computer);

    playRound();
    message.textContent = "Your turn, pick a cell";
  };

  const showGrids = (player) => {
    if (!player.gameboard.ships) return;

    player.gameboard.board.forEach((array, x) => {
      array.forEach((elem, y) => {
        let idNumber = x * 10 + y;
        let id = player === realPlayer ? idNumber : `%${idNumber}`;
        let div = document.getElementById(id);
        if (elem === 1) {
          div.classList.add("ship");
        } else if (elem === 2) {
          div.classList.add("missed");
        } else if (elem === 3) {
          div.classList.replace("ship", "hitship");
        }
      });
    });
  };

  const playRound = () => {
    playerAttackGrid.addEventListener("click", handlePlayerClick);
  };

  const handlePlayerClick = async (event) => {
    const div = event.target;
    if (!div || !div.id.startsWith("%")) return;
    if (activePlayer !== realPlayer) return;
    if (div.style.pointerEvents === "none") return;
    div.style.pointerEvents = "none";

    const idNumber = parseInt(div.id.slice(1));
    const y = idNumber % 10;
    const x = Math.floor(idNumber / 10);

    let result = computer.gameboard.receiveAttack([x, y]);

    if (result === "invalid") {
      divBoard.forEach((div) => (div.style.pointerEvents = "auto"));
      message.textContent = "Invalid, try again";
      return;
    }

    showGrids(computer);

    await new Promise((r) => setTimeout(r, 10));

    if (result === "sunk" && isGameOver(computer)) {
      return;
    }

    switchPlayerTurn();
    message.textContent = "Computer's turn.";
    await new Promise((resolve) => setTimeout(resolve, 500));
    result = await computerTurn();
    showGrids(realPlayer);

    if (result === "sunk" && isGameOver(realPlayer)) {
      return;
    }
    switchPlayerTurn();
    message.textContent = "Your turn, pick a cell.";
    divBoard.forEach((div) => (div.style.pointerEvents = "auto"));
  };

  const computerTurn = async () => {
    let x, y;

    let directions = {
      right: [0, 1],
      left: [0, -1],
      up: [-1, 0],
      down: [1, 0],
    };
    console.log();
    if (
      !computerLastHit ||
      computerLastHit.hit === "sunk" ||
      (computerLastHit.hit === false && computerLastHit.count === 0)
    ) {
      [x, y] = randomHit(realPlayer);
      computerLastHit = {
        line: x,
        col: y,
        hit: realPlayer.gameboard.receiveAttack([x, y]),
        next: null,
        count: 0,
      };
      return computerLastHit.hit;
    } else if (computerLastHit.hit === true && computerLastHit.count === 0) {
      for (const direction in directions) {
        let [dx, dy] = directions[direction];
        if (
          isValidHit(
            computerLastHit.line + dx,
            computerLastHit.col + dy,
            realPlayer
          )
        ) {
          x = computerLastHit.line + dx;
          y = computerLastHit.col + dy;
          computerLastHit = {
            line: x,
            col: y,
            hit: realPlayer.gameboard.receiveAttack([x, y]),
            next: direction,
            count: 1,
          };
          return computerLastHit.hit;
        }
      }
    } else if (computerLastHit.hit === false && computerLastHit.count === 1) {
      let opposite = getOpposite(computerLastHit.next);
      let [dx, dy] = directions[opposite];
      let oldx = computerLastHit.line + dx;
      let oldy = computerLastHit.col + dy;
      for (const direction in directions) {
        let [dx, dy] = directions[direction];
        if (isValidHit(oldx + dx, oldy + dy, realPlayer)) {
          x = oldx + dx;
          y = oldy + dy;

          computerLastHit = {
            line: x,
            col: y,
            hit: realPlayer.gameboard.receiveAttack([x, y]),
            next: direction,
            count: 1,
          };
          return computerLastHit.hit;
        }
      }
    } else if (computerLastHit.hit === true && computerLastHit.count >= 1) {
      let [dx, dy] = directions[computerLastHit.next];
      x = computerLastHit.line + dx;
      y = computerLastHit.col + dy;
      if (isValidHit(x, y, realPlayer)) {
        computerLastHit = {
          line: x,
          col: y,
          hit: realPlayer.gameboard.receiveAttack([x, y]),
          next: computerLastHit.next,
          count: 2,
        };
      } else {
        let opposite = getOpposite(computerLastHit.next);
        let [dx, dy] = directions[opposite];
        for (let i = 2; i <= 3; i++) {
          if (isValidHit(x, y, realPlayer)) {
            x = computerLastHit.line + i * dx;
            y = computerLastHit.col + i * dy;
            computerLastHit = {
              line: x,
              col: y,
              hit: realPlayer.gameboard.receiveAttack([x, y]),
              next: opposite,
              count: 2,
            };
            return;
          }
        }
      }
    } else if (computerLastHit.hit === false && computerLastHit.count > 1) {
      let opposite = getOpposite(computerLastHit.next);
      let [dx, dy] = directions[opposite];
      for (let i = 3; i <= 4; i++) {
        if (isValidHit(x, y, realPlayer)) {
          x = computerLastHit.line + i * dx;
          y = computerLastHit.col + i * dy;
          computerLastHit = {
            line: x,
            col: y,
            hit: realPlayer.gameboard.receiveAttack([x, y]),
            next: opposite,
            count: 2,
          };
          return computerLastHit.hit;
        }
      }
    }
  };

  const getOpposite = (direction) => {
    switch (direction) {
      case "right":
        return "left";
      case "left":
        return "right";
      case "up":
        return "down";
      case "down":
        return "up";
    }
  };

  const randomHit = (player) => {
    let x, y;
    do {
      x = Math.floor(Math.random() * 10);
      y = Math.floor(Math.random() * 10);
    } while (!isValidHit(x, y, player));
    return [x, y];
  };

  const isValidHit = (x, y, player) => {
    return (
      x >= 0 &&
      x < 10 &&
      y >= 0 &&
      y < 10 &&
      player.gameboard.board[x][y] !== 2 &&
      player.gameboard.board[x][y] !== 3
    );
  };

  const switchPlayerTurn = () => {
    activePlayer = activePlayer === realPlayer ? computer : realPlayer;
  };

  const isGameOver = (player) => {
    if (player.gameboard.areShipsSunk()) {
      message.id = "game-over";
      message.textContent = `Gameover. ${player.playerName} lost`;
      divBoard.forEach((div) => {
        div.style.pointerEvents = "none";
      });
      return true;
    } else {
      return false;
    }
  };

  const initShipPlacement = async () => {
    return new Promise((resolveShipPlacement) => {
      placementResolver = resolveShipPlacement;
      shipContainer = document.createElement("div");
      shipContainer.className = "ship-container";
      document.querySelector("body").appendChild(shipContainer);

      const shipTypes = [
        { length: 4, count: 1 },
        { length: 3, count: 2 },
        { length: 2, count: 3 },
        { length: 1, count: 4 },
      ];

      shipTypes.forEach((shipType) => {
        for (let i = 0; i < shipType.count; i++) {
          const ship = document.createElement("div");
          ship.className = "draggable-ship";
          ship.dataset.length = shipType.length;
          ship.dataset.orientation = "horizontal";

          for (let j = 0; j < shipType.length; j++) {
            const shipSegment = document.createElement("div");
            shipSegment.className = "ship-segment";
            ship.appendChild(shipSegment);
          }

          ship.setAttribute("draggable", true);
          ship.addEventListener("dragstart", handleDragStart);

          ship.addEventListener("dblclick", rotateShip);

          shipContainer.appendChild(ship);
        }
      });

      const cells = playerGameGrid.querySelectorAll("div");
      cells.forEach((cell) => {
        cell.addEventListener("dragover", handleDragOver);
        cell.addEventListener("drop", handleDrop);
      });
    });
  };

  function handleDragStart(e) {
    e.dataTransfer.setData(
      "text/plain",
      e.target.dataset.length + "," + e.target.dataset.orientation
    );
    this.classList.add("dragging");
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  const handleDrop = (e) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain").split(",");
    const shipLength = parseInt(data[0]);
    const orientation = data[1];

    const y = parseInt(e.target.id) % 10;
    const x = Math.floor(parseInt(e.target.id) / 10);
    const draggingElement = document.querySelector(".dragging");
    if (!draggingElement) return;
    const draggingClass = draggingElement.classList;

    if (realPlayer.gameboard.isValidPlacement(x, y, shipLength, orientation)) {
      realPlayer.gameboard.placeShip(shipLength, [x, y], orientation);
      showGrids(realPlayer);

      draggingElement.remove();

      const remainingShips = document.querySelectorAll(".draggable-ship");
      if (remainingShips.length === 0) {
        shipContainer.remove();

        if (placementResolver) {
          placementResolver();
        }
      }
    } else {
      draggingClass.remove("dragging");
    }
  };

  const rotateShip = (e) => {
    const ship = e.currentTarget;
    const newOrientation =
      ship.dataset.orientation === "horizontal" ? "vertical" : "horizontal";
    ship.dataset.orientation = newOrientation;

    if (newOrientation === "vertical") {
      ship.style.flexDirection = "column";
    } else {
      ship.style.flexDirection = "row";
    }
  };

  const randomShipPlacement = (player) => {
    let gameboard =
      player === realPlayer ? realPlayer.gameboard : computer.gameboard;

    const shipTypes = [
      { length: 4, count: 1 },
      { length: 3, count: 2 },
      { length: 2, count: 3 },
      { length: 1, count: 4 },
    ];

    let x, y, orientation;

    shipTypes.forEach((shipType) => {
      for (let i = 0; i < shipType.count; i++) {
        do {
          x = Math.floor(Math.random() * 10);
          y = Math.floor(Math.random() * 10);
          orientation =
            Math.floor(Math.random() * 2) === 0 ? "vertical" : "horizontal";
        } while (
          !gameboard.isValidPlacement(x, y, shipType.length, orientation)
        );
        gameboard.placeShip(shipType.length, [x, y], orientation);
      }
    });
  };

  return { createGameGrid };
};

const startGameButton = document.getElementById("start");

startGameButton.addEventListener("click", () => {
  const game = showGame();
  game.createGameGrid();
});
