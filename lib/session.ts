import type { SessionOptions } from "iron-session";
import { config } from "./config";

export interface SessionData {
  isAdmin?: boolean;
}

export const sessionOptions: SessionOptions = {
  password: config.sessionSecret,
  cookieName: "rc_admin_session",
  cookieOptions: {
    secure: config.isProd,
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 hours
  },
};
