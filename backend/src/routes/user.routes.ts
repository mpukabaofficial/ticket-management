import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { listUsers, createUser, updateUser } from "../controllers/user.controller";

const router = Router();

router.get("/", requireAuth, requireRole("ADMIN"), listUsers);
router.post("/", requireAuth, requireRole("ADMIN"), createUser);
router.put("/:id", requireAuth, requireRole("ADMIN"), updateUser);

export default router;
