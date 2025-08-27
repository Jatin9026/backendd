
import express from "express";
import { getFaqs, createTicket, getMyTickets, updateTicketStatus } from "../controller/helpController.js";
import { verifyUserAuth, roleBasedAccess } from "../middleware/userAuth.js";

const router = express.Router();
// FAQs
router.get("/faqs", getFaqs);
// Create ticket
router.post("/support/ticket", verifyUserAuth, createTicket);
// Get my tickets
router.get("/support/tickets", verifyUserAuth, getMyTickets);
// Update ticket status (Admin)
router.put("/admin/support/ticket/:id", verifyUserAuth, roleBasedAccess("admin"), updateTicketStatus);

export default router;
