import { drive } from "../google-drive-client.ts";
import fs from "node:fs";
import path from "node:path";

const ROOT_FOLDER_ID = "1fiBt3u5PWCcpcA9VAJQvkpN44fLXSE8x";

async function listFolders(parentId: string) {
  const response = await drive.files.list({
    q: `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id, name)",
    pageSize: 1000,
  });

  return response.data.files || [];
}

async function listVideos(folderId: string) {
  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: "files(id, name)",
    pageSize: 1000,
  });

  return response.data.files || [];
}

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

async function main() {
  console.log("Scanning root folder...");

  const folders = await listFolders(ROOT_FOLDER_ID);

  const output: Record<string, any> = {};

  for (const folder of folders) {
    if (!folder.id || !folder.name) continue;

    console.log(`\nCategory: ${folder.name}`);

    const videos = await listVideos(folder.id);

    for (const video of videos) {
      if (!video.id || !video.name) continue;

      const category = slugify(folder.name);

      const filename = video.name
        .replace(/\.mp4$/i, "");

      const key = slugify(filename);

      output[key] = {
        fileId: video.id,
        name: video.name,
        category,
      };

      console.log(`  ✓ ${video.name}`);
    }
  }

  const generated =
`export const driveVideoMap: Record<string, {
  fileId: string;
  name: string;
  category: string;
}> = ${JSON.stringify(output, null, 2)};`;

  const outputPath = path.join(
    process.cwd(),
    "shared",
    "google-drive.ts"
  );

  fs.writeFileSync(outputPath, generated);

  console.log("\nDone.");
  console.log(`Generated: ${outputPath}`);
  console.log(`Total videos: ${Object.keys(output).length}`);
}

main().catch(console.error);