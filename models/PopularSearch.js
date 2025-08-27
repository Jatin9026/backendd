
import mongoose from "mongoose";

const popularSearchSchema = new mongoose.Schema({
  query: { type: String, required: true },
  count: { type: Number, default: 1 }, 
});

export default mongoose.model("PopularSearch", popularSearchSchema);
