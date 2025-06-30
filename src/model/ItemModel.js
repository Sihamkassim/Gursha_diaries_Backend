const mongoose = require("mongoose");
const { Schema } = mongoose;

const moreSchema = new Schema({
  prep_time: { type: String, required: true },
  cook_time: { type: String, required: true },
  services: { type: String, required: true },
  Difficulty: { type: String, required: true },
  source: { type: String, required: true },
});

const commentSchema = new Schema({
  user: { type: String, required: true },
  comment: { type: String, required: true },
});

const ingredientsSchema = new Schema({
  name: { type: String, required: true },
  quantity: { type: String, required: true },
});

const ItemSchema = new Schema(
  {
    menuId: { type: Number, required: true },
    name: { type: String, required: true },
    thumbnail_image: { type: String, required: true },
    category: { type: String, required: true },
    instructions: { type: String, required: true },
    tags: [String],
    ingredients: { type: [ingredientsSchema], required: true },
    comments: { type: [commentSchema], required: true },
    more: { type: [moreSchema], required: true },

    
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
); // Adds createdAt and updatedAt automatically

const Item = mongoose.model("Item", ItemSchema, "items");
module.exports = Item;
