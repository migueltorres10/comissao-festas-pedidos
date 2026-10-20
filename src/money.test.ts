import { expect, it } from "vitest";
import { eurosToCents } from "./money";
it("aceita euros com vírgula ou ponto e calcula cêntimos exatos", () => {
  expect(eurosToCents("10")).toBe(1000);
  expect(eurosToCents("6,20")).toBe(620);
  expect(eurosToCents("1.2")).toBe(120);
  expect(eurosToCents("0,00")).toBe(0);
  expect(eurosToCents(" 10,50 ")).toBe(1050);
});
it("rejeita valores negativos, incompletos e decimais extra", () => {
  for (const value of [
    "",
    "-1",
    "1,234",
    "1e3",
    "Infinity",
    "abc",
    "1.2.3",
    "9999999999999999",
  ])
    expect(eurosToCents(value)).toBeNull();
});
