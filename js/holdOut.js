const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const miniMap = document.getElementById("miniMap");
const miniMapCtx = miniMap.getContext("2d");
const killsDisplay = document.getElementById("kills");
const bossDisplay = document.getElementById("boss");
const gameOverDisplay = document.getElementById("gameOver");
const heartsContainer = document.getElementById("hearts");
const restartBtn = document.getElementById("restartBtn");
const powerupTimer = document.getElementById("powerupTimer");

// Размеры игрового мира
const worldSize = 10000;
const cellSize = 55;
const cols = Math.floor(worldSize / cellSize);
const rows = Math.floor(worldSize / cellSize);

// Игрок
const player = {
  x: worldSize / 2,
  y: worldSize / 2,
  width: 36,
  height: 36,
  speed: 3,
  angle: 0,
  turretAngle: 0,
  health: 5,
  maxHealth: 5,
  lastShot: 500,
  shotDelay: 500,
  color: "green",
  powerup: null,
  powerupEndTime: 0,
};

// Вражеские танки
let enemies = [];
const maxEnemies = 50;
let kills = 0;
let bossKills = 0;
let bossLevel = 0;
let bossActive = false;
const BOSS_THRESHOLDS = [10, 25, 45, 70, 100];
let bossSpawnedForThresholds = [false, false, false, false, false];

// Пули
let bullets = [];

// Мины
let mines = [];
const maxMines = 20;
let mineSpawnTime = 0;
const mineSpawnDelay = 5000;

// Дополнительные жизни
let healthPacks = [];
const maxHealthPacks = 10;
let healthPackSpawnTime = 0;
const healthPackSpawnDelay = 10000;

// Улучшения
let powerups = [];
const maxPowerups = 10;
let powerupSpawnTime = 0;
const powerupSpawnDelay = 15000;

// Лабиринт
let maze = [];
const wallProbability = 0.1;

// Управление
const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
};

// Переменные для джойстиков
let moveJoystickActive = false;
let moveJoystickX = 0;
let moveJoystickY = 0;
let moveJoystickStartX = 0;
let moveJoystickStartY = 0;
let moveJoystickTouchId = null;

let aimJoystickActive = false;
let aimJoystickX = 0;
let aimJoystickY = 0;
let aimJoystickStartX = 0;
let aimJoystickStartY = 0;
let aimJoystickTouchId = null;

// Проверка фокуса окна
let isWindowFocused = true;
window.addEventListener("focus", () => {
  isWindowFocused = true;
});
window.addEventListener("blur", () => {
  isWindowFocused = false;
});

// Типы вражеских танков
const ENEMY_TYPES = {
  BASIC: {
    speed: 1.5,
    health: 5,
    shotDelay: 1500,
    color: "red",
    radius: 4,
  },
  FAST: {
    speed: 3,
    health: 3,
    shotDelay: 1000,
    color: "darkviolet",
    radius: 3,
  },
  SUPERFAST: {
    speed: 5,
    health: 2,
    shotDelay: 3000,
    color: "purple",
    radius: 3,
  },
  WHEELWRIGHT: {
    speed: 8,
    health: 1,
    shotDelay: 3000,
    color: "white",
    radius: 3,
  },
  HEAVY: {
    speed: 1,
    health: 7,
    shotDelay: 2000,
    color: "yellow",
    radius: 5,
  },
  SUPERHEAVY: {
    speed: 0.7,
    health: 10,
    shotDelay: 2000,
    color: "orange",
    radius: 5,
  },
  SNIPER: {
    speed: 1.2,
    health: 4,
    shotDelay: 3000,
    color: "blue",
    radius: 3,
  },
  SUPERSNIPER: {
    speed: 1.1,
    health: 3,
    shotDelay: 5000,
    color: "darkblue",
    radius: 3,
  },
};
// Типы улучшений
const POWERUP_TYPES = {
  SHIELD: {
    color: "#2196F3",
    duration: 30000,
    effect: "shield",
  },
  SPEED: {
    color: "#4CAF50",
    duration: 20000,
    effect: "speed",
  },
  RAPID_FIRE: {
    color: "#FF5722",
    duration: 30000,
    effect: "rapid_fire",
  },
};

// Типы боссов
const BOSS_TYPES = {
  BOSS1: {
    speed: 0.5,
    health: 20,
    shotDelay: 500,
    color: "black",
    radius: 10,
    width: 50,
    height: 50,
  },
  BOSS2: {
    speed: 0.5,
    health: 35,
    shotDelay: 350,
    color: "black",
    radius: 10,
    width: 50,
    height: 50,
  },
  BOSS3: {
    speed: 0.5,
    health: 55,
    shotDelay: 200,
    color: "black",
    radius: 10,
    width: 50,
    height: 50,
  },
  BOSS4: {
    speed: 0.5,
    health: 70,
    shotDelay: 100,
    color: "black",
    radius: 10,
    width: 50,
    height: 50,
  },
  BOSS5: {
    speed: 0.5,
    health: 100,
    shotDelay: 50,
    color: "black",
    radius: 10,
    width: 50,
    height: 50,
  },
};

