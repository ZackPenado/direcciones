import Phaser from 'phaser';
import GameScene from './scenes/GameScene';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
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

// Botón iniciar
document.getElementById('startBtn').addEventListener('click', () => {
  // const name = document.getElementById('name').value;
  // const email = document.getElementById('email').value;

  // window.playerData = { name, email };

  document.getElementById('start-screen').style.display = 'none';
  document.getElementById('game-container').style.display = 'block';

  game.scene.start('GameScene');
});