import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import userRoutes from "./user.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.get("/me", requireAuth, (req, res) => {
  const { id, email, name, role } = req.user as Record<string, unknown>;
  res.json({ user: { id, email, name, role } });
});

router.use("/users", userRoutes);

export default router;
