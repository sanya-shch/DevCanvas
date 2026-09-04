export class History<T> {
  private past: T[] = [];
  private future: T[] = [];
  private readonly maxEntries: number;

  constructor(maxEntries = 100) {
    this.maxEntries = maxEntries;
  }

  get canUndo(): boolean {
    return this.past.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }

  push(snapshot: T): void {
    this.past.push(snapshot);

    if (this.past.length > this.maxEntries) {
      this.past.shift();
    }

    this.future = [];
  }

  undo(current: T): T | null {
    const previous = this.past.pop();

    if (previous === undefined) {
      return null;
    }

    this.future.push(current);

    return previous;
  }

  redo(current: T): T | null {
    const next = this.future.pop();

    if (next === undefined) {
      return null;
    }

    this.past.push(current);

    if (this.past.length > this.maxEntries) {
      this.past.shift();
    }

    return next;
  }

  clear(): void {
    this.past = [];
    this.future = [];
  }
}
