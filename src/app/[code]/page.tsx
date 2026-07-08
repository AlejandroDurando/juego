"use client";

import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dices, Send, Flame, ArrowRight } from "lucide-react";
import { useGameState } from "@/hooks/useGameState";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { supabase } from "@/lib/supabase";
import { questions } from "@/data/questions";
import { poses } from "@/data/poses";

const levelNames: Record<number, string> = {
  1: "Chispa",
  2: "Fuego",
  3: "Brasa",
};

export default function GameRoom({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params);
  const { room, players, turns, currentPlayer, loading, error, setRoom, setTurns } = useGameState(resolvedParams.code);

  const [questionText, setQuestionText] = useState("");
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [answerPoseId, setAnswerPoseId] = useState<string | null>(null);
  const [answerVariant, setAnswerVariant] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);

  // Unlock the next level on this device once the current one is completed.
  const complete = room ? (room.status === "finished" || room.score >= room.game_length) : false;
  useEffect(() => {
    if (!room || !complete) return;
    const unlocked = parseInt(localStorage.getItem("brasa_unlocked_level") || "1", 10);
    const next = Math.min(3, room.current_level + 1);
    if (next > unlocked) localStorage.setItem("brasa_unlocked_level", String(next));
  }, [room, complete]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[var(--brasa)]">Cargando sala...</div>;
  if (error || !room) return <div className="min-h-screen flex items-center justify-center text-red-500">Error: {error || "Sala no encontrada"}</div>;
  if (!currentPlayer) return <div className="min-h-screen flex items-center justify-center">No estás en esta sala.</div>;

  const isMyTurn = room.turn_player === currentPlayer.id || (!room.turn_player && currentPlayer.role === "host");
  const otherPlayer = players.find((p) => p.id !== currentPlayer.id);
  const otherName = otherPlayer?.nickname || "tu pareja";

  // Only turns from the current level matter for play/history; a fresh level starts clean.
  const levelTurns = turns.filter((t) => t.level === room.current_level);
  const lastTurn = levelTurns.length > 0 ? levelTurns[levelTurns.length - 1] : null;
  // The question to answer only counts if it belongs to this level (not a leftover from the previous one).
  const pendingTurn = lastTurn;
  const pendingQuestion = pendingTurn?.new_question_id ? questions.find((q) => q.id === pendingTurn.new_question_id) : null;
  // Custom (hand-written) questions have no id in the catalog: answer as free text.
  const answerType = pendingQuestion?.type ?? "text";

  const isLevelComplete = room.status === "finished" || room.score >= room.game_length;
  const isGameComplete = isLevelComplete && room.current_level >= 3;
  const hasAnsweredPending = !pendingTurn || Boolean(answerText || answerPoseId);
  const canSend = Boolean(questionText.trim()) && hasAnsweredPending && !isSending;
  const progress = Math.min(100, (room.score / room.game_length) * 100);

  const pickRandomQuestion = () => {
    const usedIds = new Set(levelTurns.map((t) => t.new_question_id));
    const pool = questions.filter((q) => q.level === room.current_level);
    const fresh = pool.filter((q) => !usedIds.has(q.id));
    const source = fresh.length > 0 ? fresh : pool;
    const candidates = source.length > 1 ? source.filter((q) => q.id !== questionId) : source;
    const randomQ = candidates[Math.floor(Math.random() * candidates.length)];
    setQuestionText(randomQ.text);
    setQuestionId(randomQ.id);
  };

  const handleSendTurn = async () => {
    if (!questionText.trim() || isSending) return;
    setIsSending(true);

    // Score counts answered questions within the current level.
    const newScore = room.score + (pendingTurn ? 1 : 0);
    const newStatus = newScore >= room.game_length ? "finished" : "active";

    // 1. Insert new turn
    const { data: insertedTurn, error: turnError } = await supabase
      .from("turns")
      .insert({
        room_id: room.id,
        actor_player: currentPlayer.id,
        answers_turn_id: pendingTurn ? pendingTurn.id : null,
        answer_text: answerText || null,
        answer_pose_id: answerPoseId || null,
        answer_variant: answerVariant || null,
        new_question_id: questionId,
        new_question_text: questionText.trim(),
        level: room.current_level
      })
      .select()
      .single();

    if (turnError || !insertedTurn) {
      console.error(turnError);
      alert("No se pudo enviar el turno: " + (turnError?.message ?? "error desconocido"));
      setIsSending(false);
      return;
    }

    // 2. Update room state
    const { data: updatedRoom, error: roomUpdateError } = await supabase
      .from("rooms")
      .update({
        score: newScore,
        status: newStatus,
        turn_player: otherPlayer?.id ?? null // Pass turn to other player
      })
      .eq("id", room.id)
      .select()
      .single();

    if (roomUpdateError || !updatedRoom) {
      console.error(roomUpdateError);
      alert("No se pudo actualizar la sala: " + (roomUpdateError?.message ?? "error desconocido"));
      setIsSending(false);
      return;
    }

    // Reflect the change locally right away instead of waiting on the realtime echo,
    // so the sender's own turn flips to "waiting" immediately.
    setTurns((prev) => prev.some((t) => t.id === insertedTurn.id) ? prev : [...prev, insertedTurn]);
    setRoom(updatedRoom);

    // Reset local state
    setAnswerText("");
    setAnswerPoseId(null);
    setAnswerVariant("");
    setQuestionText("");
    setQuestionId(null);
    setIsSending(false);
  };

  const advanceLevel = async () => {
    if (isAdvancing || room.current_level >= 3) return;
    setIsAdvancing(true);
    const nextLevel = room.current_level + 1;
    const host = players.find((p) => p.role === "host");
    const guest = players.find((p) => p.role === "guest");
    // Alternate who opens each level: level 2 → guest (player 2), level 3 → host again.
    const starter = nextLevel % 2 === 0 ? guest : host;

    const { data: updatedRoom, error: advError } = await supabase
      .from("rooms")
      .update({
        current_level: nextLevel,
        score: 0,
        status: "active",
        turn_player: starter?.id ?? null,
      })
      .eq("id", room.id)
      .eq("current_level", room.current_level) // no-op if the other player already advanced
      .select()
      .maybeSingle();

    if (advError) {
      console.error(advError);
      alert("No se pudo pasar de nivel: " + advError.message);
      setIsAdvancing(false);
      return;
    }
    // updatedRoom is null if the other player advanced first; polling will sync us.
    if (updatedRoom) setRoom(updatedRoom);
    setIsAdvancing(false);
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(
      `Jugá conmigo a Brasa. Entrá a ${window.location.origin} y unite con el código ${room.code}`
    );
    alert("Invitación copiada. Pasásela a tu pareja.");
  };

  if (players.length < 2) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-md w-full"
        >
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-3xl text-[var(--brasa)]">Sala Creada</CardTitle>
              <CardDescription>Esperando a que tu pareja se una...</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-[var(--background)] border border-[var(--card-border)] rounded-md p-4 mb-4">
                <span className="text-2xl font-mono tracking-widest text-[var(--foreground)]">{room.code}</span>
              </div>
              <Button onClick={copyInvite} variant="outline" className="w-full">
                Copiar invitación
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    );
  }

  if (isLevelComplete) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-md w-full"
        >
          <Card className="text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[var(--brasa-light)] to-transparent ember-line" />
            <CardHeader>
              <Flame className="w-8 h-8 mx-auto text-[var(--brasa)] mb-2" />
              {isGameComplete ? (
                <CardTitle className="text-3xl text-[var(--brasa)] font-serif italic">Noche Perfecta</CardTitle>
              ) : (
                <CardTitle className="text-3xl text-[var(--brasa)] font-serif italic">
                  Nivel {room.current_level} completado
                </CardTitle>
              )}
            </CardHeader>
            <CardContent>
              {isGameComplete ? (
                <p className="text-[var(--foreground)] mb-2">Completaron los tres niveles. Es momento de dejar los teléfonos.</p>
              ) : (
                <>
                  <p className="text-[var(--text-muted)] mb-6">
                    Terminaron el nivel {levelNames[room.current_level]}. Cuando estén listos, sigan al siguiente — abre {otherName}… o vos.
                  </p>
                  <Button onClick={advanceLevel} disabled={isAdvancing} size="lg" className="w-full">
                    {isAdvancing ? "Pasando..." : `Pasemos al Nivel ${room.current_level + 1}`}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col p-4 md:p-8 max-w-2xl mx-auto pb-24">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="font-serif text-2xl text-[var(--brasa)] flex items-center gap-2">
            <Flame className="w-5 h-5 opacity-80" />
            Nivel {room.current_level} · {levelNames[room.current_level] ?? ""}
          </h2>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-1.5 w-36 rounded-full bg-[var(--card-border)] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[var(--brasa)] to-[var(--brasa-light)]"
                initial={false}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <p className="text-xs text-[var(--text-muted)]">{room.score} / {room.game_length}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-full bg-[var(--card-bg)] border border-[var(--card-border)] backdrop-blur-md">
          <span className={isMyTurn ? "turn-dot" : "turn-dot-idle"} />
          {isMyTurn ? "Es tu turno" : `Es el turno de ${otherName}`}
        </div>
      </header>

      {/* History log (last few turns of this level) */}
      <div className="flex-1 overflow-y-auto mb-8 space-y-4">
        <AnimatePresence initial={false}>
          {levelTurns.slice(-3).map((turn) => (
            <motion.div
              key={turn.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className={`p-4 rounded-xl border backdrop-blur-md ${turn.actor_player === currentPlayer.id ? 'bg-[var(--card-bg)] border-[var(--card-border)] ml-8' : 'bg-black/25 border-white/[0.06] mr-8'}`}
            >
              {turn.answers_turn_id && (
                <div className="mb-2 pb-2 border-b border-[var(--card-border)]">
                  <span className="text-xs text-[var(--text-faint)] block mb-1">Respuesta:</span>
                  {turn.answer_pose_id ? (
                    <div>
                      <img src={poses.find(p => p.id === turn.answer_pose_id)?.imageSrc} className="w-32 h-32 object-contain bg-[var(--background)] rounded p-2" alt="Pose" />
                      {turn.answer_variant && (
                        <p className="text-sm text-[var(--text-muted)] italic mt-1">&ldquo;{turn.answer_variant}&rdquo;</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--text-muted)] italic">
                      &ldquo;{turn.answer_text}{turn.answer_variant ? ` — ${turn.answer_variant}` : ""}&rdquo;
                    </p>
                  )}
                </div>
              )}
              <span className="text-xs text-[var(--text-faint)] block mb-1">Pregunta:</span>
              <p className="font-serif text-lg">{turn.new_question_text}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Action Area */}
      {isMyTurn ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[var(--brasa-light)] to-transparent ember-line" />
            <CardContent className="pt-6 space-y-6">

              {/* Answer the previous question first */}
              {pendingTurn && (
                <div className="space-y-4">
                  <p className="text-xs uppercase tracking-widest text-[var(--text-faint)]">{otherName} te preguntó:</p>
                  <h3 className="font-serif text-xl">{pendingTurn.new_question_text}</h3>

                  {answerType === "image_choice" ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        {(pendingQuestion?.options ?? poses).map(pose => (
                          <motion.div
                            key={pose.id}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setAnswerPoseId(pose.id)}
                            className={`cursor-pointer rounded-lg border-2 p-2 transition-colors ${answerPoseId === pose.id ? 'border-[var(--brasa)] bg-black' : 'border-[var(--card-border)] bg-[var(--background)]'}`}
                          >
                            <img src={pose.imageSrc} alt={pose.label} className="w-full h-32 object-contain" />
                          </motion.div>
                        ))}
                      </div>
                      {pendingQuestion?.allowVariantNote && (
                        <Input
                          placeholder="Alguna variante o nota (opcional)"
                          value={answerVariant}
                          onChange={(e) => setAnswerVariant(e.target.value)}
                        />
                      )}
                    </>
                  ) : answerType === "yes_no_followup" ? (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant={answerText === "Sí" ? "default" : "outline"}
                          onClick={() => setAnswerText("Sí")}
                        >
                          Sí
                        </Button>
                        <Button
                          variant={answerText === "No" ? "default" : "outline"}
                          onClick={() => { setAnswerText("No"); setAnswerVariant(""); }}
                        >
                          No
                        </Button>
                      </div>
                      <AnimatePresence>
                        {answerText === "Sí" && pendingQuestion?.followup && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="overflow-hidden"
                          >
                            <Input
                              placeholder={pendingQuestion.followup.text + (pendingQuestion.followup.examples ? ` (${pendingQuestion.followup.examples.join(", ")})` : "")}
                              value={answerVariant}
                              onChange={(e) => setAnswerVariant(e.target.value)}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <Input
                      placeholder="Tu respuesta..."
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                    />
                  )}
                </div>
              )}

              {pendingTurn && <div className="border-t border-[var(--card-border)]" />}

              {/* Choose your question: write it or let chance decide */}
              <div className={`space-y-4 transition-opacity duration-300 ${hasAnsweredPending ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                <p className="text-xs uppercase tracking-widest text-[var(--text-faint)]">
                  {pendingTurn ? `Tu pregunta para ${otherName}:` : `Abrís el nivel. Tu pregunta para ${otherName}:`}
                </p>
                <Input
                  placeholder="Escribí tu propia pregunta..."
                  value={questionText}
                  onChange={(e) => { setQuestionText(e.target.value); setQuestionId(null); }}
                />
                <div className="flex gap-3">
                  <Button variant="outline" onClick={pickRandomQuestion} className="flex-1">
                    <Dices className="w-4 h-4" />
                    Al azar
                  </Button>
                  <Button onClick={handleSendTurn} disabled={!canSend} className="flex-1">
                    <Send className="w-4 h-4" />
                    {isSending ? "Enviando..." : "Enviar pregunta"}
                  </Button>
                </div>
              </div>

            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center p-8 border border-dashed border-[var(--card-border)] rounded-xl text-[var(--text-faint)] animate-pulse"
        >
          Esperando a que {otherName} responda...
        </motion.div>
      )}

    </main>
  );
}
