export type Answers = Record<string, string | string[]>;

export type Participant = {
  id: string;
  hospital: "Pentecost Hospital" | "Madina Polyclinic";
  status: "Initial interview" | "Awaiting follow-up" | "Follow-up in progress" | "Complete";
  researcherEmail: string;
  answers: Answers;
  notes: string;
  createdAt: string;
  updatedAt: string;
};
