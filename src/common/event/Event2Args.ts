export class Event2Args<T, M> {
  private handlers: ((data?: T, data2?: M) => void)[] = [];

  public on(handler: (data?: T, data2?: M) => void): void {
    this.handlers.push(handler);
  }

  public off(handler: (data?: T, data2?: M) => void): void {
    this.handlers = this.handlers.filter((h): boolean => h !== handler);
  }

  public allOff(): void {
    this.handlers = [];
  }

  public trigger(data?: T, data2?: M): void {
    if (this.handlers) {
      this.handlers.slice(0).forEach((h): void => h(data, data2));
    }
  }
}
