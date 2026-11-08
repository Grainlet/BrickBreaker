
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreDisplay = document.getElementById("score");
const livesDisplay = document.getElementById("lives");
const levelDisplay = document.getElementById("level");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayMessage = document.getElementById("overlay-message");
const startButton = document.getElementById("start-button");

let width, height;

let score = 0;
let lives = 3;
let currentLevel = 1;
const totalLevels = 5;

let gameState = "menu";
let animationId = null;

const ball = {
    x: 0,
    y: 0,
    radius: 7,
    dx: 3.5,
    dy: -3.5,
    speed: 5
};

const paddle = {
    width: 115,
    height: 9,
    x: 0,
    y: 0,
    speed: 8
};

let bricks = [];

const colors = [
    "#E9B9C5",
    "#C9BCE5",
    "#B8D1E5",
    "#BBD9C8",
    "#F0C7A9"
];

const levels = [
    { rows: 3, cols: 8, pattern: "full", speed: 5 },
    { rows: 4, cols: 8, pattern: "full", speed: 5.4 },
    { rows: 5, cols: 9, pattern: "checker", speed: 5.8 },
    { rows: 5, cols: 10, pattern: "diamond", speed: 6.2 },
    { rows: 6, cols: 10, pattern: "full", speed: 6.6 }
];

function resizeCanvas() {
    const oldWidth = width || window.innerWidth;

    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    paddle.y = height - 65;

    if (oldWidth && oldWidth !== width) {
        paddle.x = Math.max(0, Math.min(width - paddle.width, paddle.x));
        ball.x = Math.max(ball.radius, Math.min(width - ball.radius, ball.x));
    }

    if (gameState === "menu") {
        resetBall();
    }

    if (bricks.length > 0) {
        createBricks();
    }
}

function resetBall() {
    ball.x = width / 2;
    ball.y = height - 100;

    ball.speed = levels[currentLevel - 1].speed;
    ball.dx = ball.speed * 0.7;
    ball.dy = -ball.speed * 0.7;

    paddle.x = (width - paddle.width) / 2;
}

function createBricks() {
    bricks = [];

    const level = levels[currentLevel - 1];

    const maxWidth = Math.min(width - 40, 850);
    const gap = 9;
    const brickHeight = 19;

    const brickWidth = Math.min(
        85,
        (maxWidth - (level.cols - 1) * gap) / level.cols
    );

    const totalWidth =
        level.cols * brickWidth + (level.cols - 1) * gap;

    const startX = (width - totalWidth) / 2;
    const startY = Math.max(95, height * 0.15);

    for (let row = 0; row < level.rows; row++) {
        for (let col = 0; col < level.cols; col++) {

            let visible = true;

            if (level.pattern === "checker") {
                visible = (row + col) % 2 === 0;
            }

            if (level.pattern === "diamond") {
                const center = (level.cols - 1) / 2;
                visible = Math.abs(col - center) <= row + 1;
            }

            if (!visible) continue;

            bricks.push({
                x: startX + col * (brickWidth + gap),
                y: startY + row * (brickHeight + gap),
                width: brickWidth,
                height: brickHeight,
                color: colors[row % colors.length],
                alive: true
            });
        }
    }
}

function drawBackground() {
    ctx.fillStyle = "#F8F6F0";
    ctx.fillRect(0, 0, width, height);

    // Subtle decorative floor line
    ctx.strokeStyle = "rgba(36,35,33,0.05)";
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(30, height - 38);
    ctx.lineTo(width - 30, height - 38);
    ctx.stroke();
}

function drawBricks() {
    for (const brick of bricks) {
        if (!brick.alive) continue;

        ctx.fillStyle = brick.color;
        ctx.beginPath();

        ctx.roundRect(
            brick.x,
            brick.y,
            brick.width,
            brick.height,
            4
        );

        ctx.fill();

        // Subtle top highlight
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.fillRect(
            brick.x + 5,
            brick.y + 2,
            brick.width - 10,
            2
        );
    }
}

