import { randomUUID } from "node:crypto";
import { File, Storage } from "@google-cloud/storage";

const SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

// Keep Replit sidecar credentials: the runtime supplies short-lived GCS access.
export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
  }
}

function parseObjectPath(path: string): {
  bucketName: string;
  objectName: string;
} {
  const parts = path.split("/").filter(Boolean);
  if (parts.length < 2) throw new Error("Invalid object storage path.");
  return { bucketName: parts[0], objectName: parts.slice(1).join("/") };
}

export class ObjectStorageService {
  getPrivateObjectDir(): string {
    const directory = process.env.PRIVATE_OBJECT_DIR?.trim();
    if (!directory) throw new Error("PRIVATE_OBJECT_DIR is not configured.");
    return directory.replace(/\/+$/, "");
  }

  getPublicObjectSearchPaths(): string[] {
    const paths = (process.env.PUBLIC_OBJECT_SEARCH_PATHS ?? "")
      .split(",")
      .map((path) => path.trim().replace(/\/+$/, ""))
      .filter(Boolean);
    if (!paths.length) {
      throw new Error("PUBLIC_OBJECT_SEARCH_PATHS is not configured.");
    }
    return paths;
  }

  async getObjectEntityUploadURL(): Promise<string> {
    const { bucketName, objectName } = parseObjectPath(
      `${this.getPrivateObjectDir()}/uploads/${randomUUID()}`,
    );
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const response = await fetch(
      `${SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bucket_name: bucketName,
          object_name: objectName,
          method: "PUT",
          expires_at: expires,
        }),
        signal: AbortSignal.timeout(30_000),
      },
    );
    if (!response.ok) {
      throw new Error(`Object storage URL signing failed (${response.status}).`);
    }
    const result = (await response.json()) as { signed_url?: unknown };
    if (typeof result.signed_url !== "string") {
      throw new Error("Object storage did not return an upload URL.");
    }
    return result.signed_url;
  }

  normalizeObjectEntityPath(rawPath: string): string {
    if (!rawPath.startsWith("https://storage.googleapis.com/")) {
      return rawPath;
    }
    const urlPath = new URL(rawPath).pathname;
    const entityDirectory = `/${this.getPrivateObjectDir().replace(/^\/+/, "")}/`;
    if (!urlPath.startsWith(entityDirectory)) return urlPath;
    return `/objects/${urlPath.slice(entityDirectory.length)}`;
  }

  async getObjectEntityFile(objectPath: string): Promise<File> {
    if (!/^\/objects\/uploads\/[0-9a-f-]{36}$/i.test(objectPath)) {
      throw new ObjectNotFoundError();
    }
    const entityId = objectPath.slice("/objects/".length);
    const { bucketName, objectName } = parseObjectPath(
      `${this.getPrivateObjectDir()}/${entityId}`,
    );
    const file = objectStorageClient.bucket(bucketName).file(objectName);
    const [exists] = await file.exists();
    if (!exists) throw new ObjectNotFoundError();
    return file;
  }

  async searchPublicObject(filePath: string): Promise<File | null> {
    const safePath = filePath
      .split("/")
      .filter((segment) => segment && segment !== "." && segment !== "..")
      .join("/");
    if (!safePath) return null;
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const { bucketName, objectName } = parseObjectPath(
        `${searchPath}/${safePath}`,
      );
      const file = objectStorageClient.bucket(bucketName).file(objectName);
      const [exists] = await file.exists();
      if (exists) return file;
    }
    return null;
  }
}
