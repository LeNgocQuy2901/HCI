import { Request, RequestHandler, Router } from "express";
import { google } from "googleapis";
import { driveVideoMap } from "../../shared/google-drive";
import path from "path";
const router = Router();

function resolveServiceAccountKeyPath() {
  return path.resolve(
    process.cwd(),
    "service-account-key.json",
  );
}

// ── Auth ─────────────────────────────────────────────────────────────────────

let _auth: InstanceType<typeof google.auth.GoogleAuth> | null = null;

function getAuth() {
  if (_auth) return _auth;

  


  _auth = new google.auth.GoogleAuth({
    keyFile: resolveServiceAccountKeyPath(),
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });

  return _auth;
}

// ── Handlers ─────────────────────────────────────────────────────────────────

const getVideoInfo = (req: Request<{ videoKey: string }>, res: any) => {
  const { videoKey } = req.params;
  const video = driveVideoMap[videoKey];

  if (!video) {
    return res.status(404).json({
      error: "Video not found",
      availableVideos: Object.keys(driveVideoMap),
    });
  }

  if (video.fileId.includes("PLACEHOLDER")) {
    return res.status(400).json({
      error: "Video ID not configured",
      message: `File ID for "${videoKey}" is not configured.`,
    });
  }

  return res.json({
    url: `/api/video-stream/${videoKey}`,
    name: video.name,
    videoKey,
    type: "google-drive",
  });
};

const streamVideo = (req: Request<{ videoKey: string }>, res: any) => {
  const { videoKey } = req.params;
  const video = driveVideoMap[videoKey];

  if (!video || video.fileId.includes("PLACEHOLDER")) {
    return res.status(404).json({ error: "Video not found or not configured" });
  }

  void (async () => {
    try {
      const auth = getAuth();
      const drive = google.drive({ version: "v3", auth });

      // Fetch file metadata to get size and mime type
      const meta = await drive.files.get({
        fileId: video.fileId,
        fields: "mimeType,size",
      });

      const mimeType = meta.data.mimeType ?? "video/mp4";
      const fileSize = Number(meta.data.size ?? 0);
      const rangeHeader = req.headers.range;

      const driveReqHeaders: Record<string, string> = {};
      let statusCode = 200;

      if (rangeHeader && fileSize > 0) {
        const [startStr, endStr] = rangeHeader.replace(/bytes=/, "").split("-");
        const start = parseInt(startStr, 10);
        const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        driveReqHeaders["Range"] = `bytes=${start}-${end}`;
        statusCode = 206;

        res.setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`);
        res.setHeader("Content-Length", chunkSize);
      } else if (fileSize > 0) {
        res.setHeader("Content-Length", fileSize);
      }

      res.setHeader("Content-Type", mimeType);
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Cache-Control", "private, max-age=3600");
      res.setHeader("Access-Control-Allow-Origin", "*");

      const driveRes = await drive.files.get(
        { fileId: video.fileId, alt: "media" },
        { responseType: "stream", headers: driveReqHeaders },
      );

      res.status(statusCode);
      (driveRes.data as NodeJS.ReadableStream)
        .on("error", (err) => {
          console.error("[video-stream] stream error:", err.message);
          if (!res.headersSent) {
            res.status(500).json({ error: "Stream error", detail: err.message });
          } else {
            res.end();
          }
        })
        .pipe(res);
    } catch (err: any) {
      console.error("[video-stream] error:", err?.message ?? err);
      if (res.headersSent) return;

      const status =
        err?.code === 404 || err?.status === 404 ? 404
        : err?.code === 403 || err?.status === 403 ? 403
        : 500;

      res.status(status).json({ error: err?.message ?? "Internal server error" });
    }
  })();
};

const listVideos: RequestHandler = (_req, res) => {
  const videos = Object.entries(driveVideoMap).map(([key, value]) => ({
    key,
    name: value.name,
    configured: !value.fileId.includes("PLACEHOLDER"),
    streamUrl: `/api/video-stream/${key}`,
  }));

  res.json({
    total: videos.length,
    configured: videos.filter((v) => v.configured).length,
    videos,
  });
};

// ── Routes ───────────────────────────────────────────────────────────────────

router.get("/video/:videoKey", getVideoInfo);
router.get("/video-stream/:videoKey", streamVideo);
router.get("/videos/list", listVideos);

export default router;