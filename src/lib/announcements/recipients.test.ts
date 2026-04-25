import { describe, it, expect } from "vitest";
import {
  parseRecipientsFromFormData,
  buildRecipientRows,
  resolveTargetUserIds,
  summarizeRecipients,
  type RecipientRow,
} from "./recipients";

describe("parseRecipientsFromFormData", () => {
  it("rejects missing audience", () => {
    const fd = new FormData();
    const result = parseRecipientsFromFormData(fd);
    expect(result.ok).toBe(false);
  });

  it("rejects unknown audience", () => {
    const fd = new FormData();
    fd.set("audience", "grade");
    const result = parseRecipientsFromFormData(fd);
    expect(result.ok).toBe(false);
  });

  it("accepts audience=all", () => {
    const fd = new FormData();
    fd.set("audience", "all");
    const result = parseRecipientsFromFormData(fd);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.audience).toBe("all");
      expect(result.value.userIds).toEqual([]);
    }
  });

  it("rejects audience=user with no ids", () => {
    const fd = new FormData();
    fd.set("audience", "user");
    const result = parseRecipientsFromFormData(fd);
    expect(result.ok).toBe(false);
  });

  it("dedupes userIds", () => {
    const fd = new FormData();
    fd.set("audience", "user");
    fd.append("userIds", "p1");
    fd.append("userIds", "p2");
    fd.append("userIds", "p1");
    const result = parseRecipientsFromFormData(fd);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.userIds).toEqual(["p1", "p2"]);
    }
  });
});

describe("buildRecipientRows", () => {
  it("builds a single 'all' row", () => {
    const rows = buildRecipientRows("ann-1", { audience: "all", userIds: [] });
    expect(rows).toEqual([
      {
        announcement_id: "ann-1",
        recipient_type: "all",
        recipient_user_id: null,
      },
    ]);
  });

  it("builds one row per user", () => {
    const rows = buildRecipientRows("ann-1", {
      audience: "user",
      userIds: ["a", "b"],
    });
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ recipient_type: "user", recipient_user_id: "a" });
    expect(rows[1]).toMatchObject({ recipient_type: "user", recipient_user_id: "b" });
  });
});

describe("resolveTargetUserIds", () => {
  it("expands 'all' to every parent id", () => {
    const rows: RecipientRow[] = [{ recipient_type: "all", recipient_user_id: null }];
    const ids = resolveTargetUserIds(rows, ["p1", "p2", "p3"]);
    expect(ids.sort()).toEqual(["p1", "p2", "p3"]);
  });

  it("returns just the listed users for 'user' rows", () => {
    const rows: RecipientRow[] = [
      { recipient_type: "user", recipient_user_id: "p1" },
      { recipient_type: "user", recipient_user_id: "p2" },
    ];
    const ids = resolveTargetUserIds(rows, ["p1", "p2", "p3"]);
    expect(ids.sort()).toEqual(["p1", "p2"]);
  });

  it("dedupes when 'all' and 'user' both present", () => {
    const rows: RecipientRow[] = [
      { recipient_type: "all", recipient_user_id: null },
      { recipient_type: "user", recipient_user_id: "p1" },
    ];
    const ids = resolveTargetUserIds(rows, ["p1", "p2"]);
    expect(ids.sort()).toEqual(["p1", "p2"]);
  });
});

describe("summarizeRecipients", () => {
  it("returns '全員' for 'all'", () => {
    const rows: RecipientRow[] = [{ recipient_type: "all", recipient_user_id: null }];
    expect(summarizeRecipients(rows, new Map())).toBe("全員");
  });

  it("joins names with ・ for up to 2 users", () => {
    const rows: RecipientRow[] = [
      { recipient_type: "user", recipient_user_id: "p1" },
      { recipient_type: "user", recipient_user_id: "p2" },
    ];
    const names = new Map([
      ["p1", "田中花子"],
      ["p2", "山田太郎"],
    ]);
    expect(summarizeRecipients(rows, names)).toBe("田中花子・山田太郎");
  });

  it("uses '他N名' for 3+ users", () => {
    const rows: RecipientRow[] = [
      { recipient_type: "user", recipient_user_id: "p1" },
      { recipient_type: "user", recipient_user_id: "p2" },
      { recipient_type: "user", recipient_user_id: "p3" },
    ];
    const names = new Map([
      ["p1", "田中"],
      ["p2", "山田"],
      ["p3", "佐藤"],
    ]);
    expect(summarizeRecipients(rows, names)).toBe("田中 他2名");
  });
});
