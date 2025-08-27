// controller/searchController.js
import RecentSearch from "../models/RecentSearch.js";
import PopularSearch from "../models/PopularSearch.js";
import Category from "../models/Category.js";
import handleAsyncError from "../middleware/handleAsyncError.js";

//search
export const addSearch = handleAsyncError(async (req, res) => {
  const { query } = req.body;
  const userId = req.user._id;
  await RecentSearch.create({ userId, query });
  const userSearches = await RecentSearch.find({ userId })
    .sort({ createdAt: -1 })
    .limit(5);
  const popular = await PopularSearch.findOne({ query });
  if (popular) {
    popular.count += 1;
    await popular.save();
  } else {
    await PopularSearch.create({ query });
  }
  res.status(201).json({
    success: true,
    recentSearches: userSearches,
  });
});

//get search data
export const getSearchData = handleAsyncError(async (req, res) => {
  const userId = req.user._id;

  const recentSearches = await RecentSearch.find({ userId })
    .sort({ createdAt: -1 })
    .limit(5);

  const popularSearches = await PopularSearch.find()
    .sort({ count: -1 })
    .limit(8);

  const categories = await Category.find();

  res.status(200).json({
    success: true,
    recentSearches,
    popularSearches,
    categories,
  });
});
