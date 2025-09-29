import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const formidable: any = require("formidable");

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

  const uploadDir = path.join(process.cwd(), "public", "upload");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const form = formidable({
    multiples: false,
    keepExtensions: true,
    uploadDir,
  });

  form.parse(req as any, async (err: any, _fields: any, files: any) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Upload failed" });
    }
    try {
      const file: any = files?.file;
      if (!file) return res.status(400).json({ error: "No file uploaded" });

      const originalName: string =
        file.originalFilename || file.newFilename || "logo";
      const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const finalName = `${Date.now()}_${safeName}`;
      const finalPath = path.join(uploadDir, finalName);

      if (file.filepath && file.filepath !== finalPath) {
        fs.renameSync(file.filepath, finalPath);
      }

      const publicUrlPath = `/upload/${finalName}`;
      return res.json({ url: publicUrlPath });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Failed to process file" });
    }
  });
}
