import { describe, expect, it } from "vitest";
import {
  authorizeUrl,
  harvestAccountIds,
  makeState,
  modeFromState,
  popupResult,
  readParams,
  sessionFrom,
} from "./harvestAuth";

// Fictional values only (public repo).
const STATE = makeState("teams", "nonce-1");

describe("readParams", () => {
  it("reads the fragment", () => {
    const p = readParams("https://x.test/h.html#access_token=abc&state=s1");
    expect(p.get("access_token")).toBe("abc");
    expect(p.get("state")).toBe("s1");
  });
  it("reads the query", () => {
    const p = readParams("https://x.test/h.html?access_token=abc&state=s1");
    expect(p.get("access_token")).toBe("abc");
  });
});

describe("harvestAccountIds", () => {
  it.each([
    ["harvest:111 forecast:222", ["111"]],
    ["harvest:111 harvest:333", ["111", "333"]],
    ["harvest:all", []],
    ["all", []],
    ["", []],
  ] as const)("%s", (scope, expected) => {
    expect(harvestAccountIds(scope)).toEqual(expected);
  });
});

describe("state", () => {
  it("carries the popup mode", () => {
    expect(modeFromState(makeState("teams", "n"))).toBe("teams");
    expect(modeFromState(makeState("browser", "n"))).toBe("browser");
    expect(modeFromState("")).toBe("browser");
  });
});

describe("authorizeUrl", () => {
  it("uses the client-side flow", () => {
    const u = new URL(authorizeUrl("cid", STATE, "https://x.test/harvest-auth.html"));
    expect(u.origin + u.pathname).toBe("https://id.getharvest.com/oauth2/authorize");
    expect(u.searchParams.get("response_type")).toBe("token");
    expect(u.searchParams.get("client_id")).toBe("cid");
    expect(u.searchParams.get("state")).toBe(STATE);
    expect(u.searchParams.get("redirect_uri")).toBe("https://x.test/harvest-auth.html");
  });
});

describe("popupResult and sessionFrom", () => {
  const ok = new URLSearchParams({
    access_token: "tok",
    token_type: "bearer",
    expires_in: "3600",
    scope: "harvest:111",
    state: STATE,
  });

  it("builds a session", () => {
    const s = sessionFrom(popupResult(ok), STATE, 1000);
    expect(s).toEqual({ accessToken: "tok", accountId: "111", accountIds: ["111"], expiresAt: 3_601_000 });
  });

  it("refuses a state that does not match", () => {
    expect(() => sessionFrom(popupResult(ok), makeState("teams", "other"), 0)).toThrow(/state/);
  });

  it("passes Harvest's error through", () => {
    const err = new URLSearchParams({ error: "access_denied", error_description: "User denied", state: STATE });
    expect(() => sessionFrom(popupResult(err), STATE, 0)).toThrow("access_denied: User denied");
  });

  it("reports a missing token", () => {
    expect(() => sessionFrom(popupResult(new URLSearchParams({ state: STATE })), STATE, 0)).toThrow(
      "no_access_token",
    );
  });

  it("reports a scope without an account ID", () => {
    const all = new URLSearchParams(ok);
    all.set("scope", "harvest:all");
    expect(() => sessionFrom(popupResult(all), STATE, 0)).toThrow(/no account ID/);
  });
});
