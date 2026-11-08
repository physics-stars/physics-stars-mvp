/** Classify the current input without saving any distance to replay later. */
export class ScrollGesture {
  private lastAt = -Infinity;
  private lastAmount = 0;
  private direction = 0;
  private decelerating = false;

  read(delta: number, now: number, fresh = now - this.lastAt > 160) {
    const amount = Math.abs(delta);
    if (!amount) return false;
    const direction = Math.sign(delta);
    if (fresh || direction !== this.direction) this.decelerating = false;
    else if (amount < this.lastAmount - 0.01) this.decelerating = true;
    else if (amount > this.lastAmount * 1.15 + 0.5) this.decelerating = false;
    this.lastAt = now;
    this.lastAmount = amount;
    this.direction = direction;
    // Once inertia starts decaying, a flat tail is still the same gesture.
    return !this.decelerating;
  }
}
