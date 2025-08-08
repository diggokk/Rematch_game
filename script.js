// 🎮 Configurações Avançadas do Jogo
const config = {
    playerSpeed: 6,
    enemyCount: 8,
    rupeeCount: 15,
    keyCount: 3,
    mapWidth: 2400,
    mapHeight: 1800,
    viewportWidth: 800,
    viewportHeight: 600,
    attackCooldown: 500,
    enemySpawnRate: 10000,
    musicVolume: 0.3
};

// 🏰 Estado do Jogo
const gameState = {
    player: {
        x: 1200,
        y: 900,
        health: 3,
        maxHealth: 3,
        rupees: 0,
        keys: 0,
        attacking: false,
        lastAttack: 0,
        direction: { x: 0, y: 1 }
    },
    keys: {},
    enemies: [],
    rupees: [],
    keysItems: [],
    obstacles: [],
    gameTime: 0,
    currentDialog: null,
    inDialog: false
};

// 🎵 Efeitos Sonoros (usando Web Audio API)
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const sounds = {
    sword: null,
    rupee: null,
    damage: null,
    enemyDeath: null
};

// 🏁 Inicialização do Jogo
async function initGame() {
    // Mostra tela de carregamento
    showLoadingScreen();
    
    // Carrega assets
    await loadAssets();
    
    // Configura música de fundo
    const bgMusic = document.getElementById('bg-music');
    bgMusic.volume = config.musicVolume;
    bgMusic.play().catch(e => console.log("Autoplay bloqueado:", e));
    
    // Cria mapa
    generateWorld();
    
    // Cria HUD
    updateHUD();
    
    // Event listeners
    setupEventListeners();
    
    // Esconde tela de carregamento e inicia o jogo
    setTimeout(() => {
        hideLoadingScreen();
        gameLoop();
        startEnemySpawner();
    }, 2000);
}

// 🖼️ Mostra tela de carregamento
function showLoadingScreen() {
    document.getElementById('loading-screen').style.opacity = '1';
}

// 🎮 Esconde tela de carregamento
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.style.opacity = '0';
    setTimeout(() => loadingScreen.classList.add('hidden'), 1000);
    
    document.getElementById('game-container').classList.remove('hidden');
}

// 🎵 Carrega assets
async function loadAssets() {
    // Carrega efeitos sonoros
    sounds.sword = await loadSound('https://assets.codepen.io/21542/sword-swing.mp3');
    sounds.rupee = await loadSound('https://assets.codepen.io/21542/rupee-collect.mp3');
    sounds.damage = await loadSound('https://assets.codepen.io/21542/damage-sound.mp3');
    sounds.enemyDeath = await loadSound('https://assets.codepen.io/21542/enemy-death.mp3');
}

// 🔊 Carrega som
async function loadSound(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer;
}

// 🔊 Toca som
function playSound(buffer, volume = 1.0) {
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    source.buffer = buffer;
    gainNode.gain.value = volume;
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    source.start(0);
}

// 🌍 Gera o mundo do jogo
function generateWorld() {
    const gameMap = document.getElementById('game-map');
    
    // Limpa o mapa
    gameMap.innerHTML = '';
    
    // Cria obstáculos (árvores, pedras, água)
    createObstacles();
    
    // Cria itens colecionáveis
    createCollectibles();
    
    // Posiciona o jogador
    positionPlayer();
}

// 🌳 Cria obstáculos no mundo
function createObstacles() {
    const gameMap = document.getElementById('game-map');
    
    // Floresta
    for (let i = 0; i < 50; i++) {
        const tree = {
            x: Math.random() * config.mapWidth,
            y: Math.random() * config.mapHeight,
            width: 60 + Math.random() * 40,
            height: 80 + Math.random() * 40,
            type: 'tree'
        };
        gameState.obstacles.push(tree);
        
        const treeElement = document.createElement('div');
        treeElement.className = 'obstacle tree';
        treeElement.style.left = `${tree.x - tree.width/2}px`;
        treeElement.style.top = `${tree.y - tree.height/2}px`;
        treeElement.style.width = `${tree.width}px`;
        treeElement.style.height = `${tree.height}px`;
        gameMap.appendChild(treeElement);
    }
    
    // Lagos de água
    for (let i = 0; i < 10; i++) {
        const waterSize = 150 + Math.random() * 200;
        const water = {
            x: Math.random() * (config.mapWidth - waterSize),
            y: Math.random() * (config.mapHeight - waterSize),
            width: waterSize,
            height: waterSize,
            type: 'water'
        };
        gameState.obstacles.push(water);
        
        const waterElement = document.createElement('div');
        waterElement.className = 'obstacle water';
        waterElement.style.left = `${water.x}px`;
        waterElement.style.top = `${water.y}px`;
        waterElement.style.width = `${water.width}px`;
        waterElement.style.height = `${water.height}px`;
        gameMap.appendChild(waterElement);
    }
}

