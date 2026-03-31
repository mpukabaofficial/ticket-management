import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { listUsers, createUser, updateUser, deleteUser } from "../controllers/user.controller";

const router = Router();

router.get("/", requireAuth, requireRole("ADMIN"), listUsers);
router.post("/", requireAuth, requireRole("ADMIN"), createUser);
router.put("/:id", requireAuth, requireRole("ADMIN"), updateUser);
router.delete("/:id", requireAuth, requireRole("ADMIN"), deleteUser);

export default router;
