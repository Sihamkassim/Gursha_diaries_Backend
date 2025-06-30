const express = require('express');
const router = express.Router();
const ItemController = require('../controllers/itemController');
const { identifier } = require('../middlewares/identification');

// Public routes (no auth)
router.get('/all-items', ItemController.getAllItems);        // Get all items
router.get('/items', ItemController.getSearchedItems);       // Get items by search query (e.g., ?q=...)
router.get('/items/:id', ItemController.getSingleItem);      // Get single item by ID

// Protected routes (require auth)
router.post('/itemss',identifier,  ItemController.createItem);    // Create new item
router.post('/comments', identifier,ItemController.addCommentToItem);
router.put('/itemss/:id', identifier, ItemController.updateItem); // Update item by ID
router.delete('/itemss/:id', identifier, ItemController.deleteItem); // Delete item by ID

module.exports = router;
