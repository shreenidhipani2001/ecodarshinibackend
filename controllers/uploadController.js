export const uploadProductImagesController = async (req, res) => {
  try {
    // Multer already uploaded files to Cloudinary
    const images = req.files.map((file) => ({
      public_id: file.filename, // Cloudinary public_id
      url: file.path,           // Cloudinary URL
    }));

    // ❌ DO NOT SAVE TO DATABASE HERE
    res.status(200).json({
      message: "Images uploaded successfully",
      images,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
};
