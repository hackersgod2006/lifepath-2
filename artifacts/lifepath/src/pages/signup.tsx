import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Brain, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";

const BENEFITS = [
  "Procrastination Killer — Temporal Motivation Theory",
  "Addiction Recovery — Dopamine Science (Lembke, 2021)",
  "Body Doubling — Social Facilitation (Zajonc, 1965)",
  "Life Score Engine tracking real progress",
];

export default function Signup() {
  const [, setLocation] = useLocation();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordStrength = password.length === 0 ? null :
    password.length < 8 ? "weak" :
    password.length < 12 ? "fair" : "strong";

  const strengthColor = passwordStrength === "weak" ? "#EF4444" : passwordStrength === "fair" ? "#F59E0B" : "#00E5A0";
  const strengthWidth = passwordStrength === "weak" ? "33%" : passwordStrength === "fair" ? "66%" : "100%";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      setLocation("/");
    } catch (err: any) {
      setError(err.message ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#0A0E1A" }}>
      {/* Left panel — benefits */}
      <div className="hidden lg:flex w-96 flex-col justify-center px-12 flex-shrink-0" style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, #2B6BFF, #00C8FF)" }}>
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-display font-bold text-white mb-2">LifePath 2.0</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The only personal development app built entirely on peer-reviewed behavioural science.
          </p>
        </div>
        <div className="space-y-4">
          {BENEFITS.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-3"
            >
              <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#00E5A0" }} />
              <span className="text-sm text-muted-foreground">{b}</span>
            </motion.div>
          ))}
        </div>
        <div className="mt-auto pt-12">
          <p className="text-xs text-muted-foreground opacity-60">Founded by Muslim Abubakar Toro</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-white">Create your account</h1>
            <p className="text-muted-foreground mt-2 text-sm">Free. No credit card required.</p>
          </div>

          <div className="rounded-2xl p-8 space-y-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    className="pl-10 h-12 bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="pl-10 h-12 bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    className="pl-10 pr-10 h-12 bg-white/5 border-white/10 text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="space-y-1">
                    <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: strengthColor }}
                        animate={{ width: strengthWidth }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className="text-xs" style={{ color: strengthColor }}>
                      {passwordStrength === "weak" ? "Too short" : passwordStrength === "fair" ? "Fair — add more characters" : "Strong password"}
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3"
                >
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-semibold gap-2"
                style={{ background: "linear-gradient(135deg, #2B6BFF, #00C8FF)" }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Start my journey <ArrowRight className="w-4 h-4" /></>
                )}
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                onClick={() => setLocation("/login")}
                className="font-semibold hover:text-white transition-colors"
                style={{ color: "#2B6BFF" }}
              >
                Sign in
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
