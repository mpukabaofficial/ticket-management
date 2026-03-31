import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { listTickets, showTicket, update, createFromEmail, assign, createMessage } from "../controllers/ticket.controller";

const router = Router();

router.get("/", requireAuth, listTickets);
router.get("/:id", requireAuth, showTicket);
router.patch("/:id", requireAuth, update);
router.post("/email", createFromEmail);
router.patch("/:id/assign", requireAuth, assign);
router.post("/:id/messages", requireAuth, createMessage);

export default router;
