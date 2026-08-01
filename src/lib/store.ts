import { Participant } from "./types";

const KEY = "dolii-demo-participants";

export function getLocalParticipants(): Participant[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as Participant[];
  } catch {
    return [];
  }
}

export function saveLocalParticipant(participant: Participant) {
  const records = getLocalParticipants();
  const index = records.findIndex((record) => record.id === participant.id);
  if (index >= 0) records[index] = participant;
  else records.unshift(participant);
  localStorage.setItem(KEY, JSON.stringify(records));
}