// 💎 Cria itens colecionáveis
function createCollectibles() {
    // Rupees
    for (let i = 0; i < config.rupeeCount; i++) {
        createRupee();
    }
    
    // Chaves
    for (let i = 0; i < config.keyCount; i++) {
        createKey();
    }
}

// 💰 Cria uma rupee
function createRupee() {
    const gameMap = document.getElementById('game-map');
    
    const rupee = {
        x: Math.random() * (config.mapWidth - 50) + 25,
        y: Math.random() * (config.mapHeight - 50) + 25,
        collected: false
    };
    
    gameState.rupees.push(rupee);
    
    const rupeeElement = document.createElement('div');
    rupeeElement.className = 'rupee';
    rupeeElement.style.left = `${rupee.x - 12}px`;
    rupeeElement.style.top = `${rupee.y - 18}px`;
    rupeeElement.dataset.index = gameState.rupees.length - 1;
    gameMap.appendChild(rupeeElement);
}

// 🔑 Cria uma chave
function createKey() {
    const gameMap = document.getElementById('game-map');
    
    const key = {
        x: Math.random() * (config.mapWidth - 50) + 25,
        y: Math.random() * (config.mapHeight - 50) + 25,
        collected: false
    };
    
    gameState.keysItems.push(key);
    
    const keyElement = document.createElement('div');
    keyElement.className = 'key';
    keyElement.style.left = `${key.x - 12}px`;
    keyElement.style.top = `${key.y - 12}px`;
    keyElement.dataset.index = gameState.keysItems.length - 1;
    gameMap.appendChild(keyElement);
}

// 🧍 Posiciona o jogador
function positionPlayer() {
    const playerElement = document.getElementById('player');
    playerElement.style.left = `${config.viewportWidth/2 - 24}px`;
    playerElement.style.top = `${config.viewportHeight/2 - 24}px`;
}

// 🎮 Configura listeners de eventos
function setupEventListeners() {
    // Teclado
    window.addEventListener('keydown', (e) => {
        if (gameState.inDialog && e.key === 'Enter') {
            closeDialog();
            return;
        }
        
        gameState.keys[e.key] = true;
        
        // Ataque com espaço ou 'z'
        if ((e.key === ' ' || e.key === 'z') && !gameState.player.attacking) {
            attack();
        }
    });
    
    window.addEventListener('keyup', (e) => {
        gameState.keys[e.key] = false;
    });
    
    // Botão de diálogo
    document.querySelector('.dialog-button').addEventListener('click', closeDialog);
}

// ⚔️ Ataque do jogador
function attack() {
    const now = Date.now();
    if (now - gameState.player.lastAttack < config.attackCooldown) return;
    
    gameState.player.attacking = true;
    gameState.player.lastAttack = now;
    playSound(sounds.sword);
    
    const playerElement = document.getElementById('player');
    playerElement.classList.add('attacking');
    
    // Verifica acerto em inimigos
    const swordRect = {
        x: gameState.player.x + (gameState.player.direction.x * 40),
        y: gameState.player.y + (gameState.player.direction.y * 40),
        width: 30,
        height: 30
    };
    
    gameState.enemies.forEach((enemy, index) => {
        if (checkCollision(swordRect, { 
            x: enemy.x, 
            y: enemy.y, 
            width: 48, 
            height: 48 
        })) {
            // Inimigo atingido
            playSound(sounds.enemyDeath);
            removeEnemy(index);
            createParticles(enemy.x, enemy.y, 10, '#ff4500');
        }
    });
    
    setTimeout(() => {
        playerElement.classList.remove('attacking');
        gameState.player.attacking = false;
    }, 300);
}

