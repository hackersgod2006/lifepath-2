import { Link, useLocation } from "wouter";
import { Home, CheckSquare, Activity, Users, BarChart2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: Home, color: "#2B6BFF" },
  { href: "/tasks", label: "Tasks", icon: CheckSquare, color: "#00C8FF" },
  { href: "/addiction", label: "Recovery", icon: Activity, color: "#F8A72A" },
  { href: "/body-doubling", label: "Focus", icon: Users, color: "#A78BFA" },
  { href: "/report", label: "Report", icon: BarChart2, color: "#00E5A0" },
  { href: "/settings", label: "Settings", icon: Settings, color: "#6B7280" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

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

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1 pb-6">
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
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn("flex flex-col items-center p-2 rounded-xl transition-all", isActive ? "" : "opacity-50")}>
                <div className={cn("w-10 h-10 flex items-center justify-center rounded-xl mb-0.5", isActive ? "" : "")}
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
