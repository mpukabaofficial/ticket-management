import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { listTickets, showTicket, createFromEmail, assign } from "../controllers/ticket.controller";

const router = Router();

router.get("/", requireAuth, listTickets);
router.get("/:id", requireAuth, showTicket);
router.post("/email", createFromEmail);
router.patch("/:id/assign", requireAuth, assign);

export default router;
