"use client";

import { Question } from "@/lib/survey";
import { Answers } from "@/lib/types";
import { Input } from "./ui/input";

type Props = {
  question: Question;
  answers: Answers;
  onChange: (id: string, value: string | string[]) => void;
};

export function QuestionField({ question, answers, onChange }: Props) {
  if (question.dependsOn && answers[question.dependsOn.id] !== question.dependsOn.value) return null;
  const value = answers[question.id];

  if (question.type === "text" || question.type === "number") {
    return (
      <article className="question-card">
        <QuestionHeading question={question} />
        <Input
          inputMode={question.type === "number" ? "decimal" : "text"}
          type={question.type === "number" ? "number" : "text"}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(question.id, event.target.value)}
          placeholder="Enter response"
        />
      </article>
    );
  }

  const selected = Array.isArray(value) ? value : [];
  const isScale = question.type === "scale";

  return (
    <article className="question-card">
      <QuestionHeading question={question} />
      {isScale && <p className="scale-key">SD · Strongly disagree &nbsp;→&nbsp; SA · Strongly agree</p>}
      <div className={isScale ? "option-grid scale-grid" : "option-grid"}>
        {question.options?.map((option) => {
          const checked = question.type === "multi" ? selected.includes(option) : value === option;
          return (
            <label className={`option ${checked ? "selected" : ""}`} key={option}>
              <input
                type={question.type === "multi" ? "checkbox" : "radio"}
                name={question.id}
                checked={checked}
                onChange={() => {
                  if (question.type === "multi") {
                    onChange(question.id, checked ? selected.filter((item) => item !== option) : [...selected, option]);
                  } else onChange(question.id, option);
                }}
              />
              <span>{option}</span>
            </label>
          );
        })}
      </div>
    </article>
  );
}

function QuestionHeading({ question }: { question: Question }) {
  return (
    <div className="question-heading">
      <span className="question-number">{question.number}</span>
      <div>
        <h3>{question.text}</h3>
        {question.note && <p>{question.note}</p>}
      </div>
    </div>
  );
}
