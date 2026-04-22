// Google Drive video mapping
// Format: videoName -> { fileId, name }
export const driveVideoMap: Record<string, { fileId: string; name: string }> = {
  // Numbers folder videos
  "num-0": {
    fileId: "1pCZB2s-P40hF8LmOI5njR3yFtkqeTmCs",
    name: "B02-Số 0.mp4",
  },
  "num-1": {
    fileId: "1iitOdvBMVGH-f0cZgM-dFlUyMlJ_d_H5",
    name: "B02-Số 1.mp4",
  },
  "num-2": {
    fileId: "1G0vOeTwmuozYTOZsTgkJqu5-25rWVAs0",
    name: "B02-Số 2.mp4",
  },
  "num-3": {
    fileId: "1Z7mE3SeY5r4UAAlqfl0NsVHAwxlKDxjE",
    name: "B02-Số 3.mp4",
  },
  "num-4": {
    fileId: "14sUSJUjQbLTbDF-ox8zPOWz2uLya9slA",
    name: "B02-Số 4.mp4",
  },
  "num-5": {
    fileId: "12GJ_AWV_hvf3KeYT5cNJfXLkn-kX9Jyk",
    name: "B02-Số 5.mp4",
  },
  "num-6": {
    fileId: "1yJXgxYrtdR6XxDr5EA--WfU8wawGqIgH",
    name: "B02-Số 6-HN.mp4",
  },
  // Greetings folder videos
  "greet-hello": {
    fileId: "1Ilf3hkWtXR7eagSrxCtNP80_Vj5pGQJn",
    name: "Xin chào hoặc chào (3 cách).mp4",
  },
  "greet-thank-you": {
    fileId: "1VNRBKR8DNQLqaJg8xHVriCeN8EUeIVpt",
    name: "Cảm ơn.mp4",
  },
  "greet-happy-to-meet": {
    fileId: "1H7VxO2IUE66XyJFImOsyVf19DvLz45lH",
    name: "Câu đơn_Xin chào, rất vui được gặp bạn.mp4",
  },
  "greet-how-are-you": {
    fileId: "1gQrWPbGkd4V-MDHkrzQ5biF-cFYDDR0r",
    name: "Câu đơn_Bạn khỏe không.mp4",
  },
  "greet-long-time-no-see": {
    fileId: "1rAaPKZqX-c0JSA6ed92y01nXaxFzIF_V",
    name: "Câu phúc_Lâu quá không gặp, bạn khỏe không.mp4",
  },
  "greet-meet": {
    fileId: "1Q9ni7QY0-RF7uQVPLgJErS-sCCVpreyt",
    name: "Gặp gỡ hoặc gặp.mp4",
  },
  "greet-health": {
    fileId: "1tdVVfWUt8DrUYBdEwwtRk-tPRvphN369",
    name: "Khỏe.mp4",
  },
  "emotion-happy": {
    fileId: "PLACEHOLDER_EMOTION_HAPPY",
    name: "Happy.mp4",
  },
  "emotion-sad": {
    fileId: "PLACEHOLDER_EMOTION_SAD",
    name: "Sad.mp4",
  },
  "daily-eat": {
    fileId: "PLACEHOLDER_DAILY_EAT",
    name: "Eat.mp4",
  },
  "daily-drink": {
    fileId: "PLACEHOLDER_DAILY_DRINK",
    name: "Drink.mp4",
  },
  "action-go": {
    fileId: "1a_R3KILGJoTP1zLR1i6qBkg3eWOzhAFk",
    name: "Đi.mp4",
  },
  "info-name": {
    fileId: "_q855ZNYGrOVqqMgT45kXeHjaDsmioGA",
    name: "Tên.mp4",
  },
  "info-age": {
    fileId: "1XFMfJX116xrsBvbaTS8FDjLcJZ7VxNTM",
    name: "Tuổi.mp4",
  },
  "info-location": {
    fileId: "1ToprUNBizzHN7PMqJ6mS1Rharfk8Gbg0",
    name: "ở.mp4",
  },
};

/**
 * Generate Google Drive direct link from file ID
 * @param fileId - Google Drive file ID
 * @returns Direct download link
 */
export function getGoogleDriveLink(fileId: string): string {
  return `https://drive.google.com/uc?id=${fileId}&export=download`;
}

/**
 * Get video URL by video key
 * @param videoKey - Key from driveVideoMap
 * @returns Full Google Drive URL
 */
export function getVideoUrl(videoKey: string): string {
  const video = driveVideoMap[videoKey];
  if (!video || video.fileId.includes("PLACEHOLDER")) {
    return `/api/video-stream/${videoKey}`;
  }
  return `/api/video-stream/${videoKey}`;
}

/**
 * Get the display name from Google Drive for a given video key.
 * Falls back to the key when the mapping is missing.
 */
export function getDriveVideoName(videoKey: string): string {
  const video = driveVideoMap[videoKey];
  if (!video) {
    return videoKey;
  }

  return video.name
    .replace(/\.mp4$/i, "")
    .replace(/^[A-Za-z0-9]+[-_ ]+/, "")
    .trim();
}

/**
 * Get all configured videos
 */
export function getAllConfiguredVideos() {
  return Object.entries(driveVideoMap).map(([key, value]) => ({
    key,
    ...value,
    url: getVideoUrl(key),
  }));
}
