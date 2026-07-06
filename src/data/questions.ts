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
  }
];
