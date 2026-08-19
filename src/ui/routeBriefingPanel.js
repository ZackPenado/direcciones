export default class RouteBriefingPanel {
  constructor(scene, destination, instructions, onStart) {
    this.scene = scene;
    this.elements = [];
    this.render(destination, instructions, onStart);
  }

  render(destination, instructions, onStart) {
    const add = (element) => {
      element.setDepth(30);
      this.elements.push(element);
      return element;
    };
    add(this.scene.add.rectangle(400, 300, 690, 390, 0x14202b, 0.95));
    add(this.scene.add.text(400, 145, `Indicaciones para llegar a ${destination}`, {
      fontSize: '25px', color: '#ffffff', align: 'center', wordWrap: { width: 590 }
    }).setOrigin(0.5));
    add(this.scene.add.text(125, 210, instructions.map((text, index) => `${index + 1}. ${text}`).join('\n\n'), {
      fontSize: '19px', color: '#d7edf9', wordWrap: { width: 550 }, lineSpacing: 4
    }));
    const start = add(this.scene.add.text(400, 445, 'Entendido, comenzar ruta', {
      fontSize: '20px', color: '#ffffff', backgroundColor: '#218c4f', padding: { x: 16, y: 9 }
    }).setOrigin(0.5).setInteractive());
    start.on('pointerdown', onStart);
  }

  destroy() { this.elements.forEach((element) => element.destroy()); }
}
