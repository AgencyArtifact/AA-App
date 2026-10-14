import { describe, expect, it } from "vitest";
import type { HoursRow } from "../graph/sharepoint";
import {
  DELETE_TARGET_TITLE,
  creatorName,
  hitsInSite,
  isMine,
  ownDeleteTarget,
  pickDeleteTarget,
  pickEditTarget,
} from "./rows";

const me = { id: "me-id", userPrincipalName: "Me@Example.com" };
const mine: HoursRow = { id: "1", title: "my row", createdBy: { id: "me-id", displayName: "Me" } };
const mineByEmail: HoursRow = { id: "2", title: "x", createdBy: { email: "me@example.com" } };
const otherTarget: HoursRow = { id: "3", title: DELETE_TARGET_TITLE, createdBy: { id: "o", displayName: "Other" } };
const other: HoursRow = { id: "4", title: "their row", createdBy: { id: "o", email: "o@example.com" } };
const myTarget: HoursRow = { id: "5", title: DELETE_TARGET_TITLE, createdBy: { id: "me-id" } };
const noCreator: HoursRow = { id: "6", title: "system", createdBy: null };

describe("isMine", () => {
  it("matches by Entra id or by email against UPN, case-insensitive", () => {
    expect(isMine(mine, me)).toBe(true);
    expect(isMine(mineByEmail, me)).toBe(true);
    expect(isMine(other, me)).toBe(false);
    expect(isMine(noCreator, me)).toBe(false);
  });
});

describe("pickEditTarget", () => {
  it("prefers another user's row that is not a delete target", () => {
    expect(pickEditTarget([mine, otherTarget, other], me)?.id).toBe("4");
  });
  it("falls back to a delete target, and skips rows with no creator", () => {
    expect(pickEditTarget([noCreator, mine, otherTarget], me)?.id).toBe("3");
  });
  it("is null when every row is mine", () => {
    expect(pickEditTarget([mine, myTarget], me)).toBeNull();
  });
});

describe("delete targets", () => {
  it("picks only another user's delete target", () => {
    expect(pickDeleteTarget([myTarget, other, otherTarget], me)?.id).toBe("3");
    expect(pickDeleteTarget([myTarget, other], me)).toBeNull();
  });
  it("finds the user's own delete target", () => {
    expect(ownDeleteTarget([otherTarget, myTarget], me)?.id).toBe("5");
    expect(ownDeleteTarget([otherTarget], me)).toBeNull();
  });
});

describe("creatorName", () => {
  it("uses display name, then email, then id", () => {
    expect(creatorName(otherTarget)).toBe("Other");
    expect(creatorName(mineByEmail)).toBe("me@example.com");
    expect(creatorName(myTarget)).toBe("me-id");
    expect(creatorName(noCreator)).toBe("unknown");
  });
});

describe("hitsInSite", () => {
  it("counts hit addresses inside the site path only", () => {
    const urls = [
      "https://t.sharepoint.com/sites/AAPrincipals/Lists/TestFees/DispForm.aspx?ID=1",
      "https://t.sharepoint.com/sites/aaprincipals/Lists/X",
      "https://t.sharepoint.com/sites/AAPrincipalsArchive/Lists/Y",
      "https://t.sharepoint.com/sites/AAOperations/Lists/TestHours",
      undefined,
    ];
    expect(hitsInSite(urls, "/sites/AAPrincipals")).toBe(2);
    expect(hitsInSite([], "/sites/AAPrincipals")).toBe(0);
  });
});
