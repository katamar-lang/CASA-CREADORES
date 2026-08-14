import jwt from "jsonwebtoken";

// Los secretos se leen en cada uso, no al importar el módulo: si se leyeran
// arriba, cualquier import que ocurriera antes de `dotenv.config()` los
// congelaría como `undefined` y los tokens fallarían en tiempo de ejecución
// con un error opaco. `assertRequiredEnv()` garantiza que existen al arrancar.
function requireSecret(name: "JWT_ACCESS_SECRET" | "JWT_REFRESH_SECRET"): string {
  const value = (process.env[name] || "").trim();
  if (!value) throw new Error(`Falta la variable de entorno ${name}.`);
  return value;
}

const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

export interface JwtPayload {
  userId: string;
  role: string;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, requireSecret("JWT_ACCESS_SECRET"), {
    expiresIn: ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, requireSecret("JWT_REFRESH_SECRET"), {
    expiresIn: REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, requireSecret("JWT_ACCESS_SECRET")) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, requireSecret("JWT_REFRESH_SECRET")) as JwtPayload;
}