// Мобильное управление
function setupMobileControls() {
  const moveJoystick = document.getElementById("moveJoystick");
  const moveKnob = document.getElementById("moveKnob");
  const aimJoystick = document.getElementById("aimJoystick");
  const aimKnob = document.getElementById("aimKnob");

  // Move joystick
  moveJoystick.addEventListener("touchstart", handleMoveStart);
  moveJoystick.addEventListener("mousedown", handleMoveStart);
  document.addEventListener("touchmove", handleMoveMove);
  document.addEventListener("mousemove", handleMoveMove);
  document.addEventListener("touchend", handleMoveEnd);
  document.addEventListener("mouseup", handleMoveEnd);

  // Aim joystick
  aimJoystick.addEventListener("touchstart", handleAimStart);
  aimJoystick.addEventListener("mousedown", handleAimStart);
  document.addEventListener("touchmove", handleAimMove);
  document.addEventListener("mousemove", handleAimMove);
  document.addEventListener("touchend", handleAimEnd);
  document.addEventListener("mouseup", handleAimEnd);

  function handleMoveStart(e) {
    if (moveJoystickActive) return;

    e.preventDefault();
    const rect = moveJoystick.getBoundingClientRect();
    moveJoystickStartX = rect.left + rect.width / 2;
    moveJoystickStartY = rect.top + rect.height / 2;
    moveJoystickActive = true;

    if (e.touches) {
      moveJoystickTouchId = e.touches[e.touches.length - 1].identifier;
    }

    updateMoveJoystick(e);
  }

  function handleMoveMove(e) {
    if (!moveJoystickActive) return;

    // Для тач-событий проверяем идентификатор касания
    if (e.touches) {
      let touchFound = false;
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === moveJoystickTouchId) {
          touchFound = true;
          updateMoveJoystick(e.touches[i]);
          break;
        }
      }
      if (!touchFound) return;
    } else {
      updateMoveJoystick(e);
    }
  }

  function handleMoveEnd(e) {
    if (!moveJoystickActive) return;

    // Для тач-событий проверяем идентификатор касания
    if (e.changedTouches) {
      let touchFound = false;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === moveJoystickTouchId) {
          touchFound = true;
          break;
        }
      }
      if (!touchFound) return;
    }

    moveJoystickActive = false;
    moveJoystickTouchId = null;
    moveJoystickX = 0;
    moveJoystickY = 0;
    moveKnob.style.transform = "translate(0px, 0px)";
  }

  function updateMoveJoystick(e) {
    const clientX = e.touches ? e.clientX : e.clientX;
    const clientY = e.touches ? e.clientY : e.clientY;

    const dx = clientX - moveJoystickStartX;
    const dy = clientY - moveJoystickStartY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const radius = 50;

    if (distance > radius) {
      moveJoystickX = (dx / distance) * radius;
      moveJoystickY = (dy / distance) * radius;
    } else {
      moveJoystickX = dx;
      moveJoystickY = dy;
    }

    moveKnob.style.transform = `translate(${moveJoystickX}px, ${moveJoystickY}px)`;
  }

  function handleAimStart(e) {
    if (aimJoystickActive) return;

    e.preventDefault();
    const rect = aimJoystick.getBoundingClientRect();
    aimJoystickStartX = rect.left + rect.width / 2;
    aimJoystickStartY = rect.top + rect.height / 2;
    aimJoystickActive = true;

    if (e.touches) {
      aimJoystickTouchId = e.touches[e.touches.length - 1].identifier;
    }

    updateAimJoystick(e);
  }

  function handleAimMove(e) {
    if (!aimJoystickActive) return;

    // Для тач-событий проверяем идентификатор касания
    if (e.touches) {
      let touchFound = false;
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === aimJoystickTouchId) {
          touchFound = true;
          updateAimJoystick(e.touches[i]);
          break;
        }
      }
      if (!touchFound) return;
    } else {
      updateAimJoystick(e);
    }
  }

  function handleAimEnd(e) {
    if (!aimJoystickActive) return;

    // Для тач-событий проверяем идентификатор касания
    if (e.changedTouches) {
      let touchFound = false;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === aimJoystickTouchId) {
          touchFound = true;
          break;
        }
      }
      if (!touchFound) return;
    }

    aimJoystickActive = false;
    aimJoystickTouchId = null;
    aimJoystickX = 0;
    aimJoystickY = 0;
    aimKnob.style.transform = "translate(0px, 0px)";
  }

  function updateAimJoystick(e) {
    const clientX = e.touches ? e.clientX : e.clientX;
    const clientY = e.touches ? e.clientY : e.clientY;

    const dx = clientX - aimJoystickStartX;
    const dy = clientY - aimJoystickStartY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const radius = 50;

    if (distance > radius) {
      aimJoystickX = (dx / distance) * radius;
      aimJoystickY = (dy / distance) * radius;
    } else {
      aimJoystickX = dx;
      aimJoystickY = dy;
    }

    aimKnob.style.transform = `translate(${aimJoystickX}px, ${aimJoystickY}px)`;

    // Update turret angle
    player.turretAngle = Math.atan2(aimJoystickY, aimJoystickX);

    // Fire when reaching edge
    if (distance > radius * 0.8) {
      fire();
    }
  }
}

function fire() {
  if (player.health <= 0) return false;

  const now = Date.now();
  let shotDelay = player.shotDelay;

  if (player.powerup === "rapid_fire") {
    shotDelay = shotDelay / 2;
  }

  if (now - player.lastShot > shotDelay) {
    const bulletX = player.x + Math.cos(player.turretAngle) * 25;
    const bulletY = player.y + Math.sin(player.turretAngle) * 25;
    bullets.push({
      x: bulletX,
      y: bulletY,
      angle: player.turretAngle,
      speed: 10,
      radius: 6,
      color: "#2196F3",
      isPlayer: true,
    });
    player.lastShot = now;
    return true;
  }
  return false;
}

// Обновление отображения жизней
function updateHearts() {
  heartsContainer.innerHTML = "";
  for (let i = 0; i < player.maxHealth; i++) {
    const heart = document.createElement("div");
    heart.className = "heart";
    heart.style.opacity = i < player.health ? "1" : "0.3";
    heartsContainer.appendChild(heart);
  }
}

// Генерация лабиринта с разрушаемыми стенами
function generateMaze() {
  maze = [];
  for (let i = 0; i < rows; i++) {
    maze[i] = [];
    for (let j = 0; j < cols; j++) {
      const distToCenter = Math.sqrt(
        Math.pow(i - rows / 2, 2) + Math.pow(j - cols / 2, 2)
      );
      if (distToCenter < 8) {
        maze[i][j] = 0;
      } else {
        maze[i][j] = Math.random() < wallProbability ? { health: 10 } : 0;
      }
    }
  }
}
// Проверка столкновения со стенами
function checkWallCollision(x, y, width, height) {
  const leftCol = Math.floor((x - width / 2) / cellSize);
  const rightCol = Math.floor((x + width / 2) / cellSize);
  const topRow = Math.floor((y - height / 2) / cellSize);
  const bottomRow = Math.floor((y + height / 2) / cellSize);

  if (leftCol < 0 || rightCol >= cols || topRow < 0 || bottomRow >= rows) {
    return true;
  }

  for (let row = topRow; row <= bottomRow; row++) {
    for (let col = leftCol; col <= rightCol; col++) {
      if (maze[row][col] !== 0) {
        return true;
      }
    }
  }
  return false;
}

function checkHealthPackCollision(x, y, radius = 20) {
  for (const pack of healthPacks) {
    const dist = Math.sqrt(Math.pow(x - pack.x, 2) + Math.pow(y - pack.y, 2));
    if (dist < radius + pack.radius) {
      return true;
    }
  }
  return false;
}

function checkMineCollision(x, y, radius = 20) {
  for (const mine of mines) {
    const dist = Math.sqrt(Math.pow(x - mine.x, 2) + Math.pow(y - mine.y, 2));
    if (dist < radius + mine.radius) {
      return mine;
    }
  }
  return null;
}

