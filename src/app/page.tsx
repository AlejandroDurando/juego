"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

export default function LandingPage() {
  const router = useRouter();
  const [is18Plus, setIs18Plus] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user already confirmed 18+
    const confirmed = localStorage.getItem("brasa_18plus");
    if (confirmed) {
      setIs18Plus(true);
    }
  }, []);

  const confirmAge = () => {
    localStorage.setItem("brasa_18plus", "true");
    setIs18Plus(true);
  };

  const getOrCreateDeviceId = () => {
    let deviceId = localStorage.getItem("brasa_device_id");
    if (!deviceId) {
      deviceId = uuidv4();
      localStorage.setItem("brasa_device_id", deviceId);
    }
    return deviceId;
  };

  const handleCreateRoom = async () => {
    setIsLoading(true);
    const deviceId = getOrCreateDeviceId();
    const code = "BRASA-" + Math.random().toString(36).substring(2, 6).toUpperCase();

    const { data: roomData, error: roomError } = await supabase
      .from("rooms")
      .insert([{ code, game_length: 15 }]) // Defaulting to 15 for now, could add UI for this
      .select()
      .single();

    if (roomError || !roomData) {
      console.error("Error creating room", roomError);
      alert("No se pudo crear la sala: " + (roomError?.message ?? "error desconocido"));
      setIsLoading(false);
      return;
    }

    const { error: playerError } = await supabase
      .from("players")
      .insert([{ room_id: roomData.id, device_id: deviceId, role: "host" }]);

    if (playerError) {
      console.error("Error joining as host", playerError);
      alert("No se pudo unir a la sala: " + playerError.message);
      setIsLoading(false);
      return;
    }

    router.push(`/${code}`);
  };

  const handleJoinRoom = async () => {
    if (!joinCode) return;
    setIsLoading(true);
    const deviceId = getOrCreateDeviceId();

    // Find room
    const { data: roomData, error: roomError } = await supabase
      .from("rooms")
      .select()
      .eq("code", joinCode.toUpperCase())
      .single();

    if (roomError || !roomData) {
      alert("Sala no encontrada");
      setIsLoading(false);
      return;
    }

    // Check if already in room
    const { data: existingPlayer } = await supabase
      .from("players")
      .select()
      .eq("room_id", roomData.id)
      .eq("device_id", deviceId)
      .single();

    if (!existingPlayer) {
      // Join as guest
      const { error: playerError } = await supabase
        .from("players")
        .insert([{ room_id: roomData.id, device_id: deviceId, role: "guest" }]);

      if (playerError) {
        console.error("Error joining room", playerError);
        setIsLoading(false);
        return;
      }
    }

    router.push(`/${joinCode.toUpperCase()}`);
  };

  if (!is18Plus) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle className="text-3xl text-[var(--brasa)]">Brasa</CardTitle>
            <CardDescription className="text-base mt-2">
              Un juego privado para dos personas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-300 mb-6">
              Este es un juego pensado para adultos que quieren explorar sus gustos e intimidad de forma elegante y consensuada. Pueden frenar en cualquier momento.
            </p>
            <Button onClick={confirmAge} className="w-full" size="lg">
              Soy mayor de 18 años
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[var(--brasa)] rounded-full blur-[150px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[var(--brasa-light)] rounded-full blur-[150px] opacity-10 pointer-events-none" />

      <div className="mb-12 text-center z-10">
        <h1 className="font-serif text-5xl md:text-7xl font-bold tracking-tight text-[var(--brasa)] mb-4">
          Brasa
        </h1>
        <p className="text-lg text-gray-400 font-light">Explorá la intimidad, a tu ritmo.</p>
      </div>

      <div className="w-full max-w-md space-y-8 z-10">
        <Card className="bg-opacity-50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Crear Sala</CardTitle>
            <CardDescription>Iniciá un nuevo juego y compartí el link.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={handleCreateRoom} disabled={isLoading} className="w-full">
              {isLoading ? "Creando..." : "Crear nueva sala"}
            </Button>
          </CardFooter>
        </Card>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[var(--card-border)]" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[var(--background)] px-2 text-gray-500">O unirse a una</span>
          </div>
        </div>

        <Card className="bg-opacity-50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Unirse a Sala</CardTitle>
            <CardDescription>Ingresá el código de invitación.</CardDescription>
          </CardHeader>
          <CardContent>
            <Input 
              placeholder="Ej. BRASA-8F2K" 
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="text-center font-mono uppercase tracking-widest"
            />
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={handleJoinRoom} disabled={isLoading || !joinCode} className="w-full">
              Entrar
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
