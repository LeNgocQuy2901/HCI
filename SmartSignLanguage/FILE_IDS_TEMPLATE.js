/**
 * HƯỚNG DẪN: COPY FILE IDs VÀO ĐÂY
 * 
 * 1. Mở Google Drive folder:
 *    - Numbers: https://drive.google.com/drive/u/1/folders/1xvcntKMxo9SgDyP-5wTUEmkC-iLO30AE
 *    - Greetings: https://drive.google.com/drive/u/1/folders/1vsvPBMBVqE1_b3s_TSbtOWW7ekFQfHY3
 * 
 * 2. Click vào 1 video trong folder
 * 
 * 3. URL sẽ như: https://drive.google.com/file/d/[FILE_ID_HERE]/view?usp=drive_link
 * 
 * 4. Copy [FILE_ID_HERE] vào PHẦN TƯƠNG ỨNG DƯỚI ĐÂY
 * 
 * 5. Thay "PLACEHOLDER_..." bằng FILE_ID thực tế
 * 
 * VÍ DỤ:
 * Thay: fileId: "PLACEHOLDER_FILE_ID_NUM_0"
 * Thành: fileId: "1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p"
 */

// VIDEOS FOLDER 1: NÚMEROS (Số đếm từ 0-1000)
// Link: https://drive.google.com/drive/u/1/folders/1xvcntKMxo9SgDyP-5wTUEmkC-iLO30AE

const numberVideos = {
  "num-0": "PLACEHOLDER_FILE_ID_NUM_0",      // B02-Số 0.mp4
  "num-1": "PLACEHOLDER_FILE_ID_NUM_1",      // B02-Số 1.mp4
  "num-2": "PLACEHOLDER_FILE_ID_NUM_2",      // B02-Số 2.mp4
  "num-3": "PLACEHOLDER_FILE_ID_NUM_3",      // B02-Số 3.mp4
  "num-4": "PLACEHOLDER_FILE_ID_NUM_4",      // B02-Số 4.mp4
  "num-5": "PLACEHOLDER_FILE_ID_NUM_5",      // B02-Số 5.mp4
  "num-6": "PLACEHOLDER_FILE_ID_NUM_6",      // B02-Số 6-HN.mp4
  "num-7-SG": "PLACEHOLDER_FILE_ID_NUM_7SG", // B02-Số 7-SG.mp4
  "num-7-HN": "PLACEHOLDER_FILE_ID_NUM_7HN", // B02-Số 7-HN.MPG
  "num-8-SG": "PLACEHOLDER_FILE_ID_NUM_8SG", // B02-Số 8-SG.MPG
  "num-8-HN": "PLACEHOLDER_FILE_ID_NUM_8HN", // B02-Số 8-HN.MPG
  "num-9": "PLACEHOLDER_FILE_ID_NUM_9",      // B02-Số 9.MPG
  "num-10": "PLACEHOLDER_FILE_ID_NUM_10",    // B02-Số 10.MPG
  "num-11": "PLACEHOLDER_FILE_ID_NUM_11",    // B02-Số 11.MPG
  "num-12": "PLACEHOLDER_FILE_ID_NUM_12",    // B02-Số 12.MPG
  "num-13": "PLACEHOLDER_FILE_ID_NUM_13",    // B02-Số 13.MPG
  "num-14": "PLACEHOLDER_FILE_ID_NUM_14",    // B02-Số 14.MPG
  "num-15": "PLACEHOLDER_FILE_ID_NUM_15",    // B02-Số 15.MPG
  // ... Thêm các số tiếp theo
};

// VIDEOS FOLDER 2: GREETINGS & SENTENCES (Lời chào & Câu)
// Link: https://drive.google.com/drive/u/1/folders/1vsvPBMBVqE1_b3s_TSbtOWW7ekFQfHY3

const greetingVideos = {
  "greet-hello": "PLACEHOLDER_GREET_HELLO",                    // Xin chào hoặc chào (3 cách).mp4
  "greet-happy-to-meet": "PLACEHOLDER_GREET_HAPPY_TO_MEET",   // Câu đơn_Xin chào, rất vui được gặp bạn.mp4
  "greet-how-are-you": "PLACEHOLDER_HOW_ARE_YOU",             // Câu đơn_Bạn khỏe không.mp4
  "greet-long-time-no-see": "PLACEHOLDER_LONG_TIME_NO_SEE",   // Câu phúc_Lâu quá không gặp, bạn khỏe không.mp4
  "greet-meet": "PLACEHOLDER_MEET",                           // Gặp gỡ hoặc gặp.mp4
  "greet-health": "PLACEHOLDER_HEALTH",                       // Khỏe.mp4
  "info-name": "PLACEHOLDER_NAME",                            // Tên.mp4
  "info-age": "PLACEHOLDER_AGE",                              // Tuổi.mp4
  "info-location": "PLACEHOLDER_LOCATION",                    // ở.mp4
};

// Hướng dẫn cập nhật:
// 1. Lấy tất cả FILE_IDs từ Drive (bước bên trên)
// 2. Copy tất cả IDs vào đây
// 3. Sau đó chạy script sau:
//    node scripts/update-drive-config.js
// 4. Hoặc copy-paste thủ công vào shared/google-drive.ts

console.log("Template file IDs ready. Copy values from Drive and paste into shared/google-drive.ts");