function checkPowerupCollision(x, y, radius = 20) {
  for (const powerup of powerups) {
    const dist = Math.sqrt(
      Math.pow(x - powerup.x, 2) + Math.pow(y - powerup.y, 2)
    );
    if (dist < radius + powerup.radius) {
      return powerup;
    }
  }
  return null;
}

function checkHealthPackPickup() {
  for (let i = healthPacks.length - 1; i >= 0; i--) {
    const pack = healthPacks[i];
    const distToPlayer = Math.sqrt(
      Math.pow(pack.x - player.x, 2) + Math.pow(pack.y - player.y, 2)
    );

    if (distToPlayer < 80 && player.health < player.maxHealth) {
      player.health = Math.min(player.maxHealth, player.health + 1);
      updateHearts();
      healthPacks.splice(i, 1);
    }
  }
}

function checkPowerupPickup() {
  for (let i = powerups.length - 1; i >= 0; i--) {
    const powerup = powerups[i];
    const distToPlayer = Math.sqrt(
      Math.pow(powerup.x - player.x, 2) + Math.pow(powerup.y - player.y, 2)
    );

    if (distToPlayer < player.width / 2 + powerup.radius) {
      player.powerup = powerup.type.effect;
      player.powerupEndTime = Date.now() + powerup.type.duration;
      powerupTimer.style.display = "block";
      powerupTimer.textContent = `Улучшение: ${powerup.type.effect.replace(
        "_",
        " "
      )}`;

      if (powerup.type.effect === "speed") {
        player.speed = 5;
      } else if (powerup.type.effect === "rapid_fire") {
        player.shotDelay = 250;
      }

      powerups.splice(i, 1);
    }
  }
}

function checkEnemyCollision(x, y, width, height) {
  for (const enemy of enemies) {
    const dist = Math.sqrt(Math.pow(x - enemy.x, 2) + Math.pow(y - enemy.y, 2));
    if (dist < width / 2 + enemy.width / 2) {
      return true;
    }
  }
  return false;
}

function createEnemy(isBoss = false) {
  if (enemies.length >= maxEnemies && !isBoss) return;

  let x, y;
  let validPosition = false;
  let attempts = 0;
  const maxAttempts = 100;

  while (!validPosition && attempts < maxAttempts) {
    if (isBoss) {
      x = worldSize / 2;
      y = worldSize / 2;
    } else {
      x = Math.random() * (worldSize - 200) + 100;
      y = Math.random() * (worldSize - 200) + 100;
    }

    const distToPlayer = Math.sqrt(
      Math.pow(x - player.x, 2) + Math.pow(y - player.y, 2)
    );

    if (
      distToPlayer > (isBoss ? 300 : 150) &&
      !checkWallCollision(x, y, isBoss ? 50 : 36, isBoss ? 50 : 36) &&
      !checkHealthPackCollision(x, y) &&
      !checkMineCollision(x, y) &&
      !checkPowerupCollision(x, y)
    ) {
      validPosition = true;
    }
    attempts++;
  }

  if (!validPosition) return;

  if (isBoss) {
    const bossType = `BOSS${bossLevel}`;
    const bossStats = BOSS_TYPES[bossType];
    enemies.push({
      x: x,
      y: y,
      width: bossStats.width,
      height: bossStats.height,
      speed: bossStats.speed,
      angle: Math.random() * Math.PI * 2,
      turretAngle: 0,
      health: bossStats.health,
      maxHealth: bossStats.health,
      lastShot: 0,
      shotDelay: bossStats.shotDelay,
      color: bossStats.color,
      changeDirectionTime: 0,
      changeDirectionDelay: 1000 + Math.random() * 2000,
      isBoss: true,
      bossLevel: bossLevel,
      radius: bossStats.radius,
    });
    bossActive = true;
  } else {
    const enemyTypes = Object.keys(ENEMY_TYPES);
    const randomType =
      enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    const type = ENEMY_TYPES[randomType];
    enemies.push({
      x: x,
      y: y,
      width: 36,
      height: 36,
      speed: type.speed,
      angle: Math.random() * Math.PI * 2,
      turretAngle: 0,
      health: type.health,
      maxHealth: type.health,
      lastShot: 0,
      shotDelay: type.shotDelay,
      color: type.color,
      changeDirectionTime: 0,
      changeDirectionDelay: 1000 + Math.random() * 2000,
      type: randomType,
      radius: type.radius,
    });
  }
}

function createHealthPack(x, y) {
  if (healthPacks.length >= maxHealthPacks) return;

  healthPacks.push({
    x: x,
    y: y,
    radius: 15,
    color: "#FF4081",
  });
}

function createMine(x, y) {
  if (mines.length >= maxMines) return;

  mines.push({
    x: x,
    y: y,
    radius: 12,
    color: "#FFEB3B",
    active: true,
  });
}

function createPowerup(x, y) {
  if (powerups.length >= maxPowerups) return;

  const powerupTypes = Object.keys(POWERUP_TYPES);
  const randomType =
    powerupTypes[Math.floor(Math.random() * powerupTypes.length)];

  powerups.push({
    x: x,
    y: y,
    radius: 15,
    color: POWERUP_TYPES[randomType].color,
    type: POWERUP_TYPES[randomType],
  });
}

function explodeMine(mine, triggeredByBullet = false) {
  if (!mine.active) return;

  const mineIndex = mines.indexOf(mine);
  if (mineIndex !== -1) {
    mines.splice(mineIndex, 1);
  }

  const distToPlayer = Math.sqrt(
    Math.pow(mine.x - player.x, 2) + Math.pow(mine.y - player.y, 2)
  );
  if (distToPlayer < cellSize * 20 && player.health > 0) {
    player.health--;
    updateHearts();
    if (player.health <= 0) {
      gameOver();
    }
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    const distToEnemy = Math.sqrt(
      Math.pow(mine.x - enemy.x, 2) + Math.pow(mine.y - enemy.y, 2)
    );
    if (distToEnemy < cellSize * 3) {
      enemy.health--;
      if (enemy.health <= 0) {
        enemies.splice(i, 1);
        kills++;
        killsDisplay.textContent = kills;
      }
    }
  }

  const centerCol = Math.floor(mine.x / cellSize);
  const centerRow = Math.floor(mine.y / cellSize);
  const radius = 1;

  for (let row = centerRow - radius; row <= centerRow + radius; row++) {
    for (let col = centerCol - radius; col <= centerCol + radius; col++) {
      if (
        row >= 0 &&
        row < rows &&
        col >= 0 &&
        col < cols &&
        maze[row][col] !== 0
      ) {
        maze[row][col] = 0;
      }
    }
  }

  if (triggeredByBullet) {
    bullets.push({
      x: mine.x,
      y: mine.y,
      angle: 0,
      speed: 0,
      radius: cellSize * 20,
      color: "rgba(255, 165, 0, 0.5)",
      isPlayer: true,
      isExplosion: true,
      lifeTime: 100,
    });
  }
}

