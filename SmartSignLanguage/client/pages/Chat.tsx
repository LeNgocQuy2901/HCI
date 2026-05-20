import Layout from "@/components/Layout";
import PlaceholderPage from "./PlaceholderPage";
import { MessageCircle } from "lucide-react";

export default function Chat() {
  return (
    <Layout>
      <PlaceholderPage
        title="Chat and Communication"
        description="Connect with other sign language learners and users with real-time translation support."
        icon={<MessageCircle size={64} className="text-primary" />}
        ctaText="Back to Home"
        features={[
          "Real-time messaging with other users",
          "Camera-based sign input",
          "Automatic message translation",
          "Topic-based chat rooms",
          "User profiles and reputation",
          "Message history and search",
        ]}
      />
    </Layout>
  );
}
