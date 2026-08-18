import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        this.load.path = './public/assets/';
        this.load.image('player', 'cipitillo.png');
    }

    create() {
        // Menú de pausa
        this.pauseMenu = null;

        // Player
        this.player = this.physics.add.sprite(400, 300, 'player');
        this.player.setScale(0.07);
        this.player.setCollideWorldBounds(true);

        // Controles
        this.cursors = this.input.keyboard.createCursorKeys();

        // Timer (5 minutos)
        this.timeLeft = 300;

        this.timerText = this.add.text(10, 10, 'Tiempo: 300', {
            fontSize: '16px',
            fill: '#fff'
        });

        this.gameTimer = this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                if (this.isGamePaused) return;

                this.timeLeft--;
                this.timerText.setText('Tiempo: ' + this.timeLeft);

                if (this.timeLeft <= 0) {
                    this.gameOver();
                }
            }
        });

        // Botones Play y Pause
        this.pauseBtn = this.add.text(500, 10, '⏸ Pause', {
            fontSize: '16px',
            fill: '#fff',
            backgroundColor: '#333',
            padding: { x: 8, y: 4 }
        })
            .setInteractive()
            .on('pointerdown', () => this.pauseGame());

        // Flag para pausar escena
        this.isGamePaused = false;

        this.playBtn = this.add.text(500, 10, '▶ Play', {
            fontSize: '16px',
            fill: '#fff',
            backgroundColor: '#333',
            padding: { x: 8, y: 4 }
        })
            .setInteractive()
            .on('pointerdown', () => this.playGame());

        this.playBtn.setVisible(false);

        // Grupo de calles (zonas válidas)
        this.streets = [
            {
                name: "5ta avenida",
                rect: new Phaser.Geom.Rectangle(100, 250, 600, 90)
            },
            {
                name: "calle central",
                rect: new Phaser.Geom.Rectangle(350, 100, 90, 400)
            }
        ];

        // Modelando el mapa
        // En create() o en un módulo separado
        this.nodes = {
            A: { x: 100, y: 285 }, // izquierda
            B: { x: 400, y: 285 }, // centro (cruce)
            C: { x: 700, y: 285 }, // derecha
            D: { x: 400, y: 100 }, // arriba
            E: { x: 400, y: 500 }  // abajo
        };

        // Conexiones (bidireccionales)
        this.graph = {
            A: ['B'],
            B: ['A', 'C', 'D', 'E'],
            C: ['B'],
            D: ['B'],
            E: ['B']
        };

        // Mapea cada arista a una calle
        this.edgeStreet = {
            'A-B': '5ta avenida',
            'B-C': '5ta avenida',
            'B-D': 'calle central',
            'B-E': 'calle central'
        };

        this.graphics = this.add.graphics();
        this.graphics.lineStyle(2, 0x00ff00);

        this.streets.forEach(street => {
            this.graphics.strokeRectShape(street.rect);

            this.add.text(
                street.rect.x + 80,
                street.rect.y - 20,
                street.name,
                {
                    fontSize: '12px',
                    fill: '#00ff00'
                }
            );
        });

        this.places = [
            {
                name: 'Iglesia',
                zone: new Phaser.Geom.Rectangle(650, 250, 80, 70),
                street: "5ta avenida",
                visited: false,
                node: 'C'
            },
            {
                name: 'Alcaldía',
                zone: new Phaser.Geom.Rectangle(100, 250, 80, 70),
                street: "5ta avenida",
                visited: false,
                node: 'A'
            }
        ];

        this.graphics.lineStyle(2, 0xff0000);

        this.places.forEach(place => {
            this.graphics.strokeRectShape(place.zone);

            this.add.text(place.zone.x, place.zone.y - 15, place.name, {
                fontSize: '12px',
                fill: '#ff0000'
            });
        });

        // Reto 1: Preguntar dirección
        this.hasDoneFirstQuestion = false;

        this.currentQuestion = {
            question: "Ordena la oración:",
            correct: ["¿", "Dónde", "queda", "la", "iglesia", "?"],
            options: ["iglesia", "¿", "Dónde", "la", "queda", "?"]
        };

        // Reto 2: Seguir direcciones
        this.currentMission = {
            steps: [
                { type: "street", value: "5ta avenida" },
                { type: "turn", value: "right", ref: "Banco" },
                { type: "reach", value: "Iglesia" }
            ],
            currentStep: 0
        };

        this.selectedWords = [];

        // Detectar posición previa del player
        this.prevPosition = { x: this.player.x, y: this.player.y };
    }

    update() {
        if (this.isQuestionActive || this.isGamePaused) return; // 🚫 bloquea movimiento

        const speed = 150;

        let newX = this.player.x;
        let newY = this.player.y;

        if (this.cursors.left.isDown) {
            newX -= speed * 0.016;
        } else if (this.cursors.right.isDown) {
            newX += speed * 0.016;
        }

        if (this.cursors.up.isDown) {
            newY -= speed * 0.016;
        } else if (this.cursors.down.isDown) {
            newY += speed * 0.016;
        }

        // Validar si la nueva posición está en calle
        if (this.isOnStreet(newX, newY)) {
            this.player.setPosition(newX, newY);
        }

        this.checkPlaces();

        this.checkMissionProgress();

        // Debug dinamico en tiempo real
        /* const currentStreet = this.isOnStreet(this.player.x, this.player.y);

        if (currentStreet) {
            console.log("Estás en:", currentStreet.name);
        } */
    }

    gameOver() {
        this.scene.pause();

        this.add.text(200, 250, '⏰ Tiempo agotado', {
            fontSize: '28px',
            fill: '#ff0000'
        });

        this.add.text(200, 300, 'La Siguanaba te atrapó 👻', {
            fontSize: '22px',
            fill: '#fff'
        });
    }

    isOnStreet(nextX, nextY) {
        const bounds = this.player.getBounds();

        const futureBounds = new Phaser.Geom.Rectangle(
            nextX - bounds.width / 2,
            nextY - bounds.height / 2,
            bounds.width,
            bounds.height
        );

        return this.streets.find(street =>
            Phaser.Geom.Rectangle.ContainsRect(street.rect, futureBounds)
        );
    }

    checkPlaces() {
        this.places.forEach(place => {
            if (!place.visited &&
                Phaser.Geom.Rectangle.Contains(place.zone, this.player.x, this.player.y)) {

                place.visited = true;
                this.onReachPlace(place);
            }
        });
    }

    onReachPlace(place) {
        if (!this.hasDoneFirstQuestion) {
            this.hasDoneFirstQuestion = true;
            this.showQuestion();
            return; // importante: no continuar flujo normal
        }
    }

    showQuestion() {
        this.isQuestionActive = true;
        this.selectedWords = []; // 🔥 importante resetear

        // Fondo
        this.questionUI = [];

        const bg = this.add.rectangle(400, 300, 700, 400, 0x000000, 0.8);
        this.questionUI.push(bg);

        const title = this.add.text(250, 120, this.currentQuestion.question, {
            fontSize: '20px',
            fill: '#fff'
        });
        this.questionUI.push(title);

        this.answerText = this.add.text(200, 180, "", {
            fontSize: '22px',
            fill: '#00ff00'
        });
        this.questionUI.push(this.answerText);

        this.optionTexts = [];

        this.currentQuestion.options.forEach((word, index) => {
            const txt = this.add.text(200 + (index * 100), 300, word, {
                fontSize: '18px',
                backgroundColor: '#333',
                padding: { x: 5, y: 5 }
            })
                .setInteractive()
                .on('pointerdown', () => this.selectWord(word, txt));

            this.optionTexts.push(txt);
            this.questionUI.push(txt);
        });

        const btn = this.add.text(350, 400, "Validar", {
            fontSize: '20px',
            backgroundColor: '#00aa00',
            padding: { x: 10, y: 5 }
        })
            .setInteractive()
            .on('pointerdown', () => this.validateAnswer());

        this.questionUI.push(btn);
    }

    selectWord(word, textObj) {
        this.selectedWords.push(word);

        this.answerText.setText(this.selectedWords.join(" "));

        textObj.disableInteractive();
        textObj.setAlpha(0.5);
    }

    validateAnswer() {
        const correct = this.currentQuestion.correct.join(" ");
        const user = this.selectedWords.join(" ");

        if (user === correct) {
            this.onCorrectAnswer();
        } else {
            this.onWrongAnswer();
        }
    }

    onCorrectAnswer() {
        this.clearQuestionUI();
        this.isQuestionActive = false;

        this.showTemporaryMessage(250, 250, "✅ Correcto!", {
            fontSize: '24px',
            fill: '#00ff00'
        });

        // 🔥 Generar misión real
        this.time.delayedCall(1000, () => {
            this.startMissionFromPlayer();
        });
    }

    onWrongAnswer() {
        this.isQuestionActive = true;

        this.add.text(200, 250, "❌ Incorrecto...", {
            fontSize: '24px',
            fill: '#ff0000'
        });

        this.add.text(180, 300, "La Siguanaba te atrapó 👻", {
            fontSize: '22px',
            fill: '#fff'
        });

        // Aquí luego metemos animación
    }

    clearQuestionUI() {
        this.questionUI.forEach(el => el.destroy());
        this.questionUI = [];
    }

    checkMissionProgress() {
        if (!this.currentMission) return;

        const step = this.currentMission.steps[this.currentMission.currentStep];
        if (!step) return;

        const currentStreet = this.isOnStreet(this.player.x, this.player.y);

        switch (step.type) {

            case "street":
                if (currentStreet && currentStreet.name !== step.value) {
                    this.failMission();
                    return;
                }

                if (currentStreet && currentStreet.name === step.value) {
                    console.log("✔ Paso 1 correcto");
                    this.currentMission.currentStep++;
                }
                break;

            case "turn":
                this.checkTurn(step);
                break;

            case "reach":
                this.checkReach(step);
                break;
        }
    }

    checkTurn(step) {
        const dx = this.player.x - this.prevPosition.x;
        const dy = this.player.y - this.prevPosition.y;

        const movingRight = dx > 0;
        const movingLeft = dx < 0;
        const movingUp = dy < 0;
        const movingDown = dy > 0;

        // Simplificación: detectar cambio de dirección
        if (movingRight && step.value === "right") {
            console.log("✔ Giro correcto");
            this.currentMission.currentStep++;
        }

        this.prevPosition = { x: this.player.x, y: this.player.y };
    }

    checkReach(step) {
        const place = this.places.find(p => p.name === step.value);

        if (
            place &&
            Phaser.Geom.Rectangle.Contains(place.zone, this.player.x, this.player.y)
        ) {
            console.log("🎉 Llegaste correctamente");
            this.completeMission();
        }
    }

    completeMission() {
        this.currentMission = null;

        this.showTemporaryMessage(200, 200, "✅ Ruta completada", {
            fontSize: '24px',
            fill: '#00ff00'
        });
    }

    failMission() {
        this.currentMission = null;

        this.showTemporaryMessage(200, 250, "❌ Te perdiste...", {
            fontSize: '24px',
            fill: '#ff0000'
        });

        this.showTemporaryMessage(180, 300, "La Siguanaba te atrapó 👻", {
            fontSize: '22px',
            fill: '#fff'
        });
    }

    generateMissionGPS(startPlaceName, targetPlaceName) {
        const start = this.places.find(p => p.name === startPlaceName);
        const target = this.places.find(p => p.name === targetPlaceName);

        if (!start || !target) return;

        const path = this.findPath(start.node, target.node);

        if (!path) {
            console.log("❌ No hay ruta");
            return;
        }

        const steps = this.generateStepsFromPath(path, target);

        this.currentMission = {
            steps,
            currentStep: 0
        };

        console.log("🧭 Ruta:", path);
        console.log("📍 Steps:", steps);

        this.showMissionText();
    }

    startMissionFromPlayer() {
        const currentPlace = this.places.find(place =>
            Phaser.Geom.Rectangle.Contains(place.zone, this.player.x, this.player.y)
        );

        if (!currentPlace) {
            console.log("⚠️ No estás en un lugar válido");
            return;
        }

        // Ejemplo: siempre ir a la Iglesia (luego lo hacemos dinámico)
        this.generateMissionGPS(currentPlace.name, "Iglesia");

        this.showMissionText();
    }

    showMissionText() {
        const steps = this.currentMission.steps;

        let text = "Indicaciones:\n";

        steps.forEach((step, i) => {
            if (step.type === "street") {
                text += `${i + 1}. Ve por ${step.value}\n`;
            }

            if (step.type === "turn") {
                text += `${i + 1}. Gira a la ${step.value}\n`;
            }

            if (step.type === "reach") {
                text += `${i + 1}. Llega a ${step.value}\n`;
            }
        });

        this.missionText = this.add.text(10, 500, text, {
            fontSize: '14px',
            fill: '#ffffff',
            backgroundColor: '#000'
        });
    }

    findPath(startNode, endNode) {
        const queue = [[startNode]];
        const visited = new Set();

        while (queue.length > 0) {
            const path = queue.shift();
            const node = path[path.length - 1];

            if (node === endNode) return path;

            if (!visited.has(node)) {
                visited.add(node);

                this.graph[node].forEach(neighbor => {
                    const newPath = [...path, neighbor];
                    queue.push(newPath);
                });
            }
        }

        return null;
    }

    getDirection(from, to) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;

        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? 'right' : 'left';
        } else {
            return dy > 0 ? 'down' : 'up';
        }
    }

    getTurn(prevDir, newDir) {
        const turns = {
            up: { left: 'left', right: 'right' },
            down: { left: 'right', right: 'left' },
            left: { up: 'right', down: 'left' },
            right: { up: 'left', down: 'right' }
        };

        return turns[prevDir]?.[newDir] || null;
    }

    generateStepsFromPath(path, targetPlace) {
        const steps = [];

        let prevDir = null;

        for (let i = 0; i < path.length - 1; i++) {
            const from = this.nodes[path[i]];
            const to = this.nodes[path[i + 1]];

            const edgeKey = `${path[i]}-${path[i + 1]}`;
            const reverseKey = `${path[i + 1]}-${path[i]}`;

            const street = this.edgeStreet[edgeKey] || this.edgeStreet[reverseKey];

            const dir = this.getDirection(from, to);

            // Primer paso: calle
            if (i === 0) {
                steps.push({ type: "street", value: street });
            }

            // Detectar giro
            if (prevDir && dir !== prevDir) {
                const turn = this.getTurn(prevDir, dir);

                if (turn) {
                    steps.push({
                        type: "turn",
                        value: turn,
                        ref: "intersección"
                    });
                }
            }

            prevDir = dir;
        }

        // Último paso: destino
        steps.push({
            type: "reach",
            value: targetPlace.name
        });

        return steps;
    }

    showTemporaryMessage(x, y, text, style, duration = 3000) {
        const message = this.add.text(x, y, text, style);

        this.tweens.add({
            targets: message,
            alpha: 0,
            duration: 500,
            delay: duration - 500,
            onComplete: () => message.destroy()
        });

        return message;
    }

    pauseGame() {
        if (this.isGamePaused) return;
        this.showPauseMenu();
    }

    showPauseMenu() {
        this.isGamePaused = true;

        // Contenedor
        this.pauseMenu = this.add.container(0, 0);

        // Fondo oscuro
        const bg = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);

        // Panel
        const panel = this.add.rectangle(400, 300, 300, 250, 0x222222);

        const title = this.add.text(330, 200, "PAUSA", {
            fontSize: '28px',
            fill: '#fff'
        });

        // Botón Reanudar
        const resumeBtn = this.add.text(320, 260, "▶ Reanudar", {
            fontSize: '20px',
            backgroundColor: '#00aa00',
            padding: { x: 10, y: 5 }
        })
            .setInteractive()
            .on('pointerdown', () => this.hidePauseMenu());

        // Botón Reiniciar misión
        const restartBtn = this.add.text(300, 310, "🔄 Reiniciar misión", {
            fontSize: '18px',
            backgroundColor: '#ffaa00',
            padding: { x: 10, y: 5 }
        })
            .setInteractive()
            .on('pointerdown', () => this.restartMission());

        // Botón salir
        const exitBtn = this.add.text(340, 360, "❌ Salir", {
            fontSize: '18px',
            backgroundColor: '#aa0000',
            padding: { x: 10, y: 5 }
        })
            .setInteractive()
            .on('pointerdown', () => this.scene.restart());

        // Agregar todo al contenedor
        this.pauseMenu.add([
            bg,
            panel,
            title,
            resumeBtn,
            restartBtn,
            exitBtn
        ]);

        // Ocultar botón pause
        this.pauseBtn.setVisible(false);
    }

    hidePauseMenu() {
        this.isGamePaused = false;

        this.pauseMenu.destroy();
        this.pauseMenu = null;

        this.pauseBtn.setVisible(true);
    }

    restartMission() {
        this.hidePauseMenu();

        if (!this.currentMission) return;

        this.currentMission.currentStep = 0;

        this.showTemporaryMessage(250, 200, "🔄 Misión reiniciada", {
            fontSize: '20px',
            fill: '#ffff00'
        });
    }

    restartMission() {
        this.hidePauseMenu();

        if (!this.currentMission) return;

        this.currentMission.currentStep = 0;

        this.showTemporaryMessage(250, 200, "🔄 Misión reiniciada", {
            fontSize: '20px',
            fill: '#ffff00'
        });
    }
}