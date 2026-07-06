export type Pose = {
  id: string;
  label: string;
  imageSrc: string;
};

export const poses: Pose[] = [
  { id: "pose_01", label: "Pose 1", imageSrc: "/poses/pose-01.svg" },
  { id: "pose_02", label: "Pose 2", imageSrc: "/poses/pose-02.svg" },
  { id: "pose_03", label: "Pose 3", imageSrc: "/poses/pose-03.svg" },
  { id: "pose_04", label: "Pose 4", imageSrc: "/poses/pose-04.svg" },
];
