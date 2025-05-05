import type { NextApiRequest, NextApiResponse } from "next";
import cloudinary from "../../config/cloudinary";
import { IncomingForm } from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const form = new IncomingForm();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ error: "Parsing form failed" });
      }

      const file = files.file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      try {
        const result = await cloudinary.uploader.upload(file[0].filepath, {
          resource_type: "auto",
        });

        return res.status(200).json({
          url: result.secure_url,
          public_id: result.public_id,
        });
      } catch (error) {
        console.error("Cloudinary upload error:", error);
        return res.status(500).json({ error: "Upload to Cloudinary failed" });
      }
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
