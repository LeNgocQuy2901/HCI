import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart3,
  FileText,
  Menu,
  Shield,
  X,
  LogOut,
  Moon,
  Sun,
  User,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { resolvedTheme, setTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isDarkMode = resolvedTheme === "dark";

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/learn", label: "Learn" },
    { href: "/translate", label: "Translate" },
    { href: "/recognition", label: "Recognition" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/lookup", label: "Lookup" },
  ];

  const isActivePath = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return (
      location.pathname === href || location.pathname.startsWith(`${href}/`)
    );
  };

  const adminLinks = [
    { href: "/admin/content", label: "Content", icon: FileText },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  ];

  // Get user initials for avatar
  const getInitials = (fullName?: string) => {
    if (!fullName) return "U";
    return fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate("/");
    toast({ description: "You have signed out" });
  };

  const toggleTheme = () => {
    setTheme(isDarkMode ? "light" : "dark");
  };

  const ThemeToggle = ({ fullWidth = false }: { fullWidth?: boolean }) => (
    <Button
      type="button"
      variant="outline"
      size={fullWidth ? "default" : "icon"}
      className={fullWidth ? "w-full justify-start gap-2" : "h-11 w-11"}
      onClick={toggleTheme}
      aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      title={isDarkMode ? "Light mode" : "Dark mode"}
    >
      {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
      {fullWidth && <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>}
    </Button>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navigation Bar */}
      <nav className="border-b border-border bg-background sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 flex-shrink-0">
              <img
                src="/img/logo2.png"
                alt="Smart Sign Language logo"
                className="w-10 h-10 rounded-xl object-contain shadow-sm"
              />
              <span className="hidden sm:inline font-bold text-2xl text-foreground tracking-tight">
                Smart Sign Language
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-4 lg:gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  aria-current={isActivePath(link.href) ? "page" : undefined}
                  className={`relative whitespace-nowrap rounded-full px-3 py-2 text-sm lg:text-base font-semibold transition-colors ${
                    isActivePath(link.href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated && user?.role === "admin" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 gap-2 whitespace-nowrap px-3 text-sm lg:text-base font-semibold text-muted-foreground hover:text-foreground"
                    >
                      <Shield size={16} />
                      Admin
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {adminLinks.map((link) => {
                      const Icon = link.icon;
                      return (
                        <DropdownMenuItem
                          key={link.href}
                          className="gap-2"
                          asChild
                        >
                          <Link to={link.href}>
                            <Icon size={16} />
                            <span>{link.label}</span>
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Desktop Auth Buttons / User Menu */}
            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle />
              {isAuthenticated && user ? (
                <DropdownMenu>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 rounded-full"
                      aria-label="View profile"
                      asChild
                    >
                      <Link to="/profile">
                        <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center text-xs text-white font-bold">
                          {getInitials(user.fullName)}
                        </div>
                      </Link>
                    </Button>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-11 px-3">
                        <span className="text-base font-medium">
                          {user.fullName}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                  </div>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5 text-sm">
                      <p className="font-semibold text-foreground">
                        {user.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{user.username}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2" asChild>
                      <Link to="/profile">
                        <User size={16} />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2" asChild>
                      <Link to="/dashboard">
                        <BarChart3 size={16} />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-2 text-destructive cursor-pointer"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-11 px-5 text-base font-semibold"
                    asChild
                  >
                    <Link to="/login">Sign In</Link>
                  </Button>
                  <Button
                    size="sm"
                    className="h-11 px-5 text-base font-semibold"
                    asChild
                  >
                    <Link to="/register">Sign Up</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              {isAuthenticated && user ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 h-11 px-3"
                  aria-label="View profile"
                  asChild
                >
                  <Link to="/profile">
                    <div className="w-7 h-7 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center text-xs text-white font-bold">
                      {getInitials(user.fullName)}
                    </div>
                  </Link>
                </Button>
              ) : null}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-foreground p-1"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border py-4 space-y-2">
              <div className="px-4">
                <ThemeToggle fullWidth />
              </div>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  aria-current={isActivePath(link.href) ? "page" : undefined}
                  className={`block rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    isActivePath(link.href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated && user?.role === "admin" && (
                <div className="px-4 py-2 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Admin
                  </p>
                  {adminLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        to={link.href}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon size={16} />
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              )}
              <div className="pt-4 border-t border-border space-y-2">
                {isAuthenticated && user ? (
                  <>
                    <div className="px-4 py-2 border-b border-border">
                      <p className="font-semibold text-foreground">
                        {user.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{user.username}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      asChild
                    >
                      <Link to="/profile">
                        <User size={16} />
                        Profile
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      asChild
                    >
                      <Link to="/dashboard">
                        <BarChart3 size={16} />
                        Dashboard
                      </Link>
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full justify-start gap-2"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/login">Sign In</Link>
                    </Button>
                    <Button className="w-full" asChild>
                      <Link to="/register">Sign Up</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">Smart Sign Language</h4>
              <p className="text-sm text-muted-foreground">
                Making sign language more accessible for everyone.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/learn" className="hover:text-foreground">
                    Learn
                  </Link>
                </li>
                <li>
                  <Link to="/translate" className="hover:text-foreground">
                    Translate
                  </Link>
                </li>
                <li>
                  <Link to="/recognition" className="hover:text-foreground">
                    Recognition
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="hover:text-foreground">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/lookup" className="hover:text-foreground">
                    Lookup
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/feedback" className="hover:text-foreground">
                    Feedback
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Feedback</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground">
                    Legal
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground">
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>&copy; Smart Sign Language</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-foreground">
                X
              </a>
              <a href="#" className="hover:text-foreground">
                Facebook
              </a>
              <a href="#" className="hover:text-foreground">
                Instagram
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
