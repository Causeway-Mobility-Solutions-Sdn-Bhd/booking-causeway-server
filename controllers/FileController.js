const asyncHandler = require("express-async-handler");
const hqApi = require("../hq/hqApi");
const multer = require('multer');
const FormData = require('form-data');

// Configure multer for in-memory file handling
const upload = multer({ storage: multer.memoryStorage() });

// @DESC Upload a file to the external API
// @Route POST /api/file/upload
// @Access Private
const uploadFile = asyncHandler(async (req, res) => {
  try {
    const { item_id, item_type, filename, field_id } = req.body;
    const file = req.file;
 
    if (!item_id || !item_type || !filename || !field_id || !file) {
      return res
        .status(400)
        .json({ message: "All fields and file are required" });
    }

    const formData = new FormData();
    formData.append("item_id", item_id);
    formData.append("item_type", item_type);
    formData.append("filename", filename);
    formData.append("field_id", field_id);
    formData.append("file", file.buffer, file.originalname);

    // Send the data to the external API
    const response = await hqApi.post("files/upload", formData, {
      headers: {
        ...formData.getHeaders(), 
      },
    });

    res.status(200).json(response.data.data);
  } catch (error) {
    console.error("Error uploading file:", error.message || error);

    if (error.response) {
      return res.status(error.response.status).json({
        message: error.response.data?.message || "Failed to upload file",
      });
    }

    res
      .status(500)
      .json({ message: "An error occurred while uploading the file" });
  }
});

module.exports = {
  uploadFile: [upload.single('file'), uploadFile]
};

