import Layout from "@/components/Layout";
import PlaceholderPage from "./PlaceholderPage";
import { Tv } from "lucide-react";

export default function Recognition() {
  return (
    <Layout>
      <PlaceholderPage
        title="Nhận dạng ngôn ngữ ký hiệu thời gian thực"
        description="Camera AI nhận dạng ngôn ngữ ký hiệu theo thời gian thực. Xem ký hiệu của bạn được dịch ngay lập tức với phát hiện tay và phân tích tư thế."
        icon={<Tv size={64} className="text-primary" />}
        ctaText="Quay về trang chủ"
        features={[
          "Luồng camera thời gian thực với phát hiện bàn tay",
          "Nhận dạng ngôn ngữ ký hiệu tức thì",
          "Hiển thị khung giới hạn và tư thế",
          "Điểm tin cậy nhận dạng",
          "Lịch sử các ký hiệu đã nhận dạng",
          "Thống kê hiệu năng và phân tích",
        ]}
      />
    </Layout>
  );
}
