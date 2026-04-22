import Layout from "@/components/Layout";
import PlaceholderPage from "./PlaceholderPage";
import { MessageCircle } from "lucide-react";

export default function Chat() {
  return (
    <Layout>
      <PlaceholderPage
        title="Trò chuyện và giao tiếp"
        description="Kết nối với những người học và người dùng ngôn ngữ ký hiệu khác. Trò chuyện với hỗ trợ dịch theo thời gian thực và đầu vào ngôn ngữ ký hiệu."
        icon={<MessageCircle size={64} className="text-primary" />}
        ctaText="Quay về trang chủ"
        features={[
          "Nhắn tin thời gian thực với người dùng khác",
          "Nhập ngôn ngữ ký hiệu qua camera",
          "Tự động dịch tin nhắn",
          "Phòng chat theo chủ đề",
          "Hồ sơ người dùng và hệ thống uy tín",
          "Lịch sử tin nhắn và tìm kiếm",
        ]}
      />
    </Layout>
  );
}
