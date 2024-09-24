export class AuthenticationError extends Error {
  status: number;

  constructor(message: string) {
    super(message);
    this.name = 'Authentication error';
    this.status = 401;
  }
}
