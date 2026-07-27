import { describe, expect, it } from "vitest";
import {
  joinFrontmatter,
  readSongSource,
  splitFrontmatter,
  updateFrontmatterField,
} from "../frontmatter";

describe("readSongSource", () => {
  it("parses CRLF files and strips quotes", () => {
    const parsed = readSongSource(
      '---\r\ntitle: "Test Song"\r\ncapo: 0\r\n---\r\n[C]Hello',
    );
    expect(parsed).toEqual({
      metadata: { title: "Test Song", capo: "0" },
      body: "[C]Hello",
    });
  });

  it("returns null when there is no frontmatter block", () => {
    expect(readSongSource("just some lyrics")).toBeNull();
  });
});

describe("splitFrontmatter / joinFrontmatter", () => {
  it("round trips a document unchanged", () => {
    const source = "---\ntitle: Test\ncustom: keep me\n---\n[C]Hello\n";
    const parts = splitFrontmatter(source);
    if (!parts) throw new Error("expected frontmatter");
    expect(joinFrontmatter(parts.block, parts.body)).toBe(source);
  });
});

describe("updateFrontmatterField", () => {
  const source = "---\ntitle: Test\ncustom: keep me\n---\n[C]Hello\n";

  it("adds or updates a field without disturbing unknown fields", () => {
    const updated = updateFrontmatterField(source, "tempo", "128");
    expect(updated).toContain("custom: keep me");
    expect(updated).toContain("tempo: 128");
  });

  it("removes a field when set to an empty value", () => {
    const withTempo = updateFrontmatterField(source, "tempo", "128");
    expect(updateFrontmatterField(withTempo, "tempo", "")).not.toContain(
      "tempo:",
    );
  });

  it("never touches the body", () => {
    const updated = updateFrontmatterField(source, "key", "G");
    expect(updated.endsWith("[C]Hello\n")).toBe(true);
  });
});
