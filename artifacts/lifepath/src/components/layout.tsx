import { Link, useLocation } from "wouter";
import { Home, CheckSquare, Activity, Users, BarChart2, Settings, BookOpen, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import { useLocation as useWouterLocation } from "wouter";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: Home, color: "#2B6BFF" },
  { href: "/tasks", label: "Tasks", icon: CheckSquare, color: "#00C8FF" },
  { href: "/addiction", label: "Recovery", icon: Activity, color: "#F8A72A" },
  { href: "/body-doubling", label: "Focus", icon: Users, color: "#A78BFA" },
  { href: "/journal", label: "Journal", icon: BookOpen, color: "#00E5A0" },
  { href: "/report", label: "Report", icon: BarChart2, color: "#2B6BFF" },
  { href: "/settings", label: "Settings", icon: Settings, color: "#6B7280" },
];

const MOBILE_NAV = NAV_ITEMS.slice(0, 5);

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [, setLocation] = useWouterLocation();

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "LP";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#0A0E1A" }}>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col flex-shrink-0" style={{ background: "hsl(228 44% 10%)", borderRight: "1px solid hsl(228 47% 14%)" }}>
        {/* Logo */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: "#2B6BFF" }}>LP</div>
            <span className="text-xl font-display font-bold" style={{ color: "#fff" }}>LifePath 2.0</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">The App That Fixes What Life Breaks</p>
        </div>

        {/* User chip */}
        {user && (
          <div className="mx-3 mb-3 px-4 py-3 rounded-xl flex items-center gap-3" style={{ background: "rgba(43,107,255,0.08)", border: "1px solid rgba(43,107,255,0.15)" }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, #2B6BFF, #00C8FF)" }}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{(user as any).email ?? ""}</p>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1 pb-6 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href || location.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: 2 }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium cursor-pointer relative",
                    isActive ? "text-white" : "text-muted-foreground hover:text-foreground"
                  )}
                  style={isActive ? { background: `${item.color}15`, border: `1px solid ${item.color}25` } : {}}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                      style={{ background: item.color }}
                    />
                  )}
                  <item.icon className="w-4 h-4 flex-shrink-0" style={isActive ? { color: item.color } : {}} />
                  <span>{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 mx-3 mb-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-red-400 transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
        <div className="p-4 mx-3 mb-4 rounded-xl" style={{ background: "rgba(43,107,255,0.06)", border: "1px solid rgba(43,107,255,0.15)" }}>
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="text-primary font-semibold">Founded by Muslim Abubakar Toro</span><br />
            Built on peer-reviewed research from Stanford, Harvard, and NIH.
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative" style={{ background: "#0A0E1A" }}>
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around py-2 px-1"
        style={{ background: "hsl(228 44% 10%)", borderTop: "1px solid hsl(228 47% 14%)", paddingBottom: "env(safe-area-inset-bottom, 8px)" }}>
        {MOBILE_NAV.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn("flex flex-col items-center p-2 rounded-xl transition-all", isActive ? "" : "opacity-50")}>
                <div className={cn("w-10 h-10 flex items-center justify-center rounded-xl mb-0.5")}
                  style={isActive ? { background: `${item.color}18` } : {}}>
                  <item.icon className="w-5 h-5" style={isActive ? { color: item.color } : { color: "hsl(220 20% 58%)" }} />
                </div>
                <span className="text-[10px] font-medium" style={isActive ? { color: item.color } : { color: "hsl(220 20% 58%)" }}>
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
