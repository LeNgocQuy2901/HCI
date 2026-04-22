import Layout from "@/components/Layout";
import PlaceholderPage from "./PlaceholderPage";
import { Tv } from "lucide-react";

export default function Recognition() {
  return (
    <Layout>
      <PlaceholderPage
        title="Realtime Sign Recognition"
        description="Our AI-powered camera recognizes sign language in real-time. See your signs translated instantly with hand detection and pose analysis."
        icon={<Tv size={64} className="text-primary" />}
        ctaText="Back to Home"
        features={[
          "Real-time camera feed with hand detection",
          "Instant sign language recognition",
          "Bounding box and pose visualization",
          "Recognition confidence score",
          "History of recognized signs",
          "Performance statistics and analytics",
        ]}
      />
    </Layout>
  );
}