function drawBall() {
    ctx.beginPath();

    ctx.arc(
        ball.x,
        ball.y,
        ball.radius,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#242321";
    ctx.fill();
}

function drawPaddle() {
    ctx.fillStyle = "#292824";

    ctx.beginPath();

    ctx.roundRect(
        paddle.x,
        paddle.y,
        paddle.width,
        paddle.height,
        5
    );

    ctx.fill();
}

function updateUI() {
    scoreDisplay.textContent = String(score).padStart(4, "0");

    livesDisplay.textContent =
        Array.from({ length: lives }, () => "●").join(" ") || "—";

    levelDisplay.textContent =
        String(currentLevel).padStart(2, "0") + " / 05";
}

function nextLevel() {
    if (currentLevel >= totalLevels) {
        gameState = "victory";

        showOverlay(
            "YOU DID IT.",
            "All five levels completed. Final score: " + score,
            "PLAY AGAIN"
        );

        return;
    }

    currentLevel++;

    gameState = "transition";

    createBricks();
    resetBall();
    updateUI();

    showOverlay(
        "LEVEL " + String(currentLevel).padStart(2, "0"),
        "CONGRATSS MOVE TO THE NEXT LEVEL!.",
        "CONTINUE"
    );
}

function moveBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall collision
    if (ball.x + ball.radius >= width) {
        ball.x = width - ball.radius;
        ball.dx = -Math.abs(ball.dx);
    }

    if (ball.x - ball.radius <= 0) {
        ball.x = ball.radius;
        ball.dx = Math.abs(ball.dx);
    }

    if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius;
        ball.dy = Math.abs(ball.dy);
    }

    // Paddle collision
    if (
        ball.dy > 0 &&
        ball.y + ball.radius >= paddle.y &&
        ball.y - ball.radius <= paddle.y + paddle.height &&
        ball.x >= paddle.x &&
        ball.x <= paddle.x + paddle.width
    ) {
        const hitPosition =
            (ball.x - (paddle.x + paddle.width / 2)) /
            (paddle.width / 2);

        const angle = hitPosition * 1.05;

        ball.dx = ball.speed * Math.sin(angle);
        ball.dy = -Math.abs(ball.speed * Math.cos(angle));

        ball.y = paddle.y - ball.radius;
    }

    // Missed ball
    if (ball.y - ball.radius > height) {
        lives--;

        updateUI();

        if (lives <= 0) {
            gameState = "gameover";

            showOverlay(
                "GAME OVER.",
                "Final score: " + score,
                "TRY AGAIN"
            );
        } else {
            resetBall();
        }

        return;
    }

    // Brick collision
    for (const brick of bricks) {
        if (!brick.alive) continue;

        if (
            ball.x + ball.radius > brick.x &&
            ball.x - ball.radius < brick.x + brick.width &&
            ball.y + ball.radius > brick.y &&
            ball.y - ball.radius < brick.y + brick.height
        ) {
            brick.alive = false;

            // Resolve collision based on the nearest brick edge
            const overlapLeft = ball.x + ball.radius - brick.x;
            const overlapRight = brick.x + brick.width - (ball.x - ball.radius);
            const overlapTop = ball.y + ball.radius - brick.y;
            const overlapBottom = brick.y + brick.height - (ball.y - ball.radius);

            const minOverlap = Math.min(
                overlapLeft,
                overlapRight,
                overlapTop,
                overlapBottom
            );

            if (minOverlap === overlapLeft || minOverlap === overlapRight) {
                ball.dx *= -1;
            } else {
                ball.dy *= -1;
            }

            score += 10;

            updateUI();
            break;
        }
    }

    // Level cleared
    if (bricks.every(brick => !brick.alive)) {
        nextLevel();
    }
}

const keys = {};

window.addEventListener("keydown", event => {
    const key = event.key.toLowerCase();

    keys[key] = true;

    if (
        ["arrowleft", "arrowright", " "].includes(key)
    ) {
        event.preventDefault();
    }

    if (key === " " && gameState === "playing") {
        // Space can be used for future pause functionality.
    }
});

window.addEventListener("keyup", event => {
    keys[event.key.toLowerCase()] = false;
});

function movePaddle() {
    if (keys["arrowleft"] || keys["a"]) {
        paddle.x -= paddle.speed;
    }

    if (keys["arrowright"] || keys["d"]) {
        paddle.x += paddle.speed;
    }

    paddle.x = Math.max(
        0,
        Math.min(width - paddle.width, paddle.x)
    );
}

// Mouse controls
canvas.addEventListener("mousemove", event => {
    if (gameState !== "playing") return;

    paddle.x = event.clientX - paddle.width / 2;
    paddle.x = Math.max(
        0,
        Math.min(width - paddle.width, paddle.x)
    );
});

// Touch controls
canvas.addEventListener("touchmove", event => {
    event.preventDefault();

    if (gameState !== "playing") return;

    const touch = event.touches[0];

    paddle.x = touch.clientX - paddle.width / 2;

    paddle.x = Math.max(
        0,
        Math.min(width - paddle.width, paddle.x)
    );
}, { passive: false });

function showOverlay(title, message, buttonText) {
    overlayTitle.textContent = title;
    overlayMessage.textContent = message;
    startButton.textContent = buttonText + " →";

    overlay.classList.remove("hidden");
}

function startGame() {
    if (gameState === "menu" || gameState === "gameover" || gameState === "victory") {
        score = 0;
        lives = 3;
        currentLevel = 1;

        createBricks();
        resetBall();
    }

    gameState = "playing";

    overlay.classList.add("hidden");
    updateUI();
}

startButton.addEventListener("click", startGame);

function animate() {
    drawBackground();

    if (gameState === "playing") {
        movePaddle();
        moveBall();
    }

    drawBricks();
    drawPaddle();

    if (gameState === "playing" || gameState === "menu" || gameState === "transition") {
        drawBall();
    }

    animationId = requestAnimationFrame(animate);
}

window.addEventListener("resize", resizeCanvas);

resizeCanvas();
createBricks();
resetBall();
updateUI();

animate();
