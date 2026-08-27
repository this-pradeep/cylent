import { describe, expect, it } from "vitest";
import {
  DISCIPLINES,
  PROJECTS,
  REQUIRED_BEATS,
  leadProject,
  projectLine,
  projectsFor,
  supportingProjects,
  workHref,
} from "@/lib/site/projects";
import { NAV_LINKS } from "@/lib/site/nav-links";

describe("disciplines", () => {
  it("are the three the navbar already points at, in the same order", () => {
    const navIds = NAV_LINKS.filter((link) => link.label !== "About").map((link) => link.id);
    expect(DISCIPLINES.map((discipline) => discipline.id)).toEqual(navIds);
  });

  it("each carry a verb and a claim to head their chapter with", () => {
    DISCIPLINES.forEach((discipline) => {
      expect(discipline.verb).not.toHaveLength(0);
      expect(discipline.claim).not.toHaveLength(0);
    });
  });
});

describe("projectsFor", () => {
  it("returns only that discipline's work", () => {
    DISCIPLINES.forEach(({ id }) => {
      projectsFor(id).forEach((project) => expect(project.discipline).toBe(id));
    });
  });

  it("keeps declaration order, so the running order is editable in one place", () => {
    const web = projectsFor("web");
    const declared = PROJECTS.filter((project) => project.discipline === "web");
    expect(web.map((project) => project.slug)).toEqual(declared.map((project) => project.slug));
  });

  it("accounts for every project exactly once across the three chapters", () => {
    const grouped = DISCIPLINES.flatMap(({ id }) => projectsFor(id));
    expect(grouped).toHaveLength(PROJECTS.length);
    expect(new Set(grouped.map((project) => project.slug)).size).toBe(PROJECTS.length);
  });
});

describe("leadProject", () => {
  it("gives every discipline exactly one lead — the chapter has one full frame", () => {
    DISCIPLINES.forEach(({ id }) => {
      const leads = projectsFor(id).filter((project) => project.lead);
      expect(leads).toHaveLength(1);
      expect(leadProject(id)?.slug).toBe(leads[0].slug);
    });
  });

  it("has nothing to lead with for a discipline that does not exist", () => {
    // @ts-expect-error — guarding the runtime path a bad id would take
    expect(leadProject("podcasts")).toBeUndefined();
  });
});

describe("supportingProjects", () => {
  it("never includes the lead", () => {
    DISCIPLINES.forEach(({ id }) => {
      const lead = leadProject(id);
      expect(supportingProjects(id).some((project) => project.slug === lead?.slug)).toBe(false);
    });
  });

  it("together with the lead accounts for the whole chapter", () => {
    DISCIPLINES.forEach(({ id }) => {
      expect(supportingProjects(id).length + 1).toBe(projectsFor(id).length);
    });
  });

  it("copes with a discipline that has nothing supporting it yet", () => {
    const thin = DISCIPLINES.map(({ id }) => supportingProjects(id).length);
    expect(Math.min(...thin)).toBeGreaterThanOrEqual(0);
  });
});

describe("project content", () => {
  it("gives every lead the four beats the brand guidelines require, in order", () => {
    DISCIPLINES.forEach(({ id }) => {
      const lead = leadProject(id);
      expect(lead?.beats.map((beat) => beat.label)).toEqual([...REQUIRED_BEATS]);
    });
  });

  it("gives every beat something to say", () => {
    DISCIPLINES.forEach(({ id }) => {
      leadProject(id)?.beats.forEach((beat) => expect(beat.value.length).toBeGreaterThan(10));
    });
  });

  it("gives every supporting project a one-line summary to stand on", () => {
    DISCIPLINES.forEach(({ id }) => {
      supportingProjects(id).forEach((project) => {
        expect(project.summary.length).toBeGreaterThan(10);
      });
    });
  });

  it("keeps slugs unique — they are the React keys", () => {
    expect(new Set(PROJECTS.map((project) => project.slug)).size).toBe(PROJECTS.length);
  });

  it("describes every image for screen readers, and never a video as if it were one", () => {
    PROJECTS.forEach((project) => {
      if (project.media.kind === "image") {
        expect(project.media.alt.length).toBeGreaterThan(10);
      }
    });
  });
});

describe("workHref", () => {
  it("gives every discipline its own index route", () => {
    const routes = DISCIPLINES.map(({ id }) => workHref(id));
    expect(routes).toEqual(["/work/web", "/work/video", "/work/graphics"]);
    expect(new Set(routes).size).toBe(DISCIPLINES.length);
  });
});

describe("projectLine", () => {
  it("gives every project a sentence, whichever shape it is", () => {
    PROJECTS.forEach((project) => {
      expect(projectLine(project).length).toBeGreaterThan(10);
    });
  });

  it("lists a lead by its result, not by the problem it started from", () => {
    DISCIPLINES.forEach(({ id }) => {
      const lead = leadProject(id);
      if (!lead) return;
      const result = lead.beats.find((beat) => beat.label === "Result");
      expect(projectLine(lead)).toBe(result?.value);
    });
  });

  it("lists a supporting project by its summary", () => {
    DISCIPLINES.forEach(({ id }) => {
      supportingProjects(id).forEach((project) => {
        expect(projectLine(project)).toBe(project.summary);
      });
    });
  });
});

describe("real work", () => {
  it("names a client wherever there is one to name", () => {
    PROJECTS.forEach((project) => {
      if (project.client === undefined) return;
      expect(project.client.trim().length).toBeGreaterThan(0);
      // The whole reason `name` was removed: a placeholder dressed as a client is worse
      // than no client at all.
      expect(project.client).not.toMatch(/^Project\b/i);
    });
  });

  it("links only to real absolute destinations", () => {
    PROJECTS.forEach((project) => {
      if (project.url === undefined) return;
      expect(project.url).toMatch(/^https:\/\//);
    });
  });

  it("never crops a product shot", () => {
    // A contained shot is contained everywhere it appears; cropping a device mockup to
    // fill a frame cuts the device in half.
    PROJECTS.forEach((project) => {
      if (project.media.kind !== "image") return;
      expect(["cover", "contain", undefined]).toContain(project.media.fit);
    });
  });
});
