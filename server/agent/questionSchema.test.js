import { describe, it, expect } from "vitest";
import { validateQuestionShape } from "./questionSchema.js";

const VALID = {
  question: "What does `typeof []` return in JavaScript?",
  options: ["'array'", "'object'", "'list'", "undefined"],
  correctOptionIndex: 1,
  hint: "Arrays are a special kind of this built-in type.",
  explanation: "Arrays are objects in JavaScript, so typeof [] is 'object'.",
};

describe("validateQuestionShape", () => {
  it("accepts a well-formed question and returns only the expected fields", () => {
    const result = validateQuestionShape(VALID);
    expect(result).toEqual(VALID);
  });

  it("rejects a missing question field", () => {
    const { question, ...rest } = VALID;
    expect(() => validateQuestionShape(rest)).toThrow();
  });

  it("rejects options arrays that aren't exactly length 4", () => {
    expect(() =>
      validateQuestionShape({ ...VALID, options: ["a", "b", "c"] })
    ).toThrow();
  });

  it("rejects a correctOptionIndex out of range", () => {
    expect(() =>
      validateQuestionShape({ ...VALID, correctOptionIndex: 4 })
    ).toThrow();
  });

  it("rejects a non-integer correctOptionIndex", () => {
    expect(() =>
      validateQuestionShape({ ...VALID, correctOptionIndex: 1.5 })
    ).toThrow();
  });

  it("rejects a missing hint", () => {
    expect(() => validateQuestionShape({ ...VALID, hint: "" })).toThrow();
  });

  it("rejects a missing explanation", () => {
    expect(() => validateQuestionShape({ ...VALID, explanation: undefined })).toThrow();
  });
});
