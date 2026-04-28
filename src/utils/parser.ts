export interface RawQuestion {
  text: string;
  options: { id: string; label: string; text: string }[];
  answerRaw: string;
  explanation: string;
}

export function parsePlainText(text: string): RawQuestion[] {
  const lines = text.replace(/\r/g, "").split("\n");
  const questions: RawQuestion[] = [];
  let current: any = null;
  let currentOption: any = null;
  let inExplanation = false;

  const pushOption = () => {
    if (!current || !currentOption) return;
    current.options.push(currentOption);
    currentOption = null;
  };

  const pushQuestion = () => {
    if (!current) return;
    pushOption();
    if (current.text.trim()) {
      questions.push({
        text: current.text.trim(),
        options: current.options,
        answerRaw: current.answerRaw.trim(),
        explanation: current.explanation.trim()
      });
    }
    current = null;
    inExplanation = false;
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    // Q1. or Question 1: or 1)
    const qMatch = line.match(/^(?:Q|Question)?\s*\d+\s*[:.)-]\s*(.*)$/i);
    // Answer: A or Correct: B or Ans: C
    const answerMatch = line.match(/^(?:Answer|Correct|Ans|Correct Answer)\s*[:]\s*(.+)$/i);
    const explanationMatch = line.match(/^Explanation\s*[:]\s*(.*)$/i);
    // A. Option text or (B) Option text
    const optionMatch = line.match(/^\(?([A-Z0-9])\)?\s*[\).:-]\s*(.+)$/i);

    if (qMatch) {
      pushQuestion();
      current = { text: qMatch[1] || "", options: [], answerRaw: "", explanation: "" };
      inExplanation = false;
      return;
    }

    if (!current) {
      // Fallback: if line starts with text and no current question, maybe it's the first question without Q1
      if (line && !optionMatch && !answerMatch) {
        current = { text: line, options: [], answerRaw: "", explanation: "" };
      }
      return;
    }

    if (answerMatch) {
      pushOption();
      current.answerRaw = current.answerRaw ? `${current.answerRaw}, ${answerMatch[1]}` : answerMatch[1];
      inExplanation = false;
      return;
    }

    if (explanationMatch) {
      pushOption();
      current.explanation = explanationMatch[1] || "";
      inExplanation = true;
      return;
    }

    if (optionMatch && !inExplanation) {
      pushOption();
      const label = optionMatch[1].toUpperCase();
      currentOption = { id: label, label, text: optionMatch[2] || "" };
      return;
    }

    if (!line) {
      if (currentOption) currentOption.text += "\n";
      else if (inExplanation) current.explanation += "\n";
      return;
    }

    if (currentOption) {
      currentOption.text += `${currentOption.text ? "\n" : ""}${rawLine.trimEnd()}`;
    } else if (inExplanation) {
      current.explanation += `${current.explanation ? " " : ""}${line}`;
    } else {
      current.text += `${current.text ? " " : ""}${line}`;
    }
  });

  pushQuestion();
  return questions;
}
