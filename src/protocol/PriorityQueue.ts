import { CrisisMessage, MessagePriority, MAX_MESSAGE_AGE_MS } from './types';

// Min-heap priority queue: lower priority number = dequeued first.
// Used for store-and-forward: when a new peer connects we drain the queue toward them.

export class MessagePriorityQueue {
  private heap: CrisisMessage[] = [];

  push(msg: CrisisMessage): void {
    this.heap.push(msg);
    this._bubbleUp(this.heap.length - 1);
    this._evictExpired();
  }

  pop(): CrisisMessage | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return top;
  }

  peek(): CrisisMessage | undefined {
    return this.heap[0];
  }

  get size(): number {
    return this.heap.length;
  }

  drainAll(): CrisisMessage[] {
    const out: CrisisMessage[] = [];
    while (this.size > 0) out.push(this.pop()!);
    return out;
  }

  private _score(msg: CrisisMessage): number {
    // Lower priority number wins; use timestamp as tiebreaker (older first)
    return msg.priority * 1e13 + msg.timestamp;
  }

  private _bubbleUp(i: number): void {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this._score(this.heap[parent]) > this._score(this.heap[i])) {
        [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
        i = parent;
      } else break;
    }
  }

  private _sinkDown(i: number): void {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this._score(this.heap[l]) < this._score(this.heap[smallest])) smallest = l;
      if (r < n && this._score(this.heap[r]) < this._score(this.heap[smallest])) smallest = r;
      if (smallest !== i) {
        [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
        i = smallest;
      } else break;
    }
  }

  private _evictExpired(): void {
    const cutoff = Date.now() - MAX_MESSAGE_AGE_MS;
    this.heap = this.heap.filter(m => m.timestamp > cutoff);
    // Rebuild heap after bulk delete
    for (let i = Math.floor(this.heap.length / 2); i >= 0; i--) this._sinkDown(i);
  }
}
