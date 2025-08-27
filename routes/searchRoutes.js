import express from "express";
import { addSearch, getSearchData } from "../controller/searchController.js";
import { verifyUserAuth } from "../middleware/userAuth.js";
const router = express.Router();
router.post("/search", verifyUserAuth, addSearch);
router.get("/search/data", verifyUserAuth, getSearchData);
export default router;
