"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { useGameState } from "@/hooks/useGameState";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card";
import { Roulette } from "@/components/game/Roulette";
import { Input } from "@/components/ui/Input";
import { supabase } from "@/lib/supabase";
import { questions, Question } from "@/data/questions";
import { poses } from "@/data/poses";

export default function GameRoom({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params);
  const { room, players, turns, currentPlayer, loading, error } = useGameState(resolvedParams.code);
  const router = useRouter();

  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [answerPoseId, setAnswerPoseId] = useState<string | null>(null);
  
  if (loading) return <div className="min-h-screen flex items-center justify-center text-[var(--brasa)]">Cargando sala...</div>;
  if (error || !room) return <div className="min-h-screen flex items-center justify-center text-red-500">Error: {error || "Sala no encontrada"}</div>;
  if (!currentPlayer) return <div className="min-h-screen flex items-center justify-center">No estás en esta sala.</div>;

  const isMyTurn = room.turn_player === currentPlayer.id || (!room.turn_player && currentPlayer.role === "host");
  const otherPlayer = players.find((p) => p.id !== currentPlayer.id);
  const lastTurn = turns.length > 0 ? turns[turns.length - 1] : null;
  const isFinished = room.status === "finished" || room.score >= room.game_length;

  const handleSpinEnd = () => {
    // Pick a random question based on current level
    const levelQuestions = questions.filter(q => q.level === room.current_level);
    const randomQ = levelQuestions[Math.floor(Math.random() * levelQuestions.length)];
    setSelectedQuestion(randomQ);
  };

  const handleSendTurn = async () => {
    if (!selectedQuestion) return;
    
    let newScore = room.score;
    if (lastTurn) newScore += 1;

    let newLevel = room.current_level;
    const third = Math.ceil(room.game_length / 3);
    if (newScore >= third && newScore < third * 2) newLevel = 2;
    if (newScore >= third * 2) newLevel = 3;

    const newStatus = newScore >= room.game_length ? "finished" : "active";

    // 1. Insert new turn
    const { error: turnError } = await supabase.from("turns").insert({
      room_id: room.id,
      actor_player: currentPlayer.id,
      answers_turn_id: lastTurn ? lastTurn.id : null,
      answer_text: answerText || null,
      answer_pose_id: answerPoseId || null,
      new_question_id: selectedQuestion.id,
      new_question_text: selectedQuestion.text,
      level: newLevel
    });

    if (turnError) {
      console.error(turnError);
      return;
    }

    // 2. Update room state
    await supabase.from("rooms").update({
      score: newScore,
      current_level: newLevel,
      status: newStatus,
      turn_player: otherPlayer?.id // Pass turn to other player
    }).eq("id", room.id);

    // Reset local state
    setAnswerText("");
    setAnswerPoseId(null);
    setSelectedQuestion(null);
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(`${window.location.origin}`);
    alert(`Código copiado: ${room.code}. Compartí el link con tu pareja.`);
  };

  if (players.length < 2) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle className="text-3xl text-[var(--brasa)]">Sala Creada</CardTitle>
            <CardDescription>Esperando a que tu pareja se una...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-md p-4 mb-4">
              <span className="text-2xl font-mono tracking-widest text-[var(--foreground)]">{room.code}</span>
            </div>
            <Button onClick={copyInvite} variant="outline" className="w-full">
              Copiar invitación
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (isFinished) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle className="text-3xl text-[var(--brasa)] font-serif italic">Noche Perfecta</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--foreground)] mb-6">Han completado el juego. Es momento de dejar los teléfonos.</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col p-4 md:p-8 max-w-2xl mx-auto pb-24">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="font-serif text-2xl text-[var(--brasa)]">Nivel {room.current_level}</h2>
          <p className="text-sm text-gray-400">Puntaje: {room.score} / {room.game_length}</p>
        </div>
        <div className="text-sm px-3 py-1 rounded-full bg-[var(--card-bg)] border border-[var(--card-border)]">
          {isMyTurn ? "Es tu turno" : "Esperando..."}
        </div>
      </header>

      {/* History log (last few turns) */}
      <div className="flex-1 overflow-y-auto mb-8 space-y-4">
        {turns.slice(-3).map((turn) => (
          <div key={turn.id} className={`p-4 rounded-lg border ${turn.actor_player === currentPlayer.id ? 'bg-[var(--card-bg)] border-[var(--card-border)] ml-8' : 'bg-[#1a1a1a] border-gray-800 mr-8'}`}>
            {turn.answers_turn_id && (
              <div className="mb-2 pb-2 border-b border-[var(--card-border)]">
                <span className="text-xs text-gray-500 block mb-1">Respuesta:</span>
                {turn.answer_pose_id ? (
                  <img src={poses.find(p => p.id === turn.answer_pose_id)?.imageSrc} className="w-32 h-32 object-contain bg-[var(--background)] rounded p-2" alt="Pose" />
                ) : (
                  <p className="text-sm text-gray-300 italic">"{turn.answer_text}"</p>
                )}
              </div>
            )}
            <span className="text-xs text-gray-500 block mb-1">Pregunta:</span>
            <p className="font-serif text-lg">{turn.new_question_text}</p>
          </div>
        ))}
      </div>

      {/* Action Area */}
      {isMyTurn ? (
        <Card className="border-[var(--brasa)] border-opacity-30 shadow-lg relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--brasa)] to-[var(--brasa-light)] opacity-50" />
           <CardContent className="pt-6">
            
            {/* Si hay una pregunta anterior que responder */}
            {lastTurn && !selectedQuestion && (
              <div className="mb-6 space-y-4">
                <h3 className="font-serif text-xl mb-2">{lastTurn.new_question_text}</h3>
                
                {lastTurn.level === 2 && lastTurn.new_question_text.includes("pose") ? (
                  <div className="grid grid-cols-2 gap-4">
                    {poses.map(pose => (
                      <div 
                        key={pose.id} 
                        onClick={() => setAnswerPoseId(pose.id)}
                        className={`cursor-pointer rounded-lg border-2 p-2 transition-all ${answerPoseId === pose.id ? 'border-[var(--brasa)] bg-black' : 'border-[var(--card-border)] bg-[var(--background)]'}`}
                      >
                        <img src={pose.imageSrc} alt={pose.label} className="w-full h-32 object-contain" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Input 
                    placeholder="Tu respuesta..." 
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                  />
                )}
              </div>
            )}

            {/* Ruleta o Pregunta Seleccionada */}
            <div className="flex flex-col items-center justify-center py-4">
              {!selectedQuestion ? (
                <div className={`${(!lastTurn || (lastTurn && (answerText || answerPoseId))) ? 'opacity-100' : 'opacity-30 pointer-events-none transition-opacity'}`}>
                  <p className="text-sm text-gray-400 text-center mb-4">
                    {lastTurn ? "Ahora elegí la tuya." : "Arrancá el juego."}
                  </p>
                  <Roulette onSpinEnd={handleSpinEnd} isSpinning={isSpinning} setIsSpinning={setIsSpinning} />
                </div>
              ) : (
                <div className="w-full space-y-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <p className="text-xs uppercase tracking-widest text-gray-500">Tu pregunta será:</p>
                   <h3 className="font-serif text-2xl px-4">{selectedQuestion.text}</h3>
                   <Button onClick={handleSendTurn} size="lg" className="w-full mt-4">
                     Enviar Turno
                   </Button>
                   <Button variant="ghost" size="sm" onClick={() => setSelectedQuestion(null)}>
                     Girar de nuevo
                   </Button>
                </div>
              )}
            </div>

           </CardContent>
        </Card>
      ) : (
         <div className="text-center p-8 border border-dashed border-[var(--card-border)] rounded-lg text-gray-500 animate-pulse">
            Esperando a que tu pareja responda...
         </div>
      )}

    </main>
  );
}