function updateEnemies() {
  const now = Date.now();

  // Проверяем пороги для боссов
  for (let i = 0; i < BOSS_THRESHOLDS.length; i++) {
    if (
      kills >= BOSS_THRESHOLDS[i] &&
      !bossSpawnedForThresholds[i] &&
      !bossActive
    ) {
      bossLevel = i + 1;
      createEnemy(true);
      bossSpawnedForThresholds[i] = true;
      bossActive = true;
      break;
    }
  }

  if (enemies.length < maxEnemies && Math.random() < 0.05) {
    createEnemy();
  }

  enemies.forEach((enemy) => {
    if (now - enemy.changeDirectionTime > enemy.changeDirectionDelay) {
      enemy.angle = Math.random() * Math.PI * 2;
      enemy.changeDirectionTime = now;
      enemy.changeDirectionDelay = 1000 + Math.random() * 2000;
    }

    const newX = enemy.x + Math.cos(enemy.angle) * enemy.speed;
    const newY = enemy.y + Math.sin(enemy.angle) * enemy.speed;

    const mine = checkMineCollision(newX, newY, enemy.width / 2);
    if (mine) {
      explodeMine(mine);
    }

    if (
      !checkWallCollision(newX, newY, enemy.width, enemy.height) &&
      !checkHealthPackCollision(newX, newY) &&
      !mine
    ) {
      enemy.x = newX;
      enemy.y = newY;
    } else {
      enemy.angle = Math.random() * Math.PI * 2;
    }

    let canShoot = true;
    if (enemy.type === "SNIPER") {
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      const steps = dist / cellSize;
      for (let i = 1; i < steps; i++) {
        const checkX = enemy.x + Math.cos(angle) * i * cellSize;
        const checkY = enemy.y + Math.sin(angle) * i * cellSize;
        const col = Math.floor(checkX / cellSize);
        const row = Math.floor(checkY / cellSize);

        if (
          row >= 0 &&
          row < rows &&
          col >= 0 &&
          col < cols &&
          maze[row][col] !== 0
        ) {
          canShoot = false;
          break;
        }
      }
    }

    if (canShoot) {
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      enemy.turretAngle = Math.atan2(dy, dx);

      if (now - enemy.lastShot > enemy.shotDelay) {
        const bulletX = enemy.x + Math.cos(enemy.turretAngle) * 25;
        const bulletY = enemy.y + Math.sin(enemy.turretAngle) * 25;
        bullets.push({
          x: bulletX,
          y: bulletY,
          angle: enemy.turretAngle,
          speed: enemy.type === "SNIPER" ? 15 : enemy.isBoss ? 12 : 7,
          radius: enemy.isBoss ? 8 : 6,
          color:
            enemy.type === "HEAVY"
              ? "#FF5722"
              : enemy.isBoss
              ? "#FF0000"
              : "#FF9800",
          isPlayer: false,
          isBoss: enemy.isBoss,
        });
        enemy.lastShot = now;
        enemy.shotDelay = enemy.isBoss
          ? 1000 - bossLevel * 50
          : enemy.type === "SNIPER"
          ? 3000
          : 1500 + Math.random() * 1000;
      }
    }
  });
}

function updateHealthPacks() {
  const now = Date.now();

  if (
    now - healthPackSpawnTime > healthPackSpawnDelay &&
    healthPacks.length < maxHealthPacks
  ) {
    createHealthPack(
      Math.random() * (worldSize - 200) + 100,
      Math.random() * (worldSize - 200) + 100
    );
    healthPackSpawnTime = now;
  }
}

function updateMines() {
  const now = Date.now();

  if (now - mineSpawnTime > mineSpawnDelay && mines.length < maxMines) {
    createMine(
      Math.random() * (worldSize - 200) + 100,
      Math.random() * (worldSize - 200) + 100
    );
    mineSpawnTime = now;
  }
}

