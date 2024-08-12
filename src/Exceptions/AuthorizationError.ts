export class AuthorizationError extends Error {

    status: number;

    constructor(message: string) {
      super(message); 
      this.name = "Authorization error"; 
      this.status = 403;
    }
}