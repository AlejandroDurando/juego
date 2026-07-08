"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { supabase, ensureSession } from "@/lib/supabase";

// Deterministic so SSR and client render the same markup.
const EMBERS = [
  { left: "8%", duration: "13s", delay: "0s", drift: "26px" },
  { left: "22%", duration: "17s", delay: "3.5s", drift: "-18px" },
  { left: "37%", duration: "12s", delay: "7s", drift: "14px" },
  { left: "52%", duration: "19s", delay: "1.5s", drift: "-30px" },
  { left: "66%", duration: "14s", delay: "5s", drift: "22px" },
  { left: "79%", duration: "16s", delay: "9s", drift: "-12px" },
  { left: "91%", duration: "12.5s", delay: "2.5s", drift: "18px" },
];

function EmberField() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0" aria-hidden>
      {EMBERS.map((e, i) => (
        <span
          key={i}
          className="ember-particle"
          style={{
            left: e.left,
            animationDuration: e.duration,
            animationDelay: e.delay,
            ["--drift" as never]: e.drift,
          }}
        />
      ))}
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [is18Plus, setIs18Plus] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [gameLength, setGameLength] = useState(15);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user already confirmed 18+
    const confirmed = localStorage.getItem("brasa_18plus");
    if (confirmed) {
      setIs18Plus(true);
    }
    const savedNickname = localStorage.getItem("brasa_nickname");
    if (savedNickname) {
      setNickname(savedNickname);
    }
  }, []);

  const confirmAge = () => {
    localStorage.setItem("brasa_18plus", "true");
    setIs18Plus(true);
  };

  const handleCreateRoom = async () => {
    setIsLoading(true);
    const code = "BRASA-" + Math.random().toString(36).substring(2, 6).toUpperCase();

    try {
      await ensureSession();
    } catch (err) {
      console.error("Error creating session", err);
      alert("No se pudo iniciar sesión. Probá de nuevo.");
      setIsLoading(false);
      return;
    }

    const { data: roomData, error: roomError } = await supabase
      .rpc("create_room", { p_code: code, p_game_length: gameLength, p_nickname: nickname || null });

    if (roomError || !roomData) {
      console.error("Error creating room", roomError);
      alert("No se pudo crear la sala: " + (roomError?.message ?? "error desconocido"));
      setIsLoading(false);
      return;
    }

    router.push(`/${code}`);
  };

  const handleJoinRoom = async () => {
    if (!joinCode) return;
    setIsLoading(true);

    try {
      await ensureSession();
    } catch (err) {
      console.error("Error creating session", err);
      alert("No se pudo iniciar sesión. Probá de nuevo.");
      setIsLoading(false);
      return;
    }

    const { data: roomData, error: roomError } = await supabase
      .rpc("join_room", { p_code: joinCode.toUpperCase(), p_nickname: nickname || null });

    if (roomError || !roomData) {
      console.error("Error joining room", roomError);
      alert(roomError?.message ?? "Sala no encontrada");
      setIsLoading(false);
      return;
    }

    router.push(`/${joinCode.toUpperCase()}`);
  };

  if (!is18Plus) {
    return (
      <main className="relative flex min-h-screen items-center justify-center p-4 overflow-hidden">
        <div className="orb absolute top-[-15%] left-[-10%] w-[28rem] h-[28rem] bg-[var(--brasa)] rounded-full blur-[160px] opacity-20 pointer-events-none" />
        <EmberField />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-md w-full z-10"
        >
          <Card className="text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[var(--brasa-light)] to-transparent ember-line" />
            <CardContent className="p-10">
              <Flame className="w-8 h-8 mx-auto text-[var(--brasa-light)] mb-5" />
              <h1 className="title-ember font-serif text-4xl font-bold mb-3">Brasa</h1>
              <p className="text-[var(--text-muted)] mb-2">Un juego privado para dos personas.</p>
              <p className="text-sm text-[var(--text-faint)] mb-8 leading-relaxed">
                Pensado para adultos que quieren explorar sus gustos e intimidad de forma elegante y consensuada. Pueden frenar en cualquier momento.
              </p>
              <Button onClick={confirmAge} className="w-full" size="lg">
                Soy mayor de 18 años
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 overflow-hidden">
      {/* Ambient glow */}
      <div className="orb absolute top-[-15%] left-[-10%] w-[28rem] h-[28rem] bg-[var(--brasa)] rounded-full blur-[160px] opacity-25 pointer-events-none" />
      <div className="orb-reverse absolute bottom-[-15%] right-[-10%] w-[28rem] h-[28rem] bg-[var(--brasa-light)] rounded-full blur-[160px] opacity-15 pointer-events-none" />
      <EmberField />

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="mb-10 text-center z-10"
      >
        <p className="text-[11px] uppercase tracking-[0.4em] text-[var(--brasa-light)]/80 mb-5">
          Un juego para dos
        </p>
        <h1 className="title-ember font-serif text-6xl md:text-8xl font-bold tracking-tight mb-4">
          Brasa
        </h1>
        <p className="text-lg text-[var(--text-muted)] font-light">
          Explorá la intimidad, a tu ritmo.
        </p>
      </motion.div>

      {/* Single panel: name → create → join */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
        className="w-full max-w-md z-10"
      >
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[var(--brasa-light)] to-transparent ember-line" />
          <CardContent className="p-8 space-y-6">
            <div className="space-y-2.5">
              <label className="text-[11px] uppercase tracking-[0.25em] text-[var(--text-faint)]">
                Tu nombre
              </label>
              <Input
                placeholder="¿Cómo te llamás?"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  localStorage.setItem("brasa_nickname", e.target.value);
                }}
                maxLength={20}
              />
            </div>

            <div className="space-y-2.5">
              <label className="text-[11px] uppercase tracking-[0.25em] text-[var(--text-faint)]">
                Cantidad de preguntas
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 15].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setGameLength(n)}
                    className={`h-11 rounded-lg border text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                      gameLength === n
                        ? "border-[rgba(230,126,34,0.5)] bg-[var(--brasa)]/15 text-[var(--foreground)] shadow-[0_0_16px_var(--brasa-glow)]"
                        : "border-[var(--card-border)] bg-white/[0.02] text-[var(--text-muted)] hover:bg-white/[0.06]"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleCreateRoom}
              disabled={isLoading}
              size="lg"
              className="w-full font-medium"
            >
              <Flame className="w-4 h-4" />
              {isLoading ? "Creando sala..." : "Crear nueva sala"}
            </Button>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[var(--card-border)]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#151009] px-3 text-[11px] uppercase tracking-[0.25em] text-[var(--text-faint)] rounded">
                  o unite con un código
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Input
                placeholder="BRASA-8F2K"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="text-center font-mono uppercase tracking-widest"
              />
              <Button
                variant="outline"
                onClick={handleJoinRoom}
                disabled={isLoading || !joinCode}
                className="px-6 h-11"
              >
                Entrar
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-[var(--text-faint)] tracking-wide">
          Privado &middot; Sin registro &middot; Frenen cuando quieran
        </p>
      </motion.div>
    </main>
  );
}
