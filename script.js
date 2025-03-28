const Ship = function (length) {
  let shipLength = length;

  let hitNumber = 0;
  let coordinates = [];

  const getHitNumber = () => hitNumber;
  const hit = () => hitNumber++;

  const isSunk = () => hitNumber >= shipLength;

  return { shipLength, hit, isSunk, coordinates, getHitNumber };
};

const Gameboard = function () {
  let board = Array(10)
    .fill(null)
    .map(() => Array(10).fill(0));
  let ships = [];
  let missedHits = new Set();
  let hits = new Set();

  const placeShip = (length, position, direction) => {
    let [x, y] = position;
    let ship = Ship(length);

    for (let i = 0; i <= ship.shipLength - 1; i++) {
      if (direction === "horizontal") {
        board[x][y + i] = 1;
        ship.coordinates.push([x, y + i]);
      } else {
        board[x + i][y] = 1;
        ship.coordinates.push([x + i, y]);
      }
    }
    ships.push(ship);
  };

  const receiveAttack = (position) => {
    let [x, y] = position;

    if (board[x][y] === 2 || board[x][y] === 3) {
      return "invalid";
    } else if (board[x][y] === 1) {
      let hitShipIndex = hitShip(position);
      if (hitShipIndex !== -1) {
        ships[hitShipIndex].hit();
        board[x][y] = 3;
        hits.add(`${x},${y}`);
        if (ships[hitShipIndex].isSunk()) {
          selectImpossiblePosition(ships[hitShipIndex]);
          return "sunk";
        }
        return true;
      }
    } else {
      missedHits.add(`${x},${y}`);
      board[x][y] = 2;
      return false;
    }
  };

  const selectImpossiblePosition = (ship) => {
    let steps = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [1, -1],
      [0, 1],
      [1, 0],
      [1, 1],
    ];

    ship.coordinates.forEach(([x, y]) => {
      steps.forEach(([dx, dy]) => {
        let newX = x + dx;
        let newY = y + dy;

        if (
          newX >= 0 &&
          newX < 10 &&
          newY >= 0 &&
          newY < 10 &&
          board[newX][newY] !== 3
        ) {
          missedHits.add(`${newX},${newY}`);
          board[newX][newY] = 2;
        }
      });
    });
  };

  const hitShip = (position) => {
    let [x, y] = position;
    return ships.findIndex((ship) =>
      ship.coordinates.some((coord) => coord[0] === x && coord[1] === y)
    );
  };

  const areShipsSunk = () => {
    return ships.every((ship) => ship.isSunk() === true);
  };

  const isValidPlacement = (x, y, length, orientation) => {
    if (orientation === "horizontal") {
      if (y + length > 10) return false;
    } else {
      if (x + length > 10) return false;
    }

    for (let i = -1; i <= length; i++) {
      for (let j = -1; j <= 1; j++) {
        let checkX, checkY;

        if (orientation === "horizontal") {
          checkX = x + j;
          checkY = y + i;
        } else {
          checkX = x + i;
          checkY = y + j;
        }

        if (checkX >= 0 && checkX < 10 && checkY >= 0 && checkY < 10) {
          if (board[checkX][checkY] !== 0) {
            return false;
          }
        }
      }
    }
    return true;
  };

  return {
    board,
    ships,
    receiveAttack,
    placeShip,
    missedHits,
    areShipsSunk,
    isValidPlacement,
  };
};

const Player = function (type, name = "Computer") {
  const playerType = type === "real" ? "real" : "computer";
  const playerName = name;
  const gameboard = Gameboard();

  return { playerType, playerName, gameboard };
};

export { Ship, Gameboard, Player };
