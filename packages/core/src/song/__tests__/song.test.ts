import { describe, expect, it } from "vitest";
import { parseSong } from "../song";

describe("parseSong", () => {
  it("parses CRLF files and zero-valued metadata", () => {
    const song = parseSong(
      "---\r\ntitle: Test Song\r\ncapo: 0\r\ntempo: 120\r\n---\r\n[C]Hello",
    );
    expect(song.slug).toBe("test-song");
    expect(song.capo).toBe(0);
    expect(song.tempo).toBe(120);
    expect(song.body).toBe("[C]Hello");
  });

  it("rejects invalid numeric metadata", () => {
    expect(() => parseSong("---\ntitle: Test\ntempo: fast\n---\nHi")).toThrow(
      "Invalid tempo",
    );
  });

  it("derives a slug from the title when none is given", () => {
    const song = parseSong("---\ntitle: My Song!\n---\nHi");
    expect(song.slug).toBe("my-song");
  });
});
