import { Request, RequestHandler, Router } from "express";
import { Readable } from "stream";
import { driveVideoMap } from "../../shared/google-drive";

const router = Router();

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
      message: `File ID for "${videoKey}" chưa được cấu hình.`,
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

  const driveUrl = `https://drive.usercontent.google.com/download?id=${video.fileId}&export=download&authuser=0&confirm=t`;
  const range = req.headers.range;

  void (async () => {
    try {
      const driveResponse = await fetch(driveUrl, {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          ...(range ? { Range: range } : {}),
        },
        redirect: "follow",
      });

      if (!driveResponse.ok || !driveResponse.body) {
        return res.status(driveResponse.status || 502).json({
          error: "Failed to fetch video from Google Drive",
          status: driveResponse.status,
        });
      }

      res.status(driveResponse.status);
      res.setHeader(
        "Content-Type",
        driveResponse.headers.get("content-type") || "video/mp4"
      );
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "public, max-age=3600");

      const contentLength = driveResponse.headers.get("content-length");
      if (contentLength) {
        res.setHeader("Content-Length", contentLength);
      }

      const contentRange = driveResponse.headers.get("content-range");
      if (contentRange) {
        res.setHeader("Content-Range", contentRange);
      }

      const stream = Readable.fromWeb(driveResponse.body as any);
      stream.on("error", (err) => {
        console.error("Drive stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to stream video", detail: err.message });
        } else {
          res.end();
        }
      });

      stream.pipe(res);
    } catch (err) {
      const error = err as Error;
      console.error("Proxy error:", error);
      if (!res.headersSent) {
        res.status(500).json({
          error: "Failed to fetch video",
          detail: error.message,
        });
      }
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

router.get("/video/:videoKey", getVideoInfo);
router.get("/video-stream/:videoKey", streamVideo);
router.get("/videos/list", listVideos);

export default router;