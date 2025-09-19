import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { AuthRequest } from "../types.js";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET!;

export function requireAuth(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        return res
            .status(401)
            .json({ error: "Missing or invalid Authorization header" });
    }
    const token = header.slice("Bearer ".length);
    try {
        const payload = jwt.verify(token, JWT_SECRET) as {
            sub: string;
            role: string;
        };
        req.user = { id: payload.sub, role: payload.role as any };
        next();
    } catch (e) {
        return res.status(401).json({ error: "Invalid token" });
    }
}

export function requireAdmin(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role.name !== "ADMIN")
        return res.status(403).json({ error: "Forbidden" });
    next();
}
