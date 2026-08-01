"use client";

import { Question } from "@/lib/survey";
import { Answers } from "@/lib/types";

type Props = {
  questions: Question[];
  answers: Answers;
  onChange: (id: string, value: string) => void;
};

const labels: Record<string, string> = {
  SD: "Strongly disagree",
  D: "Disagree",
  N: "Neutral / Not sure",
  A: "Agree",
  SA: "Strongly agree",
};

export function BarrierMatrix({ questions, answers, onChange }: Props) {
  const choices = questions[0]?.options ?? [];

  return (
    <article className="barrier-matrix-card">
      <div className="matrix-intro">
        <h2>How much did each factor affect your milk coming in?</h2>
        <p>Choose one response for every statement.</p>
        <div className="matrix-legend" aria-label="Response scale">
          {choices.map((choice) => <span key={choice}><strong>{choice}</strong> {labels[choice]}</span>)}
        </div>
      </div>
      <div className="matrix-scroll" role="region" aria-label="Perceived barriers response grid" tabIndex={0}>
        <table className="barrier-matrix">
          <thead>
            <tr>
              <th scope="col">Statement</th>
              {choices.map((choice) => <th scope="col" key={choice}><abbr title={labels[choice]}>{choice}</abbr></th>)}
            </tr>
          </thead>
          <tbody>
            {questions.map((question) => (
              <tr key={question.id}>
                <th scope="row"><span className="matrix-question-number">{question.number}</span>{question.text}</th>
                {choices.map((choice) => {
                  const checked = answers[question.id] === choice;
                  return (
                    <td key={choice}>
                      <label className={`matrix-choice ${checked ? "selected" : ""}`} title={`${labels[choice]}: ${question.text}`}>
                        <input type="radio" name={question.id} value={choice} checked={checked} onChange={() => onChange(question.id, choice)} />
                        <span className="sr-only">{labels[choice]}</span>
                      </label>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="matrix-mobile-hint">Swipe sideways to see the full response scale.</p>
    </article>
  );
}
