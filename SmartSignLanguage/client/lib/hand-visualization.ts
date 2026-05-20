export interface DrawHandsOptions {
  lineColor?: string;
  pointColor?: string;
  lineWidth?: number;
  pointRadius?: number;
}

// MediaPipe hand landmarks connection pairs (21 points)
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // Index
  [0, 9], [9, 10], [10, 11], [11, 12], // Middle
  [0, 13], [13, 14], [14, 15], [15, 16], // Ring
  [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
];

export function drawHandLandmarks(
  canvas: HTMLCanvasElement,
  landmarks: Array<Array<{ x: number; y: number; z: number }>>,
  handedness: string[],
  options: DrawHandsOptions = {}
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const {
    lineColor = "#00FF00",
    pointColor = "#FF0000",
    lineWidth = 2,
    pointRadius = 4,
  } = options;

  const width = canvas.width;
  const height = canvas.height;

  // Draw connections (lines between points)
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = lineWidth;

  landmarks.forEach((hand) => {
    HAND_CONNECTIONS.forEach(([start, end]) => {
      if (hand[start] && hand[end]) {
        const x0 = hand[start].x * width;
        const y0 = hand[start].y * height;
        const x1 = hand[end].x * width;
        const y1 = hand[end].y * height;

        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
    });

    // Draw points (circles at each landmark)
    ctx.fillStyle = pointColor;
    hand.forEach((point) => {
      const x = point.x * width;
      const y = point.y * height;

      ctx.beginPath();
      ctx.arc(x, y, pointRadius, 0, 2 * Math.PI);
      ctx.fill();
    });
  });

  // Draw handedness labels
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "14px Arial";
  handedness.forEach((hand, index) => {
    const yPos = 30 + index * 25;
    ctx.fillText(`${hand} Hand`, 10, yPos);
  });
}

export function drawBoundingBoxes(
  canvas: HTMLCanvasElement,
  landmarks: Array<Array<{ x: number; y: number; z: number }>>,
  handedness: string[],
  options: DrawHandsOptions = {}
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { lineColor = "#00FF00", lineWidth = 2 } = options;

  const width = canvas.width;
  const height = canvas.height;

  ctx.strokeStyle = lineColor;
  ctx.lineWidth = lineWidth;

  landmarks.forEach((hand, handIndex) => {
    // Find bounding box
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    hand.forEach((point) => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });

    // Add padding
    const padding = 0.05;
    const boxMinX = Math.max(0, minX - padding) * width;
    const boxMinY = Math.max(0, minY - padding) * height;
    const boxMaxX = Math.min(1, maxX + padding) * width;
    const boxMaxY = Math.min(1, maxY + padding) * height;

    // Draw bounding box
    ctx.strokeRect(boxMinX, boxMinY, boxMaxX - boxMinX, boxMaxY - boxMinY);

    // Draw hand label in corner
    ctx.fillStyle = lineColor;
    ctx.font = "12px Arial";
    ctx.fillText(
      `${handedness[handIndex] || "Unknown"} Hand`,
      boxMinX + 5,
      boxMinY - 5
    );
  });
}

export function clearCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}
