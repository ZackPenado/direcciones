import { GAME_SETTINGS } from '../config/gameSettings';
import { GAME_SIZE, intersections, roadCells, streets } from '../data/mapData';

export function drawMap(scene, places) {
  scene.cameras.main.setBackgroundColor('#e8efe5');
  const graphics = scene.add.graphics();
  graphics.fillStyle(0xece4d3);
  graphics.fillRect(0, 0, GAME_SIZE.width, GAME_SIZE.height);
  graphics.fillStyle(0xc6d0d9);
  streets.forEach((street) => graphics.fillRectShape(street.rect));

  streets.forEach((street) => {
    const vertical = street.rect.height > street.rect.width;
    scene.add.text(
      vertical ? street.rect.centerX : street.rect.x + 10,
      vertical ? 266 : street.rect.y + 8,
      street.name,
      {
      fontSize: '12px', color: '#40505d', fontStyle: 'bold'
      }
    ).setAngle(vertical ? -90 : 0).setOrigin(vertical ? 0.5 : 0, vertical ? 0.5 : 0);
  });

  places.forEach((place) => {
    graphics.fillStyle(place.color);
    graphics.fillRoundedRect(place.building.x, place.building.y, place.building.width, place.building.height, 8);
    graphics.lineStyle(2, 0xffffff, 0.9);
    graphics.strokeRoundedRect(place.building.x, place.building.y, place.building.width, place.building.height, 8);
    scene.add.text(place.building.centerX, place.building.centerY, place.name, {
      fontSize: '12px', color: '#ffffff', align: 'center', wordWrap: { width: place.building.width - 10 }
    }).setOrigin(0.5);
  });
  Object.values(intersections).forEach((point) => {
    graphics.fillStyle(0xffffff, 0.8);
    graphics.fillCircle(point.x, point.y, 4);
  });

  drawCompass(scene);

  if (GAME_SETTINGS.showDebugGrid) {
    const debugGraphics = scene.add.graphics().setDepth(8);
    debugGraphics.lineStyle(2, 0xff3b30, 0.9);
    roadCells.forEach((cell) => {
      debugGraphics.strokeRectShape(cell.rect);
      scene.add.text(cell.rect.centerX, cell.rect.centerY, cell.id, {
        fontSize: '11px', color: '#a71d16', backgroundColor: '#ffffffbb', padding: { x: 3, y: 2 }
      }).setDepth(9).setOrigin(0.5);
    });
  }
}

function drawCompass(scene) {
  const x = 755;
  const y = 645;
  const graphics = scene.add.graphics().setDepth(10);
  graphics.fillStyle(0xffffff, 0.82);
  graphics.fillCircle(x, y, 30);
  graphics.lineStyle(2, 0x315069, 0.75);
  graphics.strokeCircle(x, y, 30);
  graphics.lineBetween(x, y - 20, x, y + 20);
  graphics.lineBetween(x - 20, y, x + 20, y);
  graphics.fillStyle(0xc24035);
  graphics.fillTriangle(x, y - 24, x - 5, y - 8, x + 5, y - 8);
  [['N', x, y - 24], ['S', x, y + 24], ['O', x - 24, y], ['E', x + 24, y]].forEach(([label, textX, textY]) => {
    scene.add.text(textX, textY, label, { fontSize: '12px', color: '#21342e', fontStyle: 'bold' }).setDepth(11).setOrigin(0.5);
  });
}
