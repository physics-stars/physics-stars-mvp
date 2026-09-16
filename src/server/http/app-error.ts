/*
 * Errors "coneguts" que una ruta d'API pot convertir directament en una
 * resposta HTTP amb sentit (a diferència d'un error inesperat, que
 * `handleRouteError` converteix en un 500 genèric). Es llencen des de la
 * capa de serveis quan es detecta una violació de regles de negoci
 * (p. ex. un professor que intenta moure un alumne que no és seu).
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "No s'ha trobat el recurs sol·licitat.") {
    super(message, 404);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "No tens permís per fer aquesta acció.") {
    super(message, 403);
  }
}

export class ValidationAppError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}
