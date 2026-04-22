import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import {
  BookOpen,
  Zap,
  Tv,
  Users,
  Video,
  MessageCircle,
  Star,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function Index() {
  const features = [
    {
      icon: BookOpen,
      title: "Học từ vựng",
      description:
        "Rèn luyện ngôn ngữ ký hiệu với thư viện từ vựng đầy đủ. Học theo tốc độ của bạn bằng các bài học tương tác.",
      href: "/learn",
    },
    {
      icon: Zap,
      title: "Dịch văn bản ↔ ký hiệu",
      description:
        "Dịch ngay giữa văn bản và ngôn ngữ ký hiệu. Phù hợp cho giao tiếp và học tập.",
      href: "/translate",
    },
    {
      icon: Tv,
      title: "Nhận dạng thời gian thực",
      description:
        "Camera AI nhận dạng ngôn ngữ ký hiệu theo thời gian thực. Xem ký hiệu của bạn được dịch ngay lập tức.",
      href: "/recognition",
    },
    {
      icon: Users,
      title: "Trò chuyện và kết nối",
      description:
        "Kết nối với những người học ngôn ngữ ký hiệu khác. Trò chuyện với hỗ trợ dịch theo thời gian thực.",
      href: "/chat",
    },
  ];

  const stats = [
    { number: "", label: "Từ và cụm từ" },
    { number: "", label: "Người dùng đang hoạt động" },
    { number: "", label: "Độ chính xác" },
  ];

  const benefits = [
    "Miễn phí và ai cũng có thể dùng",
    "Hoạt động trên mọi thiết bị",
    "Có chế độ học ngoại tuyến",
    "Theo dõi tiến độ và thành tích",
    "Có cộng đồng hỗ trợ",
    "Cập nhật thường xuyên và thêm nội dung mới",
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <img
                    src="/img/logo2.png"
                    alt="Smart Sign Language logo"
                    className="h-16 w-16 rounded-2xl object-cover shadow-lg ring-1 ring-border bg-white"
                  />
                  <h1 className="text-5xl md:text-6xl font-bold leading-tight text-foreground">
                    Smart Sign Language
                  </h1>
                </div>
                <p className="text-2xl md:text-3xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                  Học và giao tiếp bằng ngôn ngữ ký hiệu với AI
                </p>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Xóa bỏ rào cản giao tiếp với nền tảng ngôn ngữ ký hiệu sử
                  dụng AI. Học từ vựng, dịch theo thời gian thực và kết nối với
                  cộng đồng hỗ trợ.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white rounded-full px-8"
                  asChild
                >
                  <Link to="/learn" className="gap-2 inline-flex items-center">
                    Bắt đầu học
                    <ArrowRight size={20} />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-8"
                  asChild
                >
                  <Link to="/recognition">
                    Thử nhận dạng thời gian thực
                  </Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border">
                {stats.map((stat, i) => (
                  <div key={i}>
                    <p className="text-2xl md:text-3xl font-bold text-primary">
                      {stat.number}
                    </p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Hero Visual */}
            <div className="relative hidden md:block">
              <div className="relative aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl border border-primary/10 overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-10 right-10 w-36 h-36 bg-primary/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-10 left-10 w-44 h-44 bg-secondary/10 rounded-full blur-3xl"></div>

                {/* Camera preview placeholder */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-10">
                  <div className="w-64 h-64 xl:w-72 xl:h-72 bg-white/80 backdrop-blur rounded-3xl border-2 border-primary/20 flex items-center justify-center relative overflow-hidden shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5"></div>
                    <div className="relative flex flex-col items-center gap-5">
                      <Video size={60} className="text-primary animate-pulse" />
                      <p className="text-base font-semibold text-foreground">
                        Xem trước camera
                      </p>
                      <p className="text-sm text-muted-foreground text-center">
                        Sẵn sàng nhận dạng bằng AI
                      </p>
                    </div>
                  </div>

                  {/* Recognition indicator */}
                  <div className="mt-10 flex items-center gap-2 bg-white/80 backdrop-blur px-5 py-3 rounded-full border border-primary/20 shadow-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-foreground">
                      Nhận dạng đang hoạt động
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-primary font-semibold mb-2">Tính năng</p>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Mọi thứ bạn cần
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Bộ công cụ toàn diện giúp việc học và giao tiếp bằng ngôn ngữ ký
              hiệu trở nên dễ dàng và thú vị.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={i}
                  to={feature.href}
                  className="group p-8 rounded-2xl border border-border hover:border-primary/50 bg-white hover:bg-primary/5 transition-all duration-300 cursor-pointer hover:shadow-lg"
                >
                  <div className="mb-4 inline-block p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Icon
                      size={24}
                      className="text-primary"
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="mt-4 flex items-center text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Khám phá
                    <ArrowRight size={16} className="ml-2" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Benefits List */}
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-8">
                Vì sao chọn Smart Sign Language?
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2
                      size={24}
                      className="text-primary flex-shrink-0 mt-1"
                    />
                    <p className="text-foreground font-medium">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Visual */}
            <div className="relative hidden md:block">
              <div className="bg-gradient-to-br from-secondary/20 to-primary/20 rounded-3xl p-12 border border-border">
                <div className="space-y-6">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-16 bg-white/50 rounded-xl border border-white/50 flex items-center px-4"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="h-2 bg-primary/30 rounded w-2/3"></div>
                        <div className="h-2 bg-primary/20 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Decorative element */}
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-to-r from-primary/95 to-secondary/95 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Sẵn sàng bắt đầu hành trình của bạn?
          </h2>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Hãy tham gia cùng hàng nghìn người học đang phá bỏ rào cản giao
            tiếp và kết nối bằng ngôn ngữ ký hiệu.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 rounded-full px-8 font-semibold"
              asChild
            >
              <Link to="/register">Bắt đầu miễn phí</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/50 text-white hover:bg-white/10 rounded-full px-8"
              asChild
            >
              <Link to="/chat">Tham gia cộng đồng</Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 pt-8 border-t border-white/20 flex flex-wrap justify-center gap-8 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <Star size={18} className="fill-white text-white" />
              <span>Được 50K+ người dùng tin tưởng</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} />
              <span>Miễn phí và truy cập mở</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap size={18} />
              <span>Nhận dạng bằng AI</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Teaser */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Cách hoạt động
            </h2>
            <p className="text-xl text-muted-foreground">
              Ba bước đơn giản để bắt đầu
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                number: "01",
                title: "Đăng ký",
                description: "Tạo tài khoản miễn phí chỉ trong vài giây",
              },
              {
                number: "02",
                title: "Chọn lộ trình",
                description: "Chọn học, dịch hoặc nhận dạng",
              },
              {
                number: "03",
                title: "Bắt đầu khám phá",
                description: "Học theo tốc độ của bạn với hỗ trợ từ AI",
              },
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="text-5xl font-bold text-primary/20 mb-4">
                  {step.number}
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">{step.description}</p>

                {/* Connector line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 -right-12 w-12 h-1 bg-gradient-to-r from-primary/50 to-transparent"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
