export class ErrorMessage {
  constructor (public readonly id: number, public readonly data: Uint8Array) {}

  public maxLength (): number {
    return 4 + 2 + this.data.byteLength;
  }
}