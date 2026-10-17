// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import {
  defaultForeignKeyCardHtml,
  extractForeignKeyCardHtmlFromAi,
  fillForeignKeyCardTemplate,
  foreignKeyCardTemplateColumns,
  foreignKeyCardTemplateKey,
  normalizeForeignKeyCardTemplates,
  normalizeForeignKeyCardTrigger,
  renderForeignKeyCardHtml,
  sanitizeForeignKeyCardHtml,
} from "@/lib/dataGrid/foreignKeyCard";

describe("foreign key card templates", () => {
  it("fills placeholders case-insensitively and escapes values", () => {
    const html = fillForeignKeyCardTemplate('<b>{{ Name }}</b><img src="{{avatar}}"><i>{{missing}}</i>', {
      name: "<script>x</script>",
      avatar: 'a.png" onerror="alert(1)',
    });
    expect(html).toBe('<b>&lt;script&gt;x&lt;/script&gt;</b><img src="a.png&quot; onerror=&quot;alert(1)"><i></i>');
  });

  it("renders NULL as empty and objects as JSON", () => {
    expect(fillForeignKeyCardTemplate("[{{a}}][{{b}}]", { a: null, b: 0 })).toBe("[][0]");
  });

  it("lists referenced columns that exist, in order", () => {
    expect(foreignKeyCardTemplateColumns("{{name}} {{AVATAR}} {{name}} {{nope}}", ["id", "avatar", "name"])).toEqual(["name", "avatar"]);
  });

  it("strips executable content but keeps styles", () => {
    const html = sanitizeForeignKeyCardHtml('<style>.a{color:red}</style><div class="a" onclick="x()">ok</div><script>x()</script><a href="javascript:x()">l</a><img src="data:image/png;base64,AAAA"><iframe src="https://e.com"></iframe>');
    expect(html).toContain("<style>.a{color:red}</style>");
    expect(html).toContain('<div class="a">ok</div>');
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("<iframe");
    expect(html).toContain('src="data:image/png;base64,AAAA"');
  });

  it("builds a default card with avatar and title detection", () => {
    const html = defaultForeignKeyCardHtml(["id", "avatar_url", "name", "gender"]);
    expect(html).toContain('src="{{avatar_url}}"');
    expect(html).toContain('<div class="title">{{name}}</div>');
    expect(html).toContain("<dt>gender</dt><dd>{{gender}}</dd>");
    expect(renderForeignKeyCardHtml(html, { id: 1, avatar_url: "a.png", name: "Ann", gender: "F" })).toContain("Ann");
  });

  it("keys templates by referenced table", () => {
    expect(foreignKeyCardTemplateKey({ connectionId: "c", database: "db", schema: "public", table: "users" })).toBe('["c","db","","public","users"]');
  });

  it("normalizes persisted settings", () => {
    expect(normalizeForeignKeyCardTrigger("hover")).toBe("hover");
    expect(normalizeForeignKeyCardTrigger("other")).toBe("click");
    expect(normalizeForeignKeyCardTemplates({ a: { html: "<b/>", updatedAt: 1 }, b: { html: "" }, c: "x" })).toEqual({ a: { html: "<b/>", updatedAt: 1 } });
  });

  it("extracts HTML from fenced AI answers", () => {
    expect(extractForeignKeyCardHtmlFromAi("Here:\n```html\n<div>x</div>\n```")).toBe("<div>x</div>");
    expect(extractForeignKeyCardHtmlFromAi("<div>y</div>")).toBe("<div>y</div>");
  });
});
