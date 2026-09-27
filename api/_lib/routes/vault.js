const express = require("express");
const vault = require("../controllers/vaultController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);
router.get("/", vault.getVault);
router.put("/", vault.putVault);

module.exports = router;
