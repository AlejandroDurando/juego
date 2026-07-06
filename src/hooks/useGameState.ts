"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database.types";

type Room = Database["public"]["Tables"]["rooms"]["Row"];
type Player = Database["public"]["Tables"]["players"]["Row"];
type Turn = Database["public"]["Tables"]["turns"]["Row"];

export function useGameState(roomCode: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadState = useCallback(async () => {
    // Get Room
    const { data: roomData, error: roomError } = await supabase
      .from("rooms")
      .select("*")
      .eq("code", roomCode)
      .single();

    if (roomError) throw roomError;
    setRoom(roomData);

    // Get Players
    const { data: playersData, error: playersError } = await supabase
      .from("players")
      .select("*")
      .eq("room_id", roomData.id);

    if (playersError) throw playersError;
    setPlayers(playersData || []);

    // Identify Current Player from device_id
    const deviceId = localStorage.getItem("brasa_device_id");
    const me = playersData?.find((p) => p.device_id === deviceId);
    if (me) {
      setCurrentPlayer(me);
    } else {
      throw new Error("Jugador no encontrado en esta sala");
    }

    // Get Turns
    const { data: turnsData, error: turnsError } = await supabase
      .from("turns")
      .select("*")
      .eq("room_id", roomData.id)
      .order("created_at", { ascending: true });

    if (turnsError) throw turnsError;
    setTurns(turnsData || []);
  }, [roomCode]);

  useEffect(() => {
    loadState().catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [loadState]);

  // Realtime can be delayed or miss events (e.g. reconnects), so poll in the
  // background as a fallback instead of requiring a manual refresh.
  useEffect(() => {
    const interval = setInterval(() => {
      loadState().catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, [loadState]);

  // Set up Realtime subscriptions
  useEffect(() => {
    if (!room) return;

    const channel = supabase
      .channel(`room:${room.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `id=eq.${room.id}` },
        (payload) => {
          setRoom(payload.new as Room);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `room_id=eq.${room.id}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setPlayers((prev) => [...prev, payload.new as Player]);
          } else if (payload.eventType === "UPDATE") {
            setPlayers((prev) => prev.map((p) => p.id === payload.new.id ? payload.new as Player : p));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "turns", filter: `room_id=eq.${room.id}` },
        (payload) => {
          const newTurn = payload.new as Turn;
          setTurns((prev) => prev.some((t) => t.id === newTurn.id) ? prev : [...prev, newTurn]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room]);

  return { room, players, turns, currentPlayer, loading, error, setRoom, setTurns };
}