// 🏃‍♂️ Atualiza o jogador
function updatePlayer() {
    const player = gameState.player;
    let moveX = 0;
    let moveY = 0;
    
    // Movimento
    if (gameState.keys['ArrowUp'] || gameState.keys['w']) moveY = -1;
    if (gameState.keys['ArrowDown'] || gameState.keys['s']) moveY = 1;
    if (gameState.keys['ArrowLeft'] || gameState.keys['a']) moveX = -1;
    if (gameState.keys['ArrowRight'] || gameState.keys['d']) moveX = 1;
    
    // Normaliza movimento diagonal
    if (moveX !== 0 && moveY !== 0) {
        moveX *= 0.7071;
        moveY *= 0.7071;
    }
    
    // Atualiza direção para animação de ataque
    if (moveX !== 0 || moveY !== 0) {
        player.direction = { x: moveX, y: moveY };
        const sword = document.querySelector('.sword');
        sword.style.left = moveX > 0 ? '48px' : '-30px';
        sword.style.top = '50%';
    }
    
    // Calcula nova posição
    const newX = player.x + moveX * config.playerSpeed;
    const newY = player.y + moveY * config.playerSpeed;
    
    // Verifica colisões com obstáculos
    const canMove = checkMovement(newX, newY, 48, 48);
    
    // Atualiza posição
    if (canMove.x) player.x = Math.max(24, Math.min(config.mapWidth - 72, newX));
    if (canMove.y) player.y = Math.max(24, Math.min(config.mapHeight - 72, newY));
}

// 🧱 Verifica movimento válido
function checkMovement(x, y, width, height) {
    const result = { x: true, y: true };
    
    gameState.obstacles.forEach(obstacle => {
        if (
            x < obstacle.x + obstacle.width &&
            x + width > obstacle.x &&
            y < obstacle.y + obstacle.height &&
            y + height > obstacle.y
        ) {
            // Colisão com obstáculo
            if (obstacle.type === 'water') {
                // Dano ao tocar na água
                if (!gameState.player.attacking) {
                    takeDamage(1);
                }
            }
            result.x = false;
            result.y = false;
        }
    });
    
    return result;
}

// 🎮 Loop principal do jogo
function gameLoop() {
    updatePlayer();
    updateEnemies();
    updateCamera();
    checkCollectibles();
    updateParticles();
    gameState.gameTime += 16; // ~60fps
    
    requestAnimationFrame(gameLoop);
}

// 👾 Atualiza inimigos
function updateEnemies() {
    const player = gameState.player;
    const enemies = document.querySelectorAll('.enemy');
    
    gameState.enemies.forEach((enemy, index) => {
        // Movimento simples em direção ao jogador
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 300) {
            // Patrulha aleatória
            if (Math.random() < 0.02) {
                enemy.speedX = Math.random() * 2 - 1;
                enemy.speedY = Math.random() * 2 - 1;
            }
        } else {
            // Persegue o jogador
            enemy.speedX = dx / distance * 1.5;
            enemy.speedY = dy / distance * 1.5;
        }
        
        // Atualiza posição
        const newX = enemy.x + enemy.speedX;
        const newY = enemy.y + enemy.speedY;
        
        const canMove = checkMovement(newX, newY, 48, 48);
        
        if (canMove.x) enemy.x = newX;
        if (canMove.y) enemy.y = newY;
        
        // Atualiza no DOM
        enemies[index].style.left = `${enemy.x - 24}px`;
        enemies[index].style.top = `${enemy.y - 24}px`;
        
        // Verifica colisão com jogador
        if (distance < 40 && !gameState.player.attacking) {
            takeDamage(1);
        }
    });
}

// 📷 Atualiza a câmera
function updateCamera() {
    const gameMap = document.getElementById('game-map');
    const player = gameState.player;
    
    // Centraliza o mapa no jogador
    const mapX = -player.x + config.viewportWidth / 2;
    const mapY = -player.y + config.viewportHeight / 2;
    
    // Limita o movimento do mapa
    const maxX = 0;
    const minX = -(config.mapWidth - config.viewportWidth);
    const maxY = 0;
    const minY = -(config.mapHeight - config.viewportHeight);
    
    gameMap.style.left = `${Math.max(minX, Math.min(maxX, mapX))}px`;
    gameMap.style.top = `${Math.max(minY, Math.min(maxY, mapY))}px`;
}

