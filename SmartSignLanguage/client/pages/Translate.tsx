import Layout from "@/components/Layout";
import PlaceholderPage from "./PlaceholderPage";
import { Zap } from "lucide-react";

export default function Translate() {
  return (
    <Layout>
      <PlaceholderPage
        title="Dịch văn bản ↔ ngôn ngữ ký hiệu"
        description="Dịch ngay giữa văn bản và ngôn ngữ ký hiệu. Phù hợp cho giao tiếp, học tập và khả năng tiếp cận."
        icon={<Zap size={64} className="text-primary" />}
        ctaText="Quay về trang chủ"
        features={[
          "Dịch văn bản sang ngôn ngữ ký hiệu theo thời gian thực",
          "Dịch ngôn ngữ ký hiệu sang văn bản",
          "Xuất video hiển thị hoạt ảnh ký hiệu",
          "Hỗ trợ nhiều biến thể ngôn ngữ ký hiệu",
          "Lịch sử các bản dịch gần đây",
          "Tải xuống hoặc chia sẻ bản dịch",
        ]}
      />
    </Layout>
  );
}
