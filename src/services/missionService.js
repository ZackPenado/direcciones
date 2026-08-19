export default class MissionService {
  constructor(startPlace, targetPlace, plan) {
    this.startPlace = startPlace;
    this.targetPlace = targetPlace;
    this.path = plan.path;
    this.instructions = plan.instructions;
    this.checkpoint = plan.checkpoint;
    this.waypoints = plan.waypoints;
    this.allowedCellIds = plan.allowedCellIds;
    this.status = 'waiting-question';
    this.stepIndex = 0;
  }
  activate() { this.status = 'navigating'; }
  complete() { this.status = 'completed'; }
  get isNavigating() { return this.status === 'navigating'; }
  get currentStep() { return this.stepIndex; }
  get currentWaypoint() { return this.waypoints[this.stepIndex]; }

  reachWaypoint() {
    if (!this.isNavigating || this.stepIndex > 1) return { type: 'ignored' };
    this.stepIndex += 1;
    return { type: 'progress' };
  }

  reachDestination() {
    if (!this.isNavigating || this.stepIndex !== 2) return { type: 'ignored' };
    this.stepIndex = 3;
    this.complete();
    return { type: 'complete' };
  }

  getProgressText() {
    return this.instructions.map((instruction, index) => `${index < this.stepIndex ? '✓' : '○'} ${instruction}`).join('\n');
  }

  isCellAllowed(cellIds) {
    return cellIds.some((id) => this.allowedCellIds.includes(id));
  }
}