function updatePowerups() {
  const now = Date.now();

  if (
    now - powerupSpawnTime > powerupSpawnDelay &&
    powerups.length < maxPowerups
  ) {
    createPowerup(
      Math.random() * (worldSize - 200) + 100,
      Math.random() * (worldSize - 200) + 100
    );
    powerupSpawnTime = now;
  }

  checkPowerupPickup();

  if (player.powerup && now > player.powerupEndTime) {
    if (player.powerup === "speed") {
      player.speed = 3;
    } else if (player.powerup === "rapid_fire") {
      player.shotDelay = 500;
    }

    player.powerup = null;
    powerupTimer.style.display = "none";
  } else if (player.powerup) {
    const remaining = Math.ceil((player.powerupEndTime - now) / 1000);
    powerupTimer.textContent = `Улучшение: ${player.powerup.replace(
      "_",
      " "
    )} (${remaining}s)`;
  }
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];

    if (bullet.isExplosion) {
      bullet.lifeTime--;
      if (bullet.lifeTime <= 0) {
        bullets.splice(i, 1);
      }
      continue;
    }

    bullet.x += Math.cos(bullet.angle) * bullet.speed;
    bullet.y += Math.sin(bullet.angle) * bullet.speed;

    if (
      bullet.x < 0 ||
      bullet.x > worldSize ||
      bullet.y < 0 ||
      bullet.y > worldSize
    ) {
      bullets.splice(i, 1);
      continue;
    }

    const mine = checkMineCollision(bullet.x, bullet.y, bullet.radius);
    if (mine) {
      explodeMine(mine, true);
      bullets.splice(i, 1);
      continue;
    }

    const col = Math.floor(bullet.x / cellSize);
    const row = Math.floor(bullet.y / cellSize);
    if (
      col >= 0 &&
      col < cols &&
      row >= 0 &&
      row < rows &&
      maze[row][col] !== 0
    ) {
      maze[row][col].health--;
      if (maze[row][col].health <= 0) {
        maze[row][col] = 0;
      }
      bullets.splice(i, 1);
      continue;
    }

    if (bullet.isPlayer === false) {
      const distToPlayer = Math.sqrt(
        Math.pow(bullet.x - player.x, 2) + Math.pow(bullet.y - player.y, 2)
      );
      if (
        distToPlayer < player.width / 2 + bullet.radius &&
        player.health > 0 &&
        player.powerup !== "shield"
      ) {
        player.health -= bullet.isBoss ? 2 : 1;
        updateHearts();
        bullets.splice(i, 1);

        if (player.health <= 0) {
          gameOver();
        }
        continue;
      }
    }

    if (bullet.isPlayer === true) {
      for (let j = enemies.length - 1; j >= 0; j--) {
        const enemy = enemies[j];
        const distToEnemy = Math.sqrt(
          Math.pow(bullet.x - enemy.x, 2) + Math.pow(bullet.y - enemy.y, 2)
        );
        if (distToEnemy < enemy.width / 2 + bullet.radius) {
          enemy.health--;
          if (enemy.health <= 0) {
            if (enemy.isBoss) {
              bossActive = false;
              bossKills++;
              bossDisplay.textContent = bossKills;
              const packsToSpawn =
                3 +
                (Math.random() < 0.5 ? 1 : 0) +
                (Math.random() < 0.2 ? 1 : 0);
              for (
                let k = 0;
                k < packsToSpawn && healthPacks.length < maxHealthPacks;
                k++
              ) {
                createHealthPack(
                  enemy.x + (Math.random() * 100 - 50),
                  enemy.y + (Math.random() * 100 - 50)
                );
              }

              if (powerups.length < maxPowerups) {
                createPowerup(enemy.x, enemy.y);
              }
            } else {
              const packsToSpawn =
                1 +
                (Math.random() < 0.3 ? 1 : 0) +
                (Math.random() < 0.1 ? 1 : 0);
              for (
                let k = 0;
                k < packsToSpawn && healthPacks.length < maxHealthPacks;
                k++
              ) {
                createHealthPack(
                  enemy.x + (Math.random() * 60 - 30),
                  enemy.y + (Math.random() * 60 - 30)
                );
              }

              if (Math.random() < 0.2 && powerups.length < maxPowerups) {
                createPowerup(enemy.x, enemy.y);
              }
            }

            enemies.splice(j, 1);
            kills++;
            killsDisplay.textContent = kills;
          }
          bullets.splice(i, 1);
          break;
        }
      }
    }
  }
}

function drawMiniMap() {
  miniMapCtx.clearRect(0, 0, miniMap.width, miniMap.height);

  const viewSize = 10000;
  const scale = miniMap.width / viewSize;

  const centerX = miniMap.width / 2;
  const centerY = miniMap.height / 2;

  miniMapCtx.fillStyle = "rgba(0, 0, 0, 0.7)";
  miniMapCtx.fillRect(0, 0, miniMap.width, miniMap.height);

  miniMapCtx.strokeStyle = "#555";
  miniMapCtx.strokeRect(0, 0, miniMap.width, miniMap.height);

  const startCol = Math.max(
    0,
    Math.floor((player.x - viewSize / 2) / cellSize)
  );
  const endCol = Math.min(cols, startCol + Math.ceil(viewSize / cellSize));
  const startRow = Math.max(
    0,
    Math.floor((player.y - viewSize / 2) / cellSize)
  );
  const endRow = Math.min(rows, startRow + Math.ceil(viewSize / cellSize));

  for (let row = startRow; row < endRow; row++) {
    for (let col = startCol; col < endCol; col++) {
      if (maze[row][col] !== 0) {
        const x = (col * cellSize - (player.x - viewSize / 2)) * scale;
        const y = (row * cellSize - (player.y - viewSize / 2)) * scale;
        miniMapCtx.fillStyle = "#4A4A5A";
        miniMapCtx.fillRect(x, y, cellSize * scale, cellSize * scale);
      }
    }
  }

  mines.forEach((mine) => {
    if (mine.active) {
      const x = (mine.x - (player.x - viewSize / 2)) * scale;
      const y = (mine.y - (player.y - viewSize / 2)) * scale;
      if (x >= 0 && x <= miniMap.width && y >= 0 && y <= miniMap.height) {
        miniMapCtx.fillStyle = "#FFEB3B";
        miniMapCtx.beginPath();
        miniMapCtx.arc(x, y, 2, 0, Math.PI * 2);
        miniMapCtx.fill();
      }
    }
  });

  healthPacks.forEach((pack) => {
    const x = (pack.x - (player.x - viewSize / 2)) * scale;
    const y = (pack.y - (player.y - viewSize / 2)) * scale;
    if (x >= 0 && x <= miniMap.width && y >= 0 && y <= miniMap.height) {
      miniMapCtx.fillStyle = "#FF4081";
      miniMapCtx.beginPath();
      miniMapCtx.arc(x, y, 2, 0, Math.PI * 2);
      miniMapCtx.fill();
    }
  });

  powerups.forEach((powerup) => {
    const x = (powerup.x - (player.x - viewSize / 2)) * scale;
    const y = (powerup.y - (player.y - viewSize / 2)) * scale;
    if (x >= 0 && x <= miniMap.width && y >= 0 && y <= miniMap.height) {
      miniMapCtx.fillStyle = powerup.color;
      miniMapCtx.beginPath();
      miniMapCtx.arc(x, y, 2, 0, Math.PI * 2);
      miniMapCtx.fill();
    }
  });

  enemies.forEach((enemy) => {
    const x = (enemy.x - (player.x - viewSize / 2)) * scale;
    const y = (enemy.y - (player.y - viewSize / 2)) * scale;

    if (enemy.isBoss) {
      if (x >= 0 && x <= miniMap.width && y >= 0 && y <= miniMap.height) {
        miniMapCtx.fillStyle = "#FF0000";
        miniMapCtx.beginPath();
        miniMapCtx.arc(x, y, 8, 0, Math.PI * 2);
        miniMapCtx.fill();
        miniMapCtx.strokeStyle = "#ffffff";
        miniMapCtx.stroke();

        miniMapCtx.strokeStyle = "#FFF";
        miniMapCtx.lineWidth = 2;
        miniMapCtx.beginPath();
        miniMapCtx.moveTo(x - 5, y);
        miniMapCtx.lineTo(x + 5, y);
        miniMapCtx.moveTo(x, y - 5);
        miniMapCtx.lineTo(x, y + 5);
        miniMapCtx.stroke();

        miniMapCtx.fillStyle = "#FFF";
        miniMapCtx.font = "bold 10px Arial";
        miniMapCtx.textAlign = "center";
        miniMapCtx.fillText(enemy.bossLevel.toString(), x, y + 3);
      } else if (bossActive) {
        const angle = Math.atan2(y - centerY, x - centerX);
        const radius = Math.min(miniMap.width, miniMap.height) / 2 - 10;
        const indicatorX = centerX + Math.cos(angle) * radius;
        const indicatorY = centerY + Math.sin(angle) * radius;

        miniMapCtx.fillStyle = "#FF0000";
        miniMapCtx.beginPath();
        miniMapCtx.arc(indicatorX, indicatorY, 5, 0, Math.PI * 2);
        miniMapCtx.fill();

        miniMapCtx.strokeStyle = "#FF0000";
        miniMapCtx.lineWidth = 2;
        miniMapCtx.beginPath();
        miniMapCtx.moveTo(indicatorX, indicatorY);
        miniMapCtx.lineTo(
          indicatorX - Math.cos(angle) * 10,
          indicatorY - Math.sin(angle) * 10
        );
        miniMapCtx.stroke();
      }
    } else {
      if (x >= 0 && x <= miniMap.width && y >= 0 && y <= miniMap.height) {
        miniMapCtx.fillStyle = enemy.color;
        miniMapCtx.beginPath();
        miniMapCtx.arc(x, y, enemy.radius, 0, Math.PI * 2);
        miniMapCtx.fill();

        const healthWidth = 8 * (enemy.health / enemy.maxHealth);
        miniMapCtx.fillStyle =
          enemy.health > enemy.maxHealth * 0.6
            ? "#4CAF50"
            : enemy.health > enemy.maxHealth * 0.3
            ? "#FFC107"
            : "#F44336";
        miniMapCtx.fillRect(x - 4, y - 10, healthWidth, 2);
      }
    }
  });

  miniMapCtx.fillStyle = "#4CAF50";
  miniMapCtx.beginPath();
  miniMapCtx.arc(centerX, centerY, 5, 0, Math.PI * 2);
  miniMapCtx.fill();

  miniMapCtx.strokeStyle = "#4CAF50";
  miniMapCtx.lineWidth = 2;
  miniMapCtx.beginPath();
  miniMapCtx.moveTo(centerX, centerY);
  miniMapCtx.lineTo(
    centerX + Math.cos(player.turretAngle) * 15,
    centerY + Math.sin(player.turretAngle) * 15
  );
  miniMapCtx.stroke();
}

