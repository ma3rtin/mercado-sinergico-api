export class CustomError extends Error {
  constructor(
    public message: string,
    public status: number = 500,
    public cause?: unknown,
    public code?: string
  ) {
    super(message);
    this.name = this.constructor.name;

    if (cause) {
      (this as Error).cause = cause;
    }

    Error.captureStackTrace(this, this.constructor);
  }
}
