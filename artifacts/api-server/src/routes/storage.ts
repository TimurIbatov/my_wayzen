import type { File } from "@google-cloud/storage";
import { RequestUploadUrlBody, RequestUploadUrlResponse } from "@workspace/api-zod";
import { Router, type IRouter, type Request, type Response } from "express";
import { requireAdminId } from "./helpers";
import { ObjectNotFoundError, ObjectStorageService } from "../lib/objectStorage";

const router: IRouter = Router();
const storage = new ObjectStorageService();
const supportedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

async function streamFile(
  file: File,
  res: Response,
  imagesOnly = false,
): Promise<void> {
  const [metadata] = await file.getMetadata();
  if (
    imagesOnly &&
    (typeof metadata.contentType !== "string" ||
      !supportedImageTypes.has(metadata.contentType))
  ) {
    res.status(415).json({ error: "Only JPG, PNG, and WebP images are served here." });
    return;
  }
  res.setHeader(
    "Content-Type",
    typeof metadata.contentType === "string"
      ? metadata.contentType
      : "application/octet-stream",
  );
  res.setHeader("Content-Disposition", "inline");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (metadata.size) res.setHeader("Content-Length", String(metadata.size));
  file.createReadStream().on("error", () => {
    if (!res.headersSent) res.status(404).json({ error: "File not found." });
    else res.destroy();
  }).pipe(res);
}

router.post(
  "/storage/uploads/request-url",
  async (req: Request, res: Response) => {
    if (!requireAdminId(req, res)) return;
    const parsed = RequestUploadUrlBody.safeParse(req.body);
    if (
      !parsed.success ||
      !supportedImageTypes.has(parsed.data.contentType) ||
      parsed.data.size > 10 * 1024 * 1024
    ) {
      return res.status(400).json({ error: "Choose a valid JPG, PNG, or WebP image." });
    }
    try {
      const uploadURL = await storage.getObjectEntityUploadURL();
      const objectPath = storage.normalizeObjectEntityPath(uploadURL);
      return res.json(
        RequestUploadUrlResponse.parse({
          uploadURL,
          objectPath,
          metadata: parsed.data,
        }),
      );
    } catch {
      return res.status(503).json({ error: "Photo storage is temporarily unavailable." });
    }
  },
);

router.get(
  "/storage/public-objects/*filePath",
  async (req: Request, res: Response) => {
    try {
      const rawPath = req.params.filePath as string | string[];
      const filePath = Array.isArray(rawPath) ? rawPath.join("/") : rawPath;
      const file = await storage.searchPublicObject(filePath);
      if (!file) return res.status(404).json({ error: "File not found." });
      await streamFile(file, res);
      return;
    } catch {
      if (!res.headersSent) {
        return res.status(500).json({ error: "Could not serve the public file." });
      }
      return;
    }
  },
);

router.get(
  "/storage/objects/*path",
  async (req: Request, res: Response) => {
    try {
      const rawPath = req.params.path as string | string[];
      const entityPath = Array.isArray(rawPath) ? rawPath.join("/") : rawPath;
      const file = await storage.getObjectEntityFile(`/objects/${entityPath}`);
      await streamFile(file, res, true);
      return;
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "File not found." });
      }
      if (!res.headersSent) {
        return res.status(500).json({ error: "Could not serve the uploaded file." });
      }
      return;
    }
  },
);

export default router;