function drawTank(tank, isPlayer) {
  const centerX = isPlayer
    ? canvas.width / 2
    : tank.x - (player.x - canvas.width / 2);
  const centerY = isPlayer
    ? canvas.height / 2
    : tank.y - (player.y - canvas.height / 2);

  if (
    centerX < -50 ||
    centerX > canvas.width + 50 ||
    centerY < -50 ||
    centerY > canvas.height + 50
  ) {
    return;
  }

  if (tank.isBoss) {
    ctx.save();
    ctx.translate(centerX, centerY);

    // Корпус босса
    ctx.fillStyle = tank.color;
    ctx.beginPath();
    ctx.roundRect(
      -tank.width / 2,
      -tank.height / 2,
      tank.width,
      tank.height,
      10
    );
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.stroke();

    // Гусеницы - теперь более широкие и видны сбоку
    const trackWidth = tank.width + 20; // Увеличиваем ширину гусениц
    const trackHeight = 12; // Высота гусениц
    const trackOffset = 15; // Отступ от центра

    // Верхняя гусеница
    ctx.fillStyle = "#333";
    ctx.fillRect(
      -trackWidth / 2,
      -tank.height / 2 - trackOffset, // Поднимаем выше
      trackWidth,
      trackHeight
    );

    // Нижняя гусеница
    ctx.fillRect(
      -trackWidth / 2,
      tank.height / 2 + trackOffset - trackHeight, // Опускаем ниже
      trackWidth,
      trackHeight
    );

    // Полоска на корпусе
    ctx.fillStyle = "#333";
    ctx.fillRect(
      -tank.width / 2 + 10,
      -tank.height / 2 + 10,
      tank.width - 20,
      8
    );

    // Номер уровня босса
    ctx.fillStyle = "#FFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 16px Arial";
    ctx.fillText(tank.bossLevel.toString(), 0, 0);

    ctx.restore();

    // Башня
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(tank.turretAngle);

    ctx.fillStyle = "#9E9E9E";
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.stroke();

    ctx.fillStyle = "#777";
    ctx.fillRect(0, -6, 35, 12);
    ctx.strokeRect(0, -6, 35, 12);

    ctx.restore();

    // Полоска здоровья
    ctx.fillStyle =
      tank.health > tank.maxHealth * 0.6
        ? "#4CAF50"
        : tank.health > tank.maxHealth * 0.3
        ? "#FFC107"
        : "#F44336";
    const healthWidth = 50 * (tank.health / tank.maxHealth);
    ctx.fillRect(centerX - 25, centerY - 40, healthWidth, 8);
    ctx.strokeStyle = "#000";
    ctx.strokeRect(centerX - 25, centerY - 40, 50, 8);

    return;
  }

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(tank.angle);

  ctx.fillStyle = "#333";
  ctx.fillRect(-tank.width / 2 - 5, -tank.height / 2 - 8, tank.width + 10, 8);
  ctx.fillRect(-tank.width / 2 - 5, tank.height / 2, tank.width + 10, 8);

  ctx.fillStyle = tank.color;
  ctx.beginPath();
  ctx.roundRect(-tank.width / 2, -tank.height / 2, tank.width, tank.height, 5);
  ctx.fill();
  ctx.strokeStyle = "#000";
  ctx.stroke();

  ctx.fillStyle = "#555";
  ctx.fillRect(-tank.width / 2 + 5, -tank.height / 2 + 5, tank.width - 10, 5);

  ctx.restore();

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(tank.turretAngle);

  ctx.fillStyle = isPlayer ? "#607D8B" : "#9E9E9E";
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#000";
  ctx.stroke();

  ctx.fillStyle = "#777";
  ctx.fillRect(0, -4, 25, 8);
  ctx.strokeRect(0, -4, 25, 8);

  ctx.restore();

  if (!isPlayer) {
    ctx.fillStyle =
      tank.health > tank.maxHealth * 0.6
        ? "#4CAF50"
        : tank.health > tank.maxHealth * 0.3
        ? "#FFC107"
        : "#F44336";
    const healthWidth = 30 * (tank.health / tank.maxHealth);
    ctx.fillRect(centerX - 15, centerY - 30, healthWidth, 5);
    ctx.strokeStyle = "#000";
    ctx.strokeRect(centerX - 15, centerY - 30, 30, 5);
  }

  if (isPlayer && player.powerup === "shield") {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(33, 150, 243, 0.7)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }
}

