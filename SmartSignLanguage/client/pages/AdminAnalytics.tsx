import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AdminHeader, AdminMetric } from "@/components/AdminChrome";
import { useAuthStore } from "@/hooks/use-auth";
import { categoryLabels } from "@shared/vocabulary";
import { BarChart3, Download, FileWarning, Target } from "lucide-react";

type AdminAnalyticsOverview = {
  mostDifficultSigns: Array<{
    signId: string;
    word: string;
    category: string;
    attempts: number;
    correct: number;
  }>;
  lessonCompletionRate: Array<{
    lessonId: string;
    title: string;
    started: number;
    completed: number;
    completionRate: number;
  }>;
  quizFailRate: Array<{
    lessonId: string;
    attempts: number;
    passed: number;
    failRate: number;
  }>;
  recognitionFailRate: Array<{
    signId: string;
    expectedWord: string;
    attempts: number;
    correct: number;
    failRate: number;
    averageConfidence: number;
  }>;
  contentNeedingImprovement: Array<{
    signId: string;
    word: string;
    category: string;
    status: string;
    hasVideo: number;
    hasMetadata: number;
    activeQuizQuestions: number;
  }>;
};

export default function AdminAnalytics() {
  const { token, user, isAuthenticated } = useAuthStore();
  const [overview, setOverview] = useState<AdminAnalyticsOverview | null>(null);

  useEffect(() => {
    if (!token || user?.role !== "admin") return;

    async function loadOverview() {
      const response = await fetch("/api/admin/analytics/overview", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      setOverview(await response.json());
    }

    void loadOverview();
  }, [token, user?.role]);

  const exportOverview = () => {
    if (!overview) return;
    const rows = [
      ...overview.mostDifficultSigns.map((item) => ({
        section: "most_difficult_signs",
        label: item.word || item.signId,
        metric: item.attempts > 0 ? Math.round((item.correct / item.attempts) * 100) : 0,
        detail: item.category,
      })),
      ...overview.lessonCompletionRate.map((item) => ({
        section: "lesson_completion",
        label: item.title,
        metric: item.completionRate,
        detail: `${item.completed}/${item.started}`,
      })),
      ...overview.quizFailRate.map((item) => ({
        section: "quiz_fail_rate",
        label: item.lessonId,
        metric: item.failRate,
        detail: `${item.attempts} attempts`,
      })),
      ...overview.recognitionFailRate.map((item) => ({
        section: "recognition_fail_rate",
        label: item.expectedWord,
        metric: item.failRate,
        detail: `${item.attempts} attempts`,
      })),
    ];
    const csv = [
      "section,label,metric,detail",
      ...rows.map((row) =>
        [row.section, row.label, row.metric, row.detail]
          .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
          .join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "admin-analytics.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <Layout>
        <div className="ssl-app-page container max-w-7xl mx-auto py-10 px-4">
          <Card className="p-6 space-y-2">
            <h1 className="text-2xl font-bold">Admin access required</h1>
            <p className="text-muted-foreground">
              Analytics overview is restricted to administrator accounts.
            </p>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="ssl-app-page container max-w-7xl mx-auto py-10 px-4 space-y-6">
        <AdminHeader
          title="Admin Analytics"
          description="Monitor lesson drop-off, quiz failures, recognition issues, and content gaps from one review surface."
          icon={<BarChart3 className="h-4 w-4" />}
          action={
            <Button
              variant="outline"
              className="gap-2"
              onClick={exportOverview}
              disabled={!overview}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          }
        />

        {!overview ? (
          <Card className="p-6 text-muted-foreground">
            Loading analytics...
          </Card>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <AdminMetric
                label="Hard signs"
                value={overview.mostDifficultSigns.length}
                detail="lowest accuracy"
              />
              <AdminMetric
                label="Lesson reports"
                value={overview.lessonCompletionRate.length}
                detail="completion tracked"
              />
              <AdminMetric
                label="Quiz issues"
                value={overview.quizFailRate.length}
                detail="failed attempts"
              />
              <AdminMetric
                label="Content gaps"
                value={overview.contentNeedingImprovement.length}
                detail="needs attention"
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <AnalyticsCard
                title="Most Difficult Signs"
                icon={<Target className="h-5 w-5" />}
              >
                {overview.mostDifficultSigns.length > 0 ? (
                  overview.mostDifficultSigns.map((item) => {
                    const accuracy =
                      item.attempts > 0
                        ? Math.round(
                            (Number(item.correct || 0) / item.attempts) * 100,
                          )
                        : 0;
                    return (
                      <Row
                        key={item.signId}
                        title={item.word || item.signId}
                        detail={categoryLabels[item.category] || item.category}
                      >
                        <Badge variant="outline">{accuracy}%</Badge>
                      </Row>
                    );
                  })
                ) : (
                  <Empty />
                )}
              </AnalyticsCard>

              <AnalyticsCard
                title="Lesson Completion Rate"
                icon={<BarChart3 className="h-5 w-5" />}
              >
                {overview.lessonCompletionRate.map((item) => (
                  <div key={item.lessonId} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{item.title}</span>
                      <span className="text-muted-foreground">
                        {item.started > 0
                          ? `${item.completed}/${item.started}`
                          : "No activity yet"}
                      </span>
                    </div>
                    <Progress
                      value={Number(item.completionRate || 0)}
                      className="h-2"
                    />
                  </div>
                ))}
              </AnalyticsCard>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <AnalyticsCard title="Quiz Fail Rate">
                {overview.quizFailRate.length > 0 ? (
                  overview.quizFailRate.map((item) => (
                    <Row
                      key={item.lessonId}
                      title={item.lessonId}
                      detail={`${item.attempts} attempts`}
                    >
                      <Badge variant="outline">
                        {item.failRate || 0}% fail
                      </Badge>
                    </Row>
                  ))
                ) : (
                  <Empty />
                )}
              </AnalyticsCard>

              <AnalyticsCard title="Recognition Fail Rate">
                {overview.recognitionFailRate.length > 0 ? (
                  overview.recognitionFailRate.map((item) => (
                    <Row
                      key={item.signId}
                      title={item.expectedWord}
                      detail={`${item.attempts} attempts`}
                    >
                      <Badge variant="outline">
                        {item.failRate || 0}% fail
                      </Badge>
                    </Row>
                  ))
                ) : (
                  <Empty />
                )}
              </AnalyticsCard>

              <AnalyticsCard
                title="Content Needing Improvement"
                icon={<FileWarning className="h-5 w-5" />}
              >
                {overview.contentNeedingImprovement.map((item) => (
                  <Row
                    key={item.signId}
                    title={item.word}
                    detail={categoryLabels[item.category] || item.category}
                  >
                    <div className="flex flex-wrap gap-1 justify-end">
                      {!item.hasVideo && <Badge variant="outline">video</Badge>}
                      {!item.hasMetadata && (
                        <Badge variant="outline">metadata</Badge>
                      )}
                      {item.activeQuizQuestions < 2 && (
                        <Badge variant="outline">quiz</Badge>
                      )}
                    </div>
                  </Row>
                ))}
              </AnalyticsCard>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

function AnalyticsCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="rounded-lg p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </Card>
  );
}

function Row({
  title,
  detail,
  children,
}: {
  title: string;
  detail?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-background p-3">
      <div>
        <p className="font-medium">{title}</p>
        {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
      </div>
      {children}
    </div>
  );
}

function Empty() {
  return (
    <p className="text-sm text-muted-foreground">
      Analytics will appear after learners generate events.
    </p>
  );
}
