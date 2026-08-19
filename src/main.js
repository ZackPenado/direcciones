import Phaser from 'phaser';
import GameScene from './scenes/GameScene';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 700,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: [GameScene]
};

const game = new Phaser.Game(config);
const MUSIC_SOURCE = null; // Asigna aquí una pista instrumental con licencia de uso.
let backgroundMusic = null;

// Botón iniciar
document.getElementById('startBtn').addEventListener('click', () => {
  window.playerData = { name: null };

  document.getElementById('start-screen').style.display = 'none';
  document.getElementById('game-container').style.display = 'block';

  game.scene.start('GameScene');
});

document.getElementById('registerLink').addEventListener('click', (event) => {
  event.preventDefault();
  document.getElementById('registerMessage').textContent = 'El registro opcional estará disponible en una próxima versión.';
});

if (MUSIC_SOURCE) {
  const musicBtn = document.getElementById('musicBtn');
  musicBtn.hidden = false;
  backgroundMusic = new Audio(MUSIC_SOURCE);
  backgroundMusic.loop = true;
  backgroundMusic.volume = 0.25;
  musicBtn.addEventListener('click', async () => {
    if (backgroundMusic.paused) {
      await backgroundMusic.play();
      musicBtn.textContent = '♫ Música: pausar';
    } else {
      backgroundMusic.pause();
      musicBtn.textContent = '♫ Música: reanudar';
    }
  });
}
