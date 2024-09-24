export class NotFoundError extends Error {
  status: number;

  constructor(message: string) {
    super(message);
    this.name = 'Not Found error';
    this.status = 404;
  }
}
