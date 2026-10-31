import { Storage } from "@google-cloud/storage";

// Official Replit App Storage sidecar authentication. No credentials in source.
export const artStorage = new Storage({
  credentials: {
    audience: "replit", subject_token_type: "access_token",
    token_url: "http://127.0.0.1:1106/token", type: "external_account",
    credential_source: {
      url: "http://127.0.0.1:1106/credential",
      format: { type: "json", subject_token_field_name: "access_token" },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});
export function publicArtFile(objectName: string) {
  const root = process.env.PUBLIC_OBJECT_SEARCH_PATHS?.split(",")[0]?.trim();
  if (!root) throw new Error("App Storage is not configured");
  const [bucket, ...prefix] = root.replace(/^\/+/, "").split("/");
  return artStorage.bucket(bucket).file([...prefix, objectName].join("/"));
}
