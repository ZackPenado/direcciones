import Phaser from 'phaser';
import { GAME_SIZE, intersections, places, roadCells, streets } from '../data/mapData';
import { createDirectionQuestion } from '../data/questionsData';
import MissionService from '../services/missionService';
import { createNavigationPlan, findShortestPath } from '../services/routeService';
import { drawMap } from '../ui/mapRenderer';
import DirectionOrderPanel from '../ui/directionOrderPanel';
import RouteBriefingPanel from '../ui/routeBriefingPanel';
import WordOrderPanel from '../ui/wordOrderPanel';

export default class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  preload() {
    this.load.image('player', '/assets/cipitillo.png');
    this.load.image('siguanaba', '/assets/Siguanaba.png');
  }

  create() {
    drawMap(this, places);
    this.isGamePaused = false;
    this.gameEnded = false;
    this.timeLeft = 300;
    this.setupMission();
    this.createPlayer();
    this.createHud();
    this.cursors = this.input.keyboard.createCursorKeys();
    this.createTouchControls();
    this.createTimer();
    this.openQuestion();
  }

  setupMission() {
    this.startPlace = Phaser.Utils.Array.GetRandom(places);
    const possibleTargets = places.filter((place) => {
      const path = findShortestPath(this.startPlace.node, place.node);
      const startNode = intersections[this.startPlace.node];
      const targetNode = intersections[place.node];
      const distance = Phaser.Math.Distance.Between(startNode.x, startNode.y, targetNode.x, targetNode.y);
      return place.id !== this.startPlace.id && path?.length === 2 && distance >= 150;
    });
    this.targetPlace = Phaser.Utils.Array.GetRandom(possibleTargets);
    const plan = createNavigationPlan(this.startPlace, this.targetPlace);
    this.mission = new MissionService(this.startPlace, this.targetPlace, plan);
  }

  createPlayer() {
    const spawn = this.startPlace.target;
    this.player = this.physics.add.sprite(spawn.centerX, spawn.centerY, 'player');
    this.player.setDisplaySize(42, 42).setCollideWorldBounds(true).setDepth(4);
  }

  createHud() {
    this.timerText = this.add.text(14, 12, '', { fontSize: '18px', color: '#14202b', fontStyle: 'bold' }).setDepth(10);
    this.missionText = this.add.text(250, 8, '', {
      fontSize: '14px', color: '#14202b', backgroundColor: '#ffffffdd', padding: { x: 9, y: 7 }, wordWrap: { width: 520 }
    }).setDepth(10);
    const greeting = window.playerData?.name ? `¡Hola, ${window.playerData.name}! ` : '';
    this.updateHud(`${greeting}Resuelve la pregunta para recibir las indicaciones.`);
  }

  createTouchControls() {
    const isTouchDevice = this.sys.game.device.input.touch || window.matchMedia('(pointer: coarse)').matches;
    if (!isTouchDevice) return;
    this.touchDirections = { left: false, right: false, up: false, down: false };
    const buttons = [
      { key: 'up', label: '▲', x: 730, y: 457 },
      { key: 'left', label: '◀', x: 680, y: 507 },
      { key: 'down', label: '▼', x: 730, y: 507 },
      { key: 'right', label: '▶', x: 780, y: 507 }
    ];
    buttons.forEach(({ key, label, x, y }) => {
      const button = this.add.text(x, y, label, {
        fontSize: '24px', color: '#ffffff', backgroundColor: '#315069cc', padding: { x: 12, y: 7 }
      }).setDepth(15).setOrigin(0.5).setInteractive();
      button.on('pointerdown', () => { this.touchDirections[key] = true; });
      button.on('pointerup', () => { this.touchDirections[key] = false; });
      button.on('pointerout', () => { this.touchDirections[key] = false; });
    });
    this.input.on('pointerup', () => Object.keys(this.touchDirections).forEach((key) => { this.touchDirections[key] = false; }));
  }

  createTimer() {
    this.time.addEvent({ delay: 1000, loop: true, callback: () => {
      if (this.isGamePaused) return;
      this.timeLeft -= 1;
      this.updateHud();
      if (this.timeLeft <= 0) this.endGame(false, '⏰ Se acabó el tiempo. La Siguanaba te encontró.');
    }});
  }

  updateHud(message) {
    this.timerText?.setText(`Tiempo: ${this.timeLeft}s`);
    if (message) this.missionText?.setText(message);
  }

  openQuestion() {
    this.isGamePaused = true;
    const question = createDirectionQuestion(this.targetPlace);
    this.questionPanel = new WordOrderPanel(this, question, (isCorrect) => this.handleQuestionAnswer(isCorrect));
  }

  handleQuestionAnswer(isCorrect) {
    if (!isCorrect) {
      this.questionPanel.destroy();
      this.endGame(false, '❌ La oración no es correcta. La Siguanaba te atrapó.');
      return;
    }
    this.questionPanel.destroy();
    this.showRouteBriefing();
  }

  showRouteBriefing() {
    this.routeBriefing = new RouteBriefingPanel(
      this,
      this.targetPlace.name,
      this.mission.instructions,
      () => this.beginRoute()
    );
  }

  beginRoute() {
    this.routeBriefing.destroy();
    this.mission.activate();
    this.isGamePaused = false;
    this.createDestinationMarker();
    this.showActiveInstruction();
  }

  update() {
    if (this.isGamePaused || !this.mission?.isNavigating) return;
    const speed = 145;
    let x = this.player.x;
    let y = this.player.y;
    if (this.cursors.left.isDown || this.touchDirections?.left) x -= speed / 60;
    if (this.cursors.right.isDown || this.touchDirections?.right) x += speed / 60;
    if (this.cursors.up.isDown || this.touchDirections?.up) y -= speed / 60;
    if (this.cursors.down.isDown || this.touchDirections?.down) y += speed / 60;
    if (this.isOnStreet(x, y)) this.player.setPosition(x, y);
    this.checkRouteCells();
    if (this.gameEnded) return;
    this.checkWaypoint();
    this.checkDestination();
  }

  isOnStreet(x, y) {
    const bounds = this.player.getBounds();
    const futureBounds = new Phaser.Geom.Rectangle(x - bounds.width / 2, y - bounds.height / 2, bounds.width, bounds.height);
    return streets.some((street) => Phaser.Geom.Rectangle.ContainsRect(street.rect, futureBounds));
  }

  checkRouteCells() {
    const currentCellIds = roadCells
      .filter((cell) => Phaser.Geom.Rectangle.Contains(cell.rect, this.player.x, this.player.y))
      .map((cell) => cell.id);
    if (!this.mission.isCellAllowed(currentCellIds)) {
      this.endGame(false, '❌ Te saliste de la ruta indicada. La Siguanaba te atrapó.');
    }
  }

  createDestinationMarker() {
    const target = this.targetPlace.target;
    this.routeMarker = this.add.circle(target.centerX, target.centerY, 15, 0xffd54a, 0.8).setDepth(3);
    this.tweens.add({ targets: this.routeMarker, scale: 1.35, duration: 500, yoyo: true, repeat: -1 });
  }

  checkWaypoint() {
    const waypoint = this.mission.currentWaypoint;
    if (!waypoint) return;
    if (Phaser.Math.Distance.Between(this.player.x, this.player.y, waypoint.x, waypoint.y) <= 14) {
      this.mission.reachWaypoint();
      this.confirmStep(`✓ Paso ${this.mission.currentStep} completado`);
    }
  }

  checkDestination() {
    if (this.mission.currentStep !== 2) return;
    const target = this.targetPlace.target;
    if (Phaser.Math.Distance.Between(this.player.x, this.player.y, target.centerX, target.centerY) <= 18) {
      this.mission.reachDestination();
      this.startDirectionChallenge();
    }
  }

  startDirectionChallenge() {
    this.isGamePaused = true;
    this.routeMarker?.destroy();
    this.showTemporaryMessage(`¡Llegaste a ${this.targetPlace.name}! Ahora ayuda a un habitante.`, '#1e7041');
    const returnPlan = createNavigationPlan(this.targetPlace, this.startPlace);
    this.directionPanel = new DirectionOrderPanel(
      this,
      this.startPlace.name,
      returnPlan.instructions,
      (isCorrect) => this.handleDirectionAnswer(isCorrect)
    );
  }

  handleDirectionAnswer(isCorrect) {
    this.directionPanel.destroy();
    if (!isCorrect) {
      this.endGame(false, '❌ Las indicaciones no están en el orden correcto. La Siguanaba te atrapó.');
      return;
    }
    this.endGame(true, `🎉 ¡Excelente! Ayudaste al habitante a llegar a ${this.startPlace.name}.`);
  }

  confirmStep(text) {
    this.isGamePaused = true;
    this.showTemporaryMessage(text, '#1e7041');
    this.time.delayedCall(2000, () => {
      if (this.gameEnded) return;
      this.isGamePaused = false;
      this.showActiveInstruction();
    });
  }

  showActiveInstruction() {
    const stepNumber = this.mission.currentStep + 1;
    this.updateHud(`Paso ${stepNumber} de 3: ${this.mission.instructions[this.mission.currentStep]}`);
  }

  showTemporaryMessage(text, color) {
    const message = this.add.text(400, 90, text, {
      fontSize: '18px', color, backgroundColor: '#ffffff', padding: { x: 9, y: 6 }
    }).setDepth(12).setOrigin(0.5);
    this.tweens.add({ targets: message, alpha: 0, delay: 1300, duration: 500, onComplete: () => message.destroy() });
  }

  endGame(success, message) {
    if (this.gameEnded) return;
    this.gameEnded = true;
    this.isGamePaused = true;
    this.add.rectangle(400, 300, GAME_SIZE.width, GAME_SIZE.height, 0x0d1720, 0.82).setDepth(20);
    const playerName = window.playerData?.name;
    const finalMessage = success && playerName ? `¡${playerName}!\n${message}` : message;
    this.add.text(400, 270, finalMessage, {
      fontSize: '26px', color: success ? '#b7f7c5' : '#ffd1d1', align: 'center', wordWrap: { width: 610 }
    }).setDepth(21).setOrigin(0.5);
    if (!success) this.add.image(400, 385, 'siguanaba').setDisplaySize(105, 105).setDepth(21);
    const restart = this.add.text(400, success ? 380 : 480, 'Jugar de nuevo', {
      fontSize: '21px', color: '#ffffff', backgroundColor: '#315069', padding: { x: 16, y: 10 }
    }).setDepth(21).setOrigin(0.5).setInteractive();
    restart.on('pointerdown', () => this.scene.restart());
  }
}
