// NOTE: Logo upload temporarily disabled to avoid external dependency during build.
// Previous implementation using 'formidable' is commented out.
// When re-enabling, restore multipart parsing and file saving to public/upload.

import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return res.status(501).json({ error: "Logo upload disabled temporarily" });
}
