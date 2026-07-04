import jwt from "jsonwebtoken";
import { config } from "../config.js";

const EXPIRES_IN = "7d";

export function signToken(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}