function drawHealthPack(pack) {
  const x = pack.x - (player.x - canvas.width / 2);
  const y = pack.y - (player.y - canvas.height / 2);

  if (x < -30 || x > canvas.width + 30 || y < -30 || y > canvas.height + 30) {
    return;
  }

  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = pack.color;
  ctx.beginPath();
  ctx.arc(0, 0, pack.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#000";
  ctx.stroke();

  ctx.fillStyle = "#FFF";
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.bezierCurveTo(5, -10, 10, -5, 0, 5);
  ctx.bezierCurveTo(-10, -5, -5, -10, 0, -5);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawMine(mine) {
  if (!mine.active) return;

  const x = mine.x - (player.x - canvas.width / 2);
  const y = mine.y - (player.y - canvas.height / 2);

  if (x < -30 || x > canvas.width + 30 || y < -30 || y > canvas.height + 30) {
    return;
  }

  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = mine.color;
  ctx.beginPath();
  ctx.arc(0, 0, mine.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#000";
  ctx.stroke();

  ctx.fillStyle = "#333";
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-mine.radius + 2, 0);
  ctx.lineTo(mine.radius - 2, 0);
  ctx.moveTo(0, -mine.radius + 2);
  ctx.lineTo(0, mine.radius - 2);
  ctx.stroke();

  ctx.restore();
}

function drawPowerup(powerup) {
  const x = powerup.x - (player.x - canvas.width / 2);
  const y = powerup.y - (player.y - canvas.height / 2);

  if (x < -30 || x > canvas.width + 30 || y < -30 || y > canvas.height + 30) {
    return;
  }

  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = powerup.color;
  ctx.beginPath();
  ctx.arc(0, 0, powerup.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#000";
  ctx.stroke();

  ctx.fillStyle = "#FFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 14px Arial";

  if (powerup.type.effect === "shield") {
    ctx.fillText("S", 0, 0);
  } else if (powerup.type.effect === "speed") {
    ctx.fillText("V", 0, 0);
  } else if (powerup.type.effect === "rapid_fire") {
    ctx.fillText("F", 0, 0);
  }

  ctx.restore();
}

function drawWorld() {
  // Эффект грязного экрана (один раз при инициализации)
  if (!window.dirtyScreenPattern) {
    window.dirtyScreenPattern = document.createElement("canvas");
    const dirtyCtx = window.dirtyScreenPattern.getContext("2d");
    window.dirtyScreenPattern.width = 64;
    window.dirtyScreenPattern.height = 64;

    dirtyCtx.fillStyle = "rgba(20, 20, 20, 0.02)";
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 64;
      const y = Math.random() * 64;
      const r = Math.random() * 3 + 1;
      dirtyCtx.beginPath();
      dirtyCtx.arc(x, y, r, 0, Math.PI * 2);
      dirtyCtx.fill();
    }
  }

  // Применяем эффект грязного экрана
  ctx.save();
  ctx.globalAlpha = 0.1;
  const pattern = ctx.createPattern(window.dirtyScreenPattern, "repeat");
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  ctx.fillStyle = "#4A4A5A";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const visibleLeft = player.x - canvas.width / 2;
  const visibleTop = player.y - canvas.height / 2;

  const startCol = Math.max(0, Math.floor(visibleLeft / cellSize));
  const endCol = Math.min(
    cols,
    startCol + Math.ceil(canvas.width / cellSize) + 1
  );
  const startRow = Math.max(0, Math.floor(visibleTop / cellSize));
  const endRow = Math.min(
    rows,
    startRow + Math.ceil(canvas.height / cellSize) + 1
  );

  for (let row = startRow; row < endRow; row++) {
    for (let col = startCol; col < endCol; col++) {
      if (maze[row][col] !== 0) {
        const x = col * cellSize - visibleLeft;
        const y = row * cellSize - visibleTop;

        ctx.fillStyle = "#676BAD";
        ctx.fillRect(x, y, cellSize, cellSize);

        ctx.strokeStyle = "#FF00FF";
        ctx.strokeRect(x, y, cellSize, cellSize);

        const health = maze[row][col].health;
        ctx.fillStyle =
          health > 7 ? "#8BC34A" : health > 3 ? "#FFC107" : "#F44336";
        ctx.fillRect(x, y, cellSize * (health / 10), 3);

        ctx.strokeStyle = "#5D4037";
        ctx.strokeRect(x, y, cellSize, cellSize);
      }
    }
  }

  mines.forEach((mine) => drawMine(mine));
  healthPacks.forEach((pack) => drawHealthPack(pack));
  powerups.forEach((powerup) => drawPowerup(powerup));
  enemies.forEach((enemy) => drawTank(enemy, false));

  if (player.health > 0) {
    drawTank(player, true);
  }

  bullets.forEach((bullet) => {
    const bulletX = bullet.x - visibleLeft;
    const bulletY = bullet.y - visibleTop;

    if (
      bulletX > -10 &&
      bulletX < canvas.width + 10 &&
      bulletY > -10 &&
      bulletY < canvas.height + 10
    ) {
      if (bullet.isExplosion) {
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bulletX, bulletY, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bulletX, bulletY, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#000";
        ctx.stroke();
      }
    }
  });
  // Более сложный вариант с разными полосами
  const lineCount = 15; // Количество полос
  for (let i = 0; i < lineCount; i++) {
    const speed = 0.5 + i * 0.1; // Разная скорость для каждой полосы
    const y =
      (Date.now() / (50 * speed) + i * (canvas.height / lineCount)) %
      canvas.height;
    const opacity = 0.02 + (i % 3) * 0.01; // Разная прозрачность

    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.lineWidth = (i % 2) + 1; // Чередуем толщину
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Вертикальные полосы (менее заметные)
  for (let i = 0; i < 5; i++) {
    const x = (Date.now() / 120 + i * 100) % canvas.width;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.01)";
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // Эффект виньетирования (затемнение по краям)
  const vignette = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    canvas.height * 0.1,
    canvas.width / 2,
    canvas.height / 2,
    canvas.height * 0.9
  );
  vignette.addColorStop(0, "transparent");
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.7)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Эффект зернистости (шум)
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const alpha = Math.random() * 0.1;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillRect(x, y, 1, 1);
  }

  // Эффект RGB-смещения (цветные тени)
  if (player.health > 0) {
    const offset = 1 + Math.sin(Date.now() / 500) * 0.5;
    ctx.save();
    ctx.globalCompositeOperation = "screen";

    // Красный канал
    ctx.fillStyle = "rgba(255, 0, 0, 0.1)";
    ctx.fillRect(offset, offset, canvas.width, canvas.height);

    // Зеленый канал
    ctx.fillStyle = "rgba(0, 255, 0, 0.1)";
    ctx.fillRect(-offset, 0, canvas.width, canvas.height);

    // Синий канал
    ctx.fillStyle = "rgba(0, 0, 255, 0.1)";
    ctx.fillRect(0, -offset, canvas.width, canvas.height);

    ctx.restore();
  }

  drawMiniMap();
}

