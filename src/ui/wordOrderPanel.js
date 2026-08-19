export default class WordOrderPanel {
  constructor(scene, question, onSubmit) {
    this.scene = scene;
    this.question = question;
    this.onSubmit = onSubmit;
    this.selected = [];
    this.elements = [];
    this.render();
  }

  render() {
    const { scene, question } = this;
    this.add(scene.add.rectangle(400, 300, 720, 410, 0x14202b, 0.94));
    this.add(scene.add.text(400, 140, question.prompt, {
      fontSize: '22px', color: '#ffffff', align: 'center', wordWrap: { width: 620 }
    }).setOrigin(0.5));
    this.answerText = scene.add.text(400, 220, '', {
      fontSize: '22px', color: '#b7f7c5', align: 'center', wordWrap: { width: 620 }
    }).setOrigin(0.5);
    this.add(this.answerText);

    question.options.forEach((word, index) => {
      const x = 145 + (index % 4) * 170;
      const y = 300 + Math.floor(index / 4) * 62;
      const option = scene.add.text(x, y, word, {
        fontSize: '17px', color: '#ffffff', backgroundColor: '#315069', padding: { x: 9, y: 7 }
      }).setOrigin(0.5).setInteractive();
      option.on('pointerdown', () => this.selectWord(word, option));
      this.add(option);
    });
    const validate = scene.add.text(400, 435, 'Validar', {
      fontSize: '20px', color: '#ffffff', backgroundColor: '#218c4f', padding: { x: 18, y: 9 }
    }).setOrigin(0.5).setInteractive();
    validate.on('pointerdown', () => this.submit());
    this.add(validate);
  }

  selectWord(word, option) {
    this.selected.push(word);
    this.answerText.setText(this.selected.join(' '));
    option.disableInteractive().setAlpha(0.4);
  }

  submit() {
    this.onSubmit(this.selected.join(' ') === this.question.correct.join(' '));
  }

  destroy() { this.elements.forEach((element) => element.destroy()); }

  add(element) {
    element.setDepth(30);
    this.elements.push(element);
  }
}
