import { google } from "googleapis";
import path from "path";

function resolveServiceAccountKeyPath() {
  return path.resolve(
    process.cwd(),
    "service-account-key.json",
  );
}

const auth = new google.auth.GoogleAuth({
  keyFile: resolveServiceAccountKeyPath(),
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
});

export const drive = google.drive({
  version: "v3",
  auth,
});