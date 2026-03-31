import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { listTickets, showTicket, update, createFromEmail, assign } from "../controllers/ticket.controller";

const router = Router();

router.get("/", requireAuth, listTickets);
router.get("/:id", requireAuth, showTicket);
router.patch("/:id", requireAuth, update);
router.post("/email", createFromEmail);
router.patch("/:id/assign", requireAuth, assign);

export default router;
