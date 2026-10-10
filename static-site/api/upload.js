const { v2: cloudinary } = require("cloudinary");
const { getSession } = require("./_auth.js");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Accepts a JSON body { dataUrl: "data:image/png;base64,...." } instead of
// multipart/form-data — avoids needing a multipart parser in a plain
// serverless function. The admin pages read the file with FileReader and
// send it as a data URL.
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const session = getSession(req);
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    const dataUrl = body && body.dataUrl;
    if (!dataUrl) { res.status(400).json({ error: "No file provided." }); return; }

    // Keeps category banners apart from product photos in Cloudinary;
    // anything other than the known folder names falls back to products.
    const folder = body.folder === "categories" ? "antique-home/categories" : body.folder === "instagram" ? "antique-home/instagram" : "antique-home/products";
    const result = await cloudinary.uploader.upload(dataUrl, { folder });
    res.status(200).json({ url: result.secure_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed." });
  }
};
