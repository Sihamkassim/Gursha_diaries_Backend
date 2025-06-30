const Item = require("../model/ItemModel");

const getAllItems = async (req, res) => {
  const result = await Item.find().sort({ createdAt: -1 });
  res.status(200).json(result);
};
const getSearchedItems = async (req, res) => {
  const { q } = req.query;
  try {
    let items = [];

    if (q) {
      items = await Item.find({
        name: { $regex: q, $options: "i" },
      });
    }

    if (items.length === 0) {
      return res.status(404).json({ message: "No items found" });
    }

    res.status(200).json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while searching" });
  }
};

const getSingleItem = async (req, res) => {
  const { id } = req.params;
  try {
    const item = await Item.findOne({ _id: id });
    if (!item) {
      return res.status(404).json({ message: "Item not found with this ID" });
    }
    res.json(item);
  } catch (error) {
    console.error("Error fetching item:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
const createItem = async (req, res) => {
  try {
    const userId = req.user.userId; // Extracted from token by identifier middleware

    const newItem = new Item({
      ...req.body,
      userId,
    });

    await newItem.save();

    res.status(201).json({
      message: "Item created successfully",
      item: newItem,
    });
  } catch (error) {
    console.error("Error creating item:", error.message);
    res.status(500).json({
      message: "Server error while creating item",
    });
  }
};

const deleteItem = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Item.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Item not found with this ID" });
    }

    res.status(200).json({ message: "Item deleted successfully", item: deleted });
  } catch (error) {
    console.error("Error deleting item:", error.message);
    res.status(500).json({ message: "Server error while deleting item" });
  }
};const updateItem = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const updatedItem = await Item.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedItem) {
      return res.status(404).json({ message: "Item not found with this ID" });
    }
    res.status(200).json({ message: "Item updated successfully", item: updatedItem });
  } catch (error) {
    console.error("Error updating item:", error.message);
    res.status(500).json({ message: "Server error while updating item" });
  }
};
const addCommentToItem = async (req, res) => {
  const { itemId, user, comment } = req.body;

  if (!itemId || !comment) {
    return res.status(400).json({ message: "itemId and comment are required" });
  }

  try {
    const updatedItem = await Item.findByIdAndUpdate(
      itemId,
      {
        $push: {
          comments: {
            user: user || "Anonymous",
            comment,
          },
        },
      },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200).json({
      message: "Comment added successfully",
      item: updatedItem,
    });
  } catch (error) {
    console.error("Error adding comment:", error.message);
    res.status(500).json({ message: "Server error while adding comment" });
  }
};


module.exports = {
  getAllItems,
  getSearchedItems,
  getSingleItem,
  createItem,
  deleteItem,
  updateItem, 
  addCommentToItem,  // <-- add this
};