// 💰 Verifica colecionáveis
function checkCollectibles() {
    const player = gameState.player;
    
    // Rupees
    const rupeeElements = document.querySelectorAll('.rupee');
    rupeeElements.forEach(rupeeElement => {
        const index = parseInt(rupeeElement.dataset.index);
        const rupee = gameState.rupees[index];
        
        if (!rupee.collected) {
            const dx = player.x - rupee.x;
            const dy = player.y - rupee.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 30) {
                collectRupee(index, rupeeElement);
            }
        }
    });
    
    // Chaves
    const keyElements = document.querySelectorAll('.key');
    keyElements.forEach(keyElement => {
        const index = parseInt(keyElement.dataset.index);
        const key = gameState.keysItems[index];
        
        if (!key.collected) {
            const dx = player.x - key.x;
            const dy = player.y - key.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 30) {
                collectKey(index, keyElement);
            }
        }
    });
}

// 💎 Coleta uma rupee
function collectRupee(index, element) {
    gameState.rupees[index].collected = true;
    gameState.player.rupees += 1;
    playSound(sounds.rupee);
    
    // Efeitos visuais
    element.style.transition = 'all 0.5s';
    element.style.transform = 'scale(2)';
    element.style.opacity = '0';
    createParticles(gameState.rupees[index].x, gameState.rupees[index].y, 5, '#0088ff');
    
    setTimeout(() => {
        element.remove();
        createRupee(); // Respawn
    }, 500);
    
    updateHUD();
}

// 🔑 Coleta uma chave
function collectKey(index, element) {
    gameState.keysItems[index].collected = true;
    gameState.player.keys += 1;
    playSound(sounds.rupee);
    
    // Efeitos visuais
    element.style.transition = 'all 0.5s';
    element.style.transform = 'scale(2)';
    element.style.opacity = '0';
    createParticles(gameState.keysItems[index].x, gameState.keysItems[index].y, 5, '#ffff00');
    
    setTimeout(() => {
        element.remove();
    }, 500);
    
    updateHUD();
    
    // Mostra diálogo quando pega a primeira chave
    if (gameState.player.keys === 1) {
        showDialog("Você encontrou uma chave mágica! Talvez ela possa abrir algum baú ou porta especial...");
    }
}

// 🩹 Dano ao jogador
function takeDamage(amount) {
    const now = Date.now();
    if (now - gameState.player.lastAttack < 1000) return; // Invulnerabilidade após ataque
    
    gameState.player.health -= amount;
    playSound(sounds.damage);
    
    // Efeito visual de dano
    const damageEffect = document.createElement('div');
    damageEffect.className = 'damage-effect';
    document.getElementById('game-container').appendChild(damageEffect);
    
    damageEffect.style.animation = 'damageFlash 0.5s';
    setTimeout(() => damageEffect.remove(), 500);
    
    updateHUD();
    
    if (gameState.player.health <= 0) {
        gameOver();
    }
}

// ☠️ Game over
function gameOver() {
    showDialog("Você foi derrotado... Mas a lenda nunca termina! Tente novamente.");
    setTimeout(() => {
        location.reload();
    }, 3000);
}

// 🎮 Atualiza o HUD
function updateHUD() {
    const heartsContainer = document.querySelector('.hearts');
    heartsContainer.innerHTML = '';
    
    for (let i = 0; i < gameState.player.maxHealth; i++) {
        const heart = document.createElement('span');
        heart.className = 'heart';
        if (i >= gameState.player.health) {
            heart.style.opacity = '0.3';
        }
        heartsContainer.appendChild(heart);
    }
    
    document.querySelector('.rupees').innerHTML = `${gameState.player.rupees} <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyLDIwQTgsOCAwIDAsMSA0LDEyQTgsOCAwIDAsMSAxMiw0QTgsOCAwIDAsMSAyMCwxMkE4LDggMCAwLDEgMTIsMjBNMTIsMkExMCwxMCAwIDAsMCAyLDEyQTEwLDEwIDAgMCwwIDEyLDIyQTEwLDEwIDAgMCwwIDIyLDEyQTEwLTEwIDAgMCwwIDEyLDIiIGZpbGw9IiMwMDg4ZmYiLz48L3N2Zz4=" alt="Rupee">`;
    
    document.querySelector('.keys').innerHTML = `${gameState.player.keys} <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTcsMTdBMiwyIDAgMCwwIDksMTlIMjlBMiwyIDAgMCwwIDIxLDE3VjEzSDlBMiwyIDAgMCwwIDcsMTFWOUgxOVY3SDlBMiwyIDAgMCwwIDcsOVY3QTIsMiAwIDAsMCA5LDVIMjlBMiwyIDAgMCwwIDIxLDdWMTdNOSw5SDIxVjExSDlWOU0xNSwxM1YxNUgxN1YxM0gxNVoiIGZpbGw9IiNmZmZmMDAiLz48L3N2Zz4=" alt="Key">`;
}

