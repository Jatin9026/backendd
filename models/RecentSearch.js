
import mongoose from "mongoose";

const recentSearchSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  query: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("RecentSearch", recentSearchSchema);
