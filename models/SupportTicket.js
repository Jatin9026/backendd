import mongoose from "mongoose";
const supportTicketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: ["open", "in-progress", "resolved"],
    default: "open"
  },
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.model("SupportTicket", supportTicketSchema);
