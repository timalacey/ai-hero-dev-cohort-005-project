import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import type { ReactNode } from "react";
import { LandingHero, type HeroCourse } from "./landing-hero";
import { LandingStats } from "./landing-stats";

function render(node: ReactNode) {
  const html = renderToStaticMarkup(<MemoryRouter>{node}</MemoryRouter>);
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  return { html, hrefs };
}

function course(id: number, overrides: Partial<HeroCourse> = {}): HeroCourse {
  return {
    id,
    title: `Course ${id}`,
    slug: `course-${id}`,
    coverImageUrl: null,
    instructorName: `Instructor ${id}`,
    lessonCount: id * 2,
    ...overrides,
  };
}

describe("LandingHero", () => {
  it("is left-aligned, not centred", () => {
    const { html } = render(<LandingHero courses={[]} isSignedIn={false} />);
    expect(html).toContain("text-left");
    expect(html).not.toContain("text-center");
    expect(html).not.toContain("justify-center gap-4");
  });

  it("offers sign-up beside Browse Courses to a visitor", () => {
    const { hrefs, html } = render(
      <LandingHero courses={[]} isSignedIn={false} />
    );
    expect(hrefs).toEqual(["/courses", "/signup"]);
    expect(html).toContain("Create a free account");
  });

  it("offers the dashboard instead of sign-up to a signed-in user", () => {
    const { hrefs, html } = render(
      <LandingHero courses={[]} isSignedIn={true} />
    );
    expect(hrefs).toEqual(["/courses", "/dashboard"]);
    expect(html).not.toContain("Create a free account");
  });

  it("previews the courses it is given, leading with the first", () => {
    const { hrefs, html } = render(
      <LandingHero
        courses={[course(1), course(2), course(3)]}
        isSignedIn={false}
      />
    );
    expect(hrefs.slice(2)).toEqual([
      "/courses/course-1",
      "/courses/course-2",
      "/courses/course-3",
    ]);
    expect(html).toContain("Start here");
    expect(html).toContain("Instructor 1");
    expect(html).toContain("2 lessons");
    expect(html).not.toContain("Instructor 2");
  });

  it("falls back to 'Instructor' when the lead course has no instructor name", () => {
    const { html } = render(
      <LandingHero
        courses={[course(1, { instructorName: null })]}
        isSignedIn={false}
      />
    );
    expect(html).toContain(">Instructor</span>");
  });

  it("shows no preview when there are no courses", () => {
    const { html } = render(<LandingHero courses={[]} isSignedIn={false} />);
    expect(html).not.toContain("Start here");
  });
});

describe("LandingStats", () => {
  it("shows the counts, left-aligned", () => {
    const { html } = render(
      <LandingStats totalCourses={4} totalCategories={5} />
    );
    expect(html).toContain("text-left");
    expect(html).not.toContain("text-center");
    expect(html).toMatch(/>4<\/p><p[^>]*>Available Courses</);
    expect(html).toMatch(/>5<\/p><p[^>]*>Categories</);
    expect(html).toContain("Learn on your schedule");
  });
});