// 💬 Mostra diálogo
function showDialog(text) {
    gameState.inDialog = true;
    const dialogBox = document.getElementById('dialog-box');
    dialogBox.querySelector('.dialog-content').textContent = text;
    dialogBox.style.display = 'block';
    setTimeout(() => dialogBox.style.opacity = '1', 10);
}

// ❌ Fecha diálogo
function closeDialog() {
    gameState.inDialog = false;
    const dialogBox = document.getElementById('dialog-box');
    dialogBox.style.opacity = '0';
    setTimeout(() => dialogBox.style.display = 'none', 500);
}

// 👾 Spawn de inimigos contínuo
function startEnemySpawner() {
    setInterval(() => {
        if (gameState.enemies.length < 10) {
            createEnemy();
        }
    }, config.enemySpawnRate);
}

// 👾 Cria um inimigo
function createEnemy() {
    const gameMap = document.getElementById('game-map');
    const player = gameState.player;
    
    // Posição aleatória, mas não muito perto do jogador
    let x, y;
    do {
        x = Math.random() * (config.mapWidth - 100) + 50;
        y = Math.random() * (config.mapHeight - 100) + 50;
    } while (Math.abs(x - player.x) < 200 && Math.abs(y - player.y) < 200);
    
    const enemy = {
        x,
        y,
        speedX: Math.random() * 2 - 1,
        speedY: Math.random() * 2 - 1,
        health: 2
    };
    
    gameState.enemies.push(enemy);
    
    const enemyElement = document.createElement('div');
    enemyElement.className = 'enemy';
    enemyElement.style.left = `${enemy.x - 24}px`;
    enemyElement.style.top = `${enemy.y - 24}px`;
    gameMap.appendChild(enemyElement);
}

// ☠️ Remove um inimigo
function removeEnemy(index) {
    const enemyElement = document.querySelectorAll('.enemy')[index];
    enemyElement.style.transition = 'all 0.5s';
    enemyElement.style.transform = 'scale(0)';
    enemyElement.style.opacity = '0';
    
    setTimeout(() => {
        enemyElement.remove();
        gameState.enemies.splice(index, 1);
    }, 500);
}

// ✨ Cria partículas de efeito
function createParticles(x, y, count, color) {
    const particlesContainer = document.getElementById('particles');
    
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.backgroundColor = color;
        particle.style.width = `${5 + Math.random() * 10}px`;
        particle.style.height = particle.style.width;
        particle.style.borderRadius = '50%';
        particle.style.position = 'absolute';
        particle.style.opacity = '0.8';
        
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        const lifetime = 500 + Math.random() * 1000;
        
        particlesContainer.appendChild(particle);
        
        const startTime = Date.now();
        
        function updateParticle() {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / lifetime;
            
            if (progress >= 1) {
                particle.remove();
                return;
            }
            
            particle.style.transform = `translate(${Math.cos(angle) * speed * elapsed/10}px, ${Math.sin(angle) * speed * elapsed/10}px)`;
            particle.style.opacity = `${0.8 * (1 - progress)}`;
            
            requestAnimationFrame(updateParticle);
        }
        
        updateParticle();
    }
}

// ✨ Atualiza partículas
function updateParticles() {
    // Implementação mais sofisticada poderia ir aqui
}

// 🎮 Inicia o jogo quando a página carrega
window.addEventListener('load', initGame);

// 🛠️ Utilitários
function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}