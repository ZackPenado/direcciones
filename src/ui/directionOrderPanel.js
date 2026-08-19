import Phaser from 'phaser';

export default class DirectionOrderPanel {
  constructor(scene, destination, instructions, onSubmit) {
    this.scene = scene;
    this.instructions = instructions;
    this.onSubmit = onSubmit;
    this.selected = [];
    this.elements = [];
    this.render(destination);
  }

  render(destination) {
    const add = (element) => {
      element.setDepth(30);
      this.elements.push(element);
      return element;
    };
    add(this.scene.add.rectangle(400, 300, 720, 525, 0x14202b, 0.96));
    add(this.scene.add.text(400, 85, `Un habitante necesita llegar a ${destination}.\nOrdena las indicaciones para ayudarle:`, {
      fontSize: '21px', color: '#ffffff', align: 'center', wordWrap: { width: 620 }
    }).setOrigin(0.5));
    this.answerText = add(this.scene.add.text(400, 185, '', {
      fontSize: '15px', color: '#b7f7c5', align: 'center', wordWrap: { width: 590 }, lineSpacing: 3
    }).setOrigin(0.5));

    Phaser.Utils.Array.Shuffle([...this.instructions]).forEach((instruction, index) => {
      const option = add(this.scene.add.text(400, 290 + index * 74, instruction, {
        fontSize: '16px', color: '#ffffff', backgroundColor: '#315069', padding: { x: 12, y: 9 },
        align: 'center', wordWrap: { width: 570 }
      }).setOrigin(0.5).setInteractive());
      option.on('pointerdown', () => this.selectInstruction(instruction, option));
    });

    const validate = add(this.scene.add.text(400, 530, 'Validar indicaciones', {
      fontSize: '19px', color: '#ffffff', backgroundColor: '#218c4f', padding: { x: 16, y: 9 }
    }).setOrigin(0.5).setInteractive());
    validate.on('pointerdown', () => this.submit());
  }

  selectInstruction(instruction, option) {
    this.selected.push(instruction);
    this.answerText.setText(this.selected.map((item, index) => `${index + 1}. ${item}`).join('\n'));
    option.disableInteractive().setAlpha(0.35);
  }

  submit() {
    const isCorrect = this.selected.length === this.instructions.length
      && this.selected.every((instruction, index) => instruction === this.instructions[index]);
    this.onSubmit(isCorrect);
  }

  destroy() { this.elements.forEach((element) => element.destroy()); }
}
