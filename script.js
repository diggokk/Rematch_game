// Configurações do jogo
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Variáveis do jogador
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 30,
    speed: 5,
    color: '#ff4655',
    isDashing: false,
    dashSpeed: 15,
    dashCooldown: 1000, // 1 segundo
    lastDashTime: 0
};

// Variáveis da bola
const ball = {
    x: canvas.width / 2 + 100,
    y: canvas.height / 2,
    radius: 15,
    color: 'white',
    velocityX: 0,
    velocityY: 0,
    gravity: 0.2
};

// Controles
const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false,
    space: false
};

// Event listeners para controles
window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'w') keys.w = true;
    if (e.key.toLowerCase() === 'a') keys.a = true;
    if (e.key.toLowerCase() === 's') keys.s = true;
    if (e.key.toLowerCase() === 'd') keys.d = true;
    if (e.key === 'Shift') keys.shift = true;
    if (e.key === ' ') keys.space = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key.toLowerCase() === 'w') keys.w = false;
    if (e.key.toLowerCase() === 'a') keys.a = false;
    if (e.key.toLowerCase() === 's') keys.s = false;
    if (e.key.toLowerCase() === 'd') keys.d = false;
    if (e.key === 'Shift') keys.shift = false;
    if (e.key === ' ') keys.space = false;
});

// Função para iniciar o jogo
function startGame(fieldType) {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';

    // Altera o cenário conforme seleção
    switch (fieldType) {
        case 'futuristic':
            canvas.style.backgroundImage = "url('assets/fields/futuristic.jpg')";
            break;
        case 'amazon':
            canvas.style.backgroundImage = "url('assets/fields/amazon.jpg')";
            break;
        case 'classic':
            canvas.style.backgroundImage = "url('assets/fields/classic.jpg')";
            break;
    }

    // Inicia o loop do jogo
    gameLoop();
}

// Loop principal do jogo
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// Atualiza a lógica do jogo
function update() {
    // Movimento do jogador
    let speed = player.speed;
    
    // Dash (Shift)
    if (keys.shift && Date.now() - player.lastDashTime > player.dashCooldown) {
        speed = player.dashSpeed;
        player.lastDashTime = Date.now();
    }

    if (keys.w) player.y -= speed;
    if (keys.a) player.x -= speed;
    if (keys.s) player.y += speed;
    if (keys.d) player.x += speed;

    // Chute (Espaço)
    if (keys.space) {
        const distance = Math.sqrt(
            Math.pow(ball.x - player.x, 2) + Math.pow(ball.y - player.y, 2)
        );
        
        if (distance < player.size + ball.radius) {
            // Chute normal ou voleio (se a bola estiver no ar)
            const power = ball.velocityY < 0 ? 10 : 15; // Voleio tem mais força
            ball.velocityX = (ball.x - player.x) * 0.2 * power;
            ball.velocityY = (ball.y - player.y) * 0.2 * power - 5;
        }
    }

    // Atualiza posição da bola
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;
    ball.velocityY += ball.gravity;

    // Colisão da bola com o chão
    if (ball.y + ball.radius > canvas.height) {
        ball.y = canvas.height - ball.radius;
        ball.velocityY *= -0.6; // Amortece o quique
    }
}

// Renderiza os gráficos
function render() {
    // Limpa o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenha a bola
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.closePath();

    // Desenha o jogador
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);

    // Efeito de dash (faíscas)
    if (keys.shift && Date.now() - player.lastDashTime < 100) {
        ctx.fillStyle = 'rgba(255, 230, 0, 0.7)';
        ctx.fillRect(player.x - 20, player.y - 20, 40, 40);
    }
}
