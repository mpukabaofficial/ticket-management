import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { listUsers } from "../controllers/user.controller";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.get("/me", requireAuth, (req, res) => {
  const { id, email, name, role } = req.user as Record<string, unknown>;
  res.json({ user: { id, email, name, role } });
});

router.get("/users", requireAuth, requireRole("ADMIN"), listUsers);

export default router;
