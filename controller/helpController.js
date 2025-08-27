import Faq from "../models/faq.js";
import SupportTicket from "../models/SupportTicket.js";
import handleAsyncError from "../middleware/handleAsyncError.js";

//faq
export const getFaqs = handleAsyncError(async (req, res) => {
  const faqs = await Faq.find();
  res.status(200).json({ success: true, faqs });
});

//contact support
export const createTicket = handleAsyncError(async (req, res) => {
  const ticket = await SupportTicket.create({
    userId: req.user._id,
    subject: req.body.subject,
    message: req.body.message,
  });

  res.status(201).json({ success: true, ticket });
});

export const getMyTickets = handleAsyncError(async (req, res) => {
  const tickets = await SupportTicket.find({ userId: req.user._id });
  res.status(200).json({ success: true, tickets });
});

export const updateTicketStatus = handleAsyncError(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });

  ticket.status = req.body.status;
  await ticket.save();

  res.status(200).json({ success: true, ticket });
});
