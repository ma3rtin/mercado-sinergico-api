export class CustomError extends Error {
  constructor(public message: string, public status: number = 500) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}