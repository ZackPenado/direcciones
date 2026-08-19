import Phaser from 'phaser';

export const GAME_SIZE = { width: 800, height: 700 };

// Datos del mapa separados de la escena para sustituir el arte sin tocar reglas.
export const streets = [
  { id: 'calle-15-septiembre', name: 'C. 15 de Septiembre', rect: new Phaser.Geom.Rectangle(55, 138, 690, 72) },
  { id: 'segunda-calle', name: '2a Calle Pte.', rect: new Phaser.Geom.Rectangle(55, 323, 690, 72) },
  { id: 'tercera-calle', name: '3a Calle Pte.', rect: new Phaser.Geom.Rectangle(55, 500, 690, 72) },
  { id: 'cuarta-calle', name: '4a Calle Pte.', rect: new Phaser.Geom.Rectangle(55, 625, 690, 72) },
  { id: 'avenida-espana', name: 'Av. España', rect: new Phaser.Geom.Rectangle(364, 55, 72, 625) },
  { id: 'avenida-oeste', name: 'Avenida Oeste', rect: new Phaser.Geom.Rectangle(128, 55, 62, 625) }
];

export const intersections = {
  A: { x: 159, y: 174, label: 'Avenida Oeste y C. 15 de Septiembre' },
  B: { x: 400, y: 174, label: 'Av. España y C. 15 de Septiembre' },
  C: { x: 400, y: 359, label: 'Av. España y 2a Calle Pte.' },
  D: { x: 400, y: 536, label: 'Av. España y 4a Calle Pte.' },
  E: { x: 159, y: 359, label: 'Avenida Oeste y 2a Calle Pte.' },
  F: { x: 159, y: 536, label: 'Avenida Oeste y 3a Calle Pte.' },
  G: { x: 159, y: 661, label: 'Avenida Oeste y 4a Calle Pte.' },
  H: { x: 400, y: 661, label: 'Av. España y 4a Calle Pte.' }
};

export const graph = {
  A: ['B', 'E'], B: ['A', 'C'], C: ['B', 'D', 'E'],
  D: ['C', 'F', 'H'], E: ['A', 'C', 'F'], F: ['E', 'D', 'G'],
  G: ['F', 'H'], H: ['D', 'G']
};

export const edgeStreets = {
  'A-B': 'C. 15 de Septiembre', 'A-E': 'Avenida Oeste',
  'B-C': 'Av. España', 'C-D': 'Av. España', 'C-E': '2a Calle Pte.',
  'D-F': '3a Calle Pte.', 'E-F': 'Avenida Oeste', 'D-H': 'Av. España',
  'F-G': 'Avenida Oeste', 'G-H': '4a Calle Pte.'
};

// Cuadrícula lógica invisible. Cada tramo conecta dos cruces o un destino;
// dentro de un tramo el jugador puede moverse o retroceder sin penalización.
export const roadCells = [
  { id: 'A-B', rect: new Phaser.Geom.Rectangle(159, 138, 241, 72) },
  { id: 'A-E', rect: new Phaser.Geom.Rectangle(128, 174, 62, 185) },
  { id: 'B-C', rect: new Phaser.Geom.Rectangle(364, 174, 72, 185) },
  { id: 'C-D', rect: new Phaser.Geom.Rectangle(364, 359, 72, 177) },
  { id: 'C-E', rect: new Phaser.Geom.Rectangle(159, 323, 241, 72) },
  { id: 'D-F', rect: new Phaser.Geom.Rectangle(159, 500, 241, 72) },
  { id: 'E-F', rect: new Phaser.Geom.Rectangle(128, 359, 62, 177) },
  { id: 'D-H', rect: new Phaser.Geom.Rectangle(364, 536, 72, 125) },
  { id: 'F-G', rect: new Phaser.Geom.Rectangle(128, 536, 62, 125) },
  { id: 'G-H', rect: new Phaser.Geom.Rectangle(159, 625, 241, 72) },
  { id: 'B-iglesia', rect: new Phaser.Geom.Rectangle(400, 138, 148, 72) },
  { id: 'C-alcaldia', rect: new Phaser.Geom.Rectangle(282, 323, 118, 72) },
  { id: 'F-polideportivo', rect: new Phaser.Geom.Rectangle(159, 500, 141, 72) },
  { id: 'D-escuela', rect: new Phaser.Geom.Rectangle(400, 500, 127, 72) },
  { id: 'G-mercado', rect: new Phaser.Geom.Rectangle(159, 625, 145, 72) },
  { id: 'H-biblioteca', rect: new Phaser.Geom.Rectangle(400, 625, 145, 72) }
];

// Los edificios se dibujan fuera de la calle y el área de llegada queda sobre ella.
export const places = [
  { id: 'alcaldia', name: 'Alcaldía Municipal', node: 'C', color: 0x4f8cc9,
    building: new Phaser.Geom.Rectangle(242, 230, 112, 70), target: new Phaser.Geom.Rectangle(282, 323, 72, 72), approachCell: 'C-alcaldia' },
  { id: 'iglesia', name: 'Iglesia', node: 'B', color: 0xd2a84b,
    building: new Phaser.Geom.Rectangle(468, 65, 120, 58), target: new Phaser.Geom.Rectangle(492, 138, 72, 72), approachCell: 'B-iglesia' },
  { id: 'polideportivo', name: 'Polideportivo Municipal', node: 'F', color: 0x5aa873,
    building: new Phaser.Geom.Rectangle(205, 402, 132, 72), target: new Phaser.Geom.Rectangle(228, 500, 72, 72), approachCell: 'F-polideportivo' },
  { id: 'escuela', name: 'Escuela', node: 'D', color: 0xa56ac6,
    building: new Phaser.Geom.Rectangle(462, 423, 114, 58), target: new Phaser.Geom.Rectangle(483, 500, 72, 72), approachCell: 'D-escuela' },
  { id: 'mercado', name: 'Mercado', node: 'G', color: 0xcf7a3d,
    building: new Phaser.Geom.Rectangle(205, 578, 128, 35), target: new Phaser.Geom.Rectangle(232, 625, 72, 72), approachCell: 'G-mercado' },
  { id: 'biblioteca', name: 'Biblioteca', node: 'H', color: 0x4b9aa7,
    building: new Phaser.Geom.Rectangle(462, 578, 128, 35), target: new Phaser.Geom.Rectangle(473, 625, 72, 72), approachCell: 'H-biblioteca' }
];
