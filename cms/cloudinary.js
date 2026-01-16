import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_NAME,
  api_key: process.env.CMS_API_KEY,
  api_secret: process.env.CMS_API_SECRET,
});

export default cloudinary;
