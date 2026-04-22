import Layout from "@/components/Layout";
import PlaceholderPage from "./PlaceholderPage";
import { MessageSquare } from "lucide-react";

export default function Feedback() {
  return (
    <Layout>
      <PlaceholderPage
        title="Gửi góp ý"
        description="Giúp chúng tôi cải thiện SignLanguage AI. Hãy cho biết bạn thích điều gì và chúng tôi có thể làm tốt hơn ở đâu."
        icon={<MessageSquare size={64} className="text-primary" />}
        ctaText="Quay về trang chủ"
        features={[
          "Đánh giá trải nghiệm bằng sao",
          "Biểu mẫu góp ý bằng văn bản",
          "Gửi yêu cầu tính năng",
          "Báo lỗi",
          "Thông báo qua email khi có phản hồi",
          "Bình chọn góp ý từ cộng đồng",
        ]}
      />
    </Layout>
  );
}
