
const Item = require("../model/ItemModel");
const getCategory = async (req, res) => {
  const { category } = req.params;

  try {
    const items = await Item.find({
      category: { $regex: category, $options: "i" },
    });

    if (!items.length) {
      return res.status(404).json({ message: "No items found in this category" });
    }

    res.status(200).json(items);
  } catch (error) 
  {
    console.error(error);
    res.status(500).json({ message: "Server error retrieving category" });
  }
};

module.exports = {
  getCategory,
};
