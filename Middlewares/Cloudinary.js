import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (filePath) => {
  try {

    if (!filePath) return null;

    const ext = path.extname(filePath).toLowerCase();

    let resourceType = "raw";

    if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
      resourceType = "image";
    } else if ([".mp4", ".mov", ".mkv"].includes(ext)) {
      resourceType = "video";
    }

    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: resourceType
    });

    // remove local file after upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // optimize images
    if (resourceType === "image") {
      const optimizedImageUrl = cloudinary.url(result.public_id, {
        resource_type: "image",
        fetch_format: "auto",
        quality: "auto",
        width: 800,
        crop: "scale"
      });

      return optimizedImageUrl;
    }

    return result.secure_url;

  } catch (error) {

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    console.error("Cloudinary Upload Error:", error.message);

    return null;
  }
};

export default uploadOnCloudinary;