// Настройка управления
function setupControls() {
  window.addEventListener("keydown", (e) => {
    if (keys.hasOwnProperty(e.key.toLowerCase())) {
      keys[e.key.toLowerCase()] = true;
      e.preventDefault();
    }
  });

  window.addEventListener("keyup", (e) => {
    if (keys.hasOwnProperty(e.key.toLowerCase())) {
      keys[e.key.toLowerCase()] = false;
      e.preventDefault();
    }
  });

  canvas.addEventListener("mousemove", (e) => {
    if (player.health <= 0) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - canvas.width / 2;
    const mouseY = e.clientY - rect.top - canvas.height / 2;
    player.turretAngle = Math.atan2(mouseY, mouseX);
  });

  // Замените текущий обработчик click на эти обработчики
  canvas.addEventListener("mousedown", (e) => {
    if (player.health <= 0) return;
    if (e.button === 0) {
      // ЛКМ
      isMouseDown = true;
      // Первый выстрел сразу
      fire();
      // Затем устанавливаем интервал для автоматической стрельбы
      autoFireInterval = setInterval(fire, player.shotDelay);
    }
  });

  canvas.addEventListener("mouseup", (e) => {
    if (e.button === 0) {
      // ЛКМ
      isMouseDown = false;
      if (autoFireInterval) {
        clearInterval(autoFireInterval);
        autoFireInterval = null;
      }
    }

    canvas.addEventListener("mouseleave", () => {
      isMouseDown = false;
      if (autoFireInterval) {
        clearInterval(autoFireInterval);
        autoFireInterval = null;
      }
    });
    if (now - player.lastShot > shotDelay) {
      const bulletX = player.x + Math.cos(player.turretAngle) * 25;
      const bulletY = player.y + Math.sin(player.turretAngle) * 25;
      bullets.push({
        x: bulletX,
        y: bulletY,
        angle: player.turretAngle,
        speed: 10,
        radius: 6,
        color: "#2196F3",
        isPlayer: true,
      });
      player.lastShot = now;
    }
  });

  // Для мобильных устройств
  setupMobileControls();
}

// Обновление игрока
function updatePlayer() {
  if (player.health <= 0 || !isWindowFocused) return;

  let moveX = 0;
  let moveY = 0;

  // Keyboard controls (WASD)
  if (keys.w) moveY -= player.speed;
  if (keys.s) moveY += player.speed;
  if (keys.a) moveX -= player.speed;
  if (keys.d) moveX += player.speed;

  // Joystick controls (if active)
  if (moveJoystickActive) {
    const joystickRadius = 60;
    const joystickPower =
      Math.sqrt(moveJoystickX * moveJoystickX + moveJoystickY * moveJoystickY) /
      joystickRadius;

    if (joystickPower > 0.1) {
      const angle = Math.atan2(moveJoystickY, moveJoystickX);
      moveX += Math.cos(angle) * player.speed * joystickPower;
      moveY += Math.sin(angle) * player.speed * joystickPower;
    }
  }

  if (moveX !== 0 && moveY !== 0) {
    moveX *= 0.7071;
    moveY *= 0.7071;
  }

  const newX = player.x + moveX;
  const newY = player.y + moveY;

  // Проверяем столкновение с миной
  const mine = checkMineCollision(newX, newY, player.width / 2);
  if (mine) {
    explodeMine(mine);
  }

  const wallCollision = checkWallCollision(
    newX,
    newY,
    player.width,
    player.height
  );
  const enemyCollision = checkEnemyCollision(
    newX,
    newY,
    player.width,
    player.height
  );
  const healthPackCollision = checkHealthPackCollision(newX, newY);
  const powerupCollision = checkPowerupCollision(newX, newY);

  if (!wallCollision && !enemyCollision && !healthPackCollision && !mine) {
    player.x = newX;
    player.y = newY;

    if (moveX !== 0 || moveY !== 0) {
      player.angle = Math.atan2(moveY, moveX);
    }
  }

  player.x = Math.max(
    player.width / 2,
    Math.min(worldSize - player.width / 2, player.x)
  );
  player.y = Math.max(
    player.height / 2,
    Math.min(worldSize - player.height / 2, player.y)
  );
}

function gameOver() {
  if (autoFireInterval) {
    clearInterval(autoFireInterval);
    autoFireInterval = null;
  }
  gameOverDisplay.style.display = "block";
  restartBtn.style.display = "block";
}

function restartGame() {
  player.x = worldSize / 2;
  player.y = worldSize / 2;
  player.health = player.maxHealth;
  player.angle = 0;
  player.turretAngle = 0;
  player.powerup = null;
  player.speed = 3;
  player.shotDelay = 500;
  powerupTimer.style.display = "none";

  enemies = [];
  bullets = [];
  healthPacks = [];
  mines = [];
  powerups = [];
  kills = 0;
  bossKills = 0;
  bossLevel = 0;
  bossActive = false;
  bossSpawnedForThresholds = [false, false, false, false, false];
  killsDisplay.textContent = kills;
  bossDisplay.textContent = bossKills;

  gameOverDisplay.style.display = "none";
  restartBtn.style.display = "none";

  generateMaze();
  updateHearts();

  for (let i = 0; i < 5; i++) {
    createEnemy();
  }
}

function initGame() {
  setupControls();
  generateMaze();
  updateHearts();

  for (let i = 0; i < 5; i++) {
    createEnemy();
  }

  restartBtn.addEventListener("click", restartGame);

  // Автоматическое определение мобильного устройства
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  if (isMobile) {
    document.getElementById("moveJoystick").style.display = "block";
    document.getElementById("aimJoystick").style.display = "block";
  }

  gameLoop();
}

function gameLoop() {
  updatePlayer();
  updateEnemies();
  updateHealthPacks();
  updateMines();
  updatePowerups();
  updateBullets();
  checkHealthPackPickup();
  drawWorld();
  requestAnimationFrame(gameLoop);
}

initGame();
