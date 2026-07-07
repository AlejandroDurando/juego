export type QuestionType = "text" | "image_choice" | "yes_no_followup";

export type Question = {
  id: string;
  level: 1 | 2 | 3;
  type: QuestionType;
  text: string;
  options?: { id: string; label: string; imageSrc: string }[];
  allowVariantNote?: boolean;
  followup?: { text: string; examples?: string[] };
};

export const questions: Question[] = [
  // Nivel 1
  {
    id: "q_1_1",
    level: 1,
    type: "text",
    text: "¿Qué te gusta o te calienta cuando ves a alguien en la calle?"
  },
  {
    id: "q_1_2",
    level: 1,
    type: "text",
    text: "¿Sos más dominante, te gusta que te dominen, o ambas? ¿Te calienta?"
  },
  {
    id: "q_1_3",
    level: 1,
    type: "text",
    text: "¿Qué es lo primero que te atrae de alguien?"
  },
  {
    id: "q_1_4",
    level: 1,
    type: "text",
    text: "¿Qué es más importante para vos: la mirada, la voz o el olor?"
  },
  {
    id: "q_1_5",
    level: 1,
    type: "text",
    text: "¿Qué parte de tu cuerpo te gusta más que te acaricien?"
  },
  {
    id: "q_1_6",
    level: 1,
    type: "yes_no_followup",
    text: "¿Alguna vez tuviste un sueño subido de tono conmigo?",
    followup: { text: "Contame un poco..." }
  },
  {
    id: "q_1_7",
    level: 1,
    type: "text",
    text: "¿Qué te gusta que te digan al oído?"
  },
  // Nivel 2
  {
    id: "q_2_1",
    level: 2,
    type: "image_choice",
    text: "¿Cuál es tu pose favorita?",
    allowVariantNote: true,
    // Note: Options will be injected from poses.ts or defined here.
    // For simplicity, we reference the pose IDs here.
    options: [
      { id: "pose_01", label: "Pose 1", imageSrc: "/poses/pose-01.svg" },
      { id: "pose_02", label: "Pose 2", imageSrc: "/poses/pose-02.svg" },
      { id: "pose_03", label: "Pose 3", imageSrc: "/poses/pose-03.svg" },
      { id: "pose_04", label: "Pose 4", imageSrc: "/poses/pose-04.svg" },
    ]
  },
  {
    id: "q_2_2",
    level: 2,
    type: "text",
    text: "¿Te gusta el juego de roles?"
  },
  {
    id: "q_2_3",
    level: 2,
    type: "text",
    text: "¿Te gusta hablar durante el sexo o preferís el silencio?"
  },
  {
    id: "q_2_4",
    level: 2,
    type: "text",
    text: "¿Te gusta el sexo oral? ¿Cuánto?"
  },
  {
    id: "q_2_5",
    level: 2,
    type: "text",
    text: "¿Dónde te gusta más que te besen, además de la boca?"
  },
  {
    id: "q_2_6",
    level: 2,
    type: "text",
    text: "¿Preferís luces prendidas, apagadas o a media luz? ¿Por qué?"
  },
  {
    id: "q_2_7",
    level: 2,
    type: "yes_no_followup",
    text: "¿Te calienta la idea de mandarnos mensajes atrevidos durante el día?",
    followup: { text: "¿De qué tipo?", examples: ["fotos", "audios", "textos"] }
  },
  {
    id: "q_2_8",
    level: 2,
    type: "text",
    text: "¿Qué prenda mía te gustaría que use más seguido?"
  },
  {
    id: "q_2_9",
    level: 2,
    type: "yes_no_followup",
    text: "¿Hay alguna película o escena que te haya calentado y quieras recrear?",
    followup: { text: "¿Cuál?" }
  },
  // Nivel 3
  {
    id: "q_3_1",
    level: 3,
    type: "yes_no_followup",
    text: "¿Tenés alguna fantasía que te gustaría cumplir?",
    followup: {
      text: "¿Cuál?",
      examples: ["juguetes", "un elemento", "una pose", "un lugar"]
    }
  },
  {
    id: "q_3_2",
    level: 3,
    type: "text",
    text: "¿Te gusta el sexo de alguna manera en especial? Fuerte, lento, franeleo, o una combinación."
  },
  {
    id: "q_3_3",
    level: 3,
    type: "yes_no_followup",
    text: "¿Hay algún lugar fuera de la cama donde te gustaría que pase algo?",
    followup: { text: "¿Dónde?", examples: ["la cocina", "el auto", "la ducha"] }
  },
  {
    id: "q_3_4",
    level: 3,
    type: "text",
    text: "¿Qué es lo más atrevido que hiciste y repetirías sin dudarlo?"
  },
  {
    id: "q_3_5",
    level: 3,
    type: "yes_no_followup",
    text: "¿Te gustaría que probemos juguetes juntos?",
    followup: { text: "¿Cuál te da curiosidad?" }
  },
  {
    id: "q_3_6",
    level: 3,
    type: "text",
    text: "Describí tu previa ideal, con lujo de detalles."
  },
  {
    id: "q_3_7",
    level: 3,
    type: "yes_no_followup",
    text: "¿Hay algo que nunca te animaste a pedirme?",
    followup: { text: "Este es el momento. Contame." }
  },
  {
    id: "q_3_8",
    level: 3,
    type: "text",
    text: "¿Qué te gustaría que haga la próxima vez, apenas empecemos?"
  }
];
