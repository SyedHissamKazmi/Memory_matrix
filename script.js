// Game Configuration
const difficulties = {
    easy: { pairs: 6, time: 120 },
    medium: { pairs: 8, time: 180 },
    hard: { pairs: 12, time: 240 }
};

// Game State
const game = {
    difficulty: 'medium',
    flippedCards: [],
    moves: 0,
    matches: 0,
    timer: null,
    time: 0,
    sound: true,
    bestScore: Number(localStorage.getItem('bestScore')) || 0
};

// DOM references
const movesEl = document.getElementById('moves');
const timerEl = document.getElementById('timer');
const matchesEl = document.getElementById('matches');
const bestEl = document.getElementById('best');
const gridEl = document.getElementById('grid');
const restartBtn = document.getElementById('restartBtn');
const difficultyBtn = document.getElementById('difficultyBtn');
const soundBtn = document.getElementById('soundBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');

// Audio context for sound effects
let audioCtx = null;

function playBeep(type) {
    if (!game.sound) return;

    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'match') {
        osc.frequency.value = 800;
        gain.gain.value = 0.1;
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'flip') {
        osc.frequency.value = 400;
        gain.gain.value = 0.05;
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
    } else if (type === 'mismatch') {
        osc.frequency.value = 200;
        gain.gain.value = 0.05;
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    }
}

function initGame() {
    const config = difficulties[game.difficulty];
    game.flippedCards = [];
    game.moves = 0;
    game.matches = 0;
    game.time = config.time;

    clearInterval(game.timer);
    updateDisplay();
    generateGrid(config.pairs);
    startTimer();
}

function generateGrid(pairs) {
    gridEl.innerHTML = '';

    let cards = [];
    for (let i = 1; i <= pairs; i++) {
        cards.push(i, i);
    }
    cards.sort(() => Math.random() - 0.5);

    cards.forEach((value) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.value = value;

        card.innerHTML = `
            <div class="card-inner">
                <div class="card-face card-front">?</div>
                <div class="card-face card-back">${value}</div>
            </div>
        `;

        card.addEventListener('click', () => flipCard(card));
        gridEl.appendChild(card);
    });

    const cols = pairs <= 6 ? 3 : 4;
    gridEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
}

function flipCard(card) {
    if (
        game.flippedCards.length >= 2 ||
        card.classList.contains('flipped') ||
        card.classList.contains('matched')
    ) return;

    card.classList.add('flipped');
    game.flippedCards.push(card);
    playBeep('flip');

    if (game.flippedCards.length === 2) {
        game.moves++;
        checkMatch();
    }

    updateDisplay();
}

function checkMatch() {
    const [card1, card2] = game.flippedCards;

    if (card1.dataset.value === card2.dataset.value) {
        game.matches++;
        card1.classList.add('matched');
        card2.classList.add('matched');
        playBeep('match');

        if (game.matches === difficulties[game.difficulty].pairs) {
            endGame();
        }

        game.flippedCards = [];
    } else {
        playBeep('mismatch');
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            game.flippedCards = [];
        }, 1000);
    }
}

function startTimer() {
    clearInterval(game.timer);
    game.timer = setInterval(() => {
        game.time--;
        timerEl.textContent = formatTime(game.time);
        if (game.time <= 0) {
            endGame();
        }
    }, 1000);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function restartGame() {
    clearInterval(game.timer);
    initGame();
}

function changeDifficulty() {
    const levels = ['easy', 'medium', 'hard'];
    const current = levels.indexOf(game.difficulty);
    game.difficulty = levels[(current + 1) % levels.length];
    restartGame();
}

function toggleSound() {
    game.sound = !game.sound;
    soundBtn.textContent = game.sound ? '🔊 Sound' : '🔇 Muted';
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

function endGame() {
    clearInterval(game.timer);

    const score = game.matches * 100 - game.moves * 5;
    if (score > game.bestScore) {
        game.bestScore = score;
        localStorage.setItem('bestScore', score);
    }

    setTimeout(() => {
        alert(`Game Over!\nMatches: ${game.matches}\nMoves: ${game.moves}\nScore: ${score}`);
        restartGame();
    }, 500);
}

function updateDisplay() {
    movesEl.textContent = game.moves;
    matchesEl.textContent = game.matches;
    bestEl.textContent = game.bestScore;
    timerEl.textContent = formatTime(game.time);
}

// Event listeners
restartBtn.addEventListener('click', restartGame);
difficultyBtn.addEventListener('click', changeDifficulty);
soundBtn.addEventListener('click', toggleSound);
fullscreenBtn.addEventListener('click', toggleFullscreen);

// Initialize on load
window.onload = initGame;

// Mobile touch support
document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) e.preventDefault();
}, { passive: false });