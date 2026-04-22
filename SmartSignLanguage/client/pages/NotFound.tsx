import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          {/* Icon */}
          <div className="inline-block p-4 bg-destructive/10 rounded-full mb-6">
            <AlertCircle size={48} className="text-destructive" />
          </div>

          {/* Content */}
          <h1 className="text-6xl font-bold text-foreground mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Page Not Found
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Sorry, we couldn't find the page you're looking for. The link may be
            broken or the page may have been removed.
          </p>

          {/* CTA */}
          <Button asChild size="lg">
            <Link to="/" className="gap-2 inline-flex items-center">
              <Home size={20} />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
