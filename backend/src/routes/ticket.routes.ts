import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { stats, listTickets, showTicket, update, createFromEmail, assign, createMessage, polishReply, summarizeTicket } from "../controllers/ticket.controller";

const router = Router();

router.get("/stats", requireAuth, stats);
router.get("/", requireAuth, listTickets);
router.get("/:id", requireAuth, showTicket);
router.patch("/:id", requireAuth, update);
router.post("/email", createFromEmail);
router.patch("/:id/assign", requireAuth, assign);
router.post("/:id/messages", requireAuth, createMessage);
router.post("/:id/summarize", requireAuth, summarizeTicket);
router.post("/polish", requireAuth, polishReply);

export default router;
