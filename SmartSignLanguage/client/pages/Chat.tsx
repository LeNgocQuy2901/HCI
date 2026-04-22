import Layout from "@/components/Layout";
import PlaceholderPage from "./PlaceholderPage";
import { MessageCircle } from "lucide-react";

export default function Chat() {
  return (
    <Layout>
      <PlaceholderPage
        title="Chat & Communication"
        description="Connect with other sign language learners and users. Chat with real-time translation support and sign language input."
        icon={<MessageCircle size={64} className="text-primary" />}
        ctaText="Back to Home"
        features={[
          "Real-time messaging with other users",
          "Sign language input via camera",
          "Auto-translation of messages",
          "Chat rooms organized by topic",
          "User profiles and reputation system",
          "Message history and search",
        ]}
      />
    </Layout>
  );
}
