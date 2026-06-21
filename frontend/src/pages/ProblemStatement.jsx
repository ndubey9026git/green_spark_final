// src/pages/ProblemStatement.jsx
import React, { useMemo, useRef, useState } from "react";

/**
 * ProblemStatement.jsx
 * - Renders the full brief you shared (Govt. of Punjab – Dept. of Higher Education).
 * - Collapsible sections, copy/share/print/download actions, and optional challenge seeding helper.
 * - No external dependencies; consistent inline styling similar to your Dashboard.
 */

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

const downloadAs = (filename, content, type = "text/markdown") => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const Section = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={sx.section}>
      <button
        style={sx.sectionHeader}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span style={sx.sectionChevron}>{open ? "▾" : "▸"}</span>
        <span>{title}</span>
      </button>
      {open && <div style={sx.sectionBody}>{children}</div>}
    </div>
  );
};

const mdFromBrief = (brief) => {
  const {
    id,
    title,
    description,
    impact,
    outcomes,
    stakeholders,
    data,
    org,
    dept,
    category,
    theme,
  } = brief;

  return `# ${title}

**Problem Statement ID:** ${id}  
**Organization:** ${org}  
**Department:** ${dept}  
**Category:** ${category}  
**Theme:** ${theme}

---

## Problem Description
${description}

## Impact
${impact}

## Expected Outcomes
${outcomes.map((o) => `- ${o}`).join("\n")}

## Relevant Stakeholders / Beneficiaries
${stakeholders.map((s) => `- ${s}`).join("\n")}

## Supporting Data
${data.map((d) => `- ${d}`).join("\n")}

---
*This document was generated for integration into the GreenSpark platform.*`;
};

// Optional helper: seed curriculum-aligned challenges for your platform.
// Hook this into your backend /admin seeding flow later if you like.
const createChallengeSeeds = () => {
  const today = new Date().toISOString().slice(0, 10);
  return [
    {
      id: 101,
      title: "Tree-Planting Drive",
      points: 25,
      tags: ["community", "biodiversity"],
      dueBy: today,
      rubric: "Plant ≥ 1 tree; upload geo-tagged photo; mention species.",
      sdg: ["SDG 13", "SDG 15"],
      verification: "teacher_approval + photo",
    },
    {
      id: 102,
      title: "Waste Segregation Audit",
      points: 20,
      tags: ["waste", "audit"],
      dueBy: today,
      rubric:
        "Conduct a class-level dry/wet waste audit; submit 1-page findings.",
      sdg: ["SDG 11", "SDG 12"],
      verification: "pdf_report",
    },
    {
      id: 103,
      title: "Public Transport Week",
      points: 15,
      tags: ["mobility", "habits"],
      dueBy: today,
      rubric:
        "Use bus/metro/carpool ≥ 3 days in a week; upload trip log or pass.",
      sdg: ["SDG 11", "SDG 13"],
      verification: "self_log + teacher_check",
    },
    {
      id: 104,
      title: "Home Energy Optimization",
      points: 20,
      tags: ["energy", "habits"],
      dueBy: today,
      rubric:
        "Replace 3 bulbs with LEDs OR track 7-day switch-off routine; submit photo/log.",
      sdg: ["SDG 7", "SDG 13"],
      verification: "photo + log",
    },
    {
      id: 105,
      title: "Campus Clean-up",
      points: 25,
      tags: ["community", "cleanliness"],
      dueBy: today,
      rubric:
        "Organize a 30-min clean-up; 1 group photo; submit waste weight estimate.",
      sdg: ["SDG 11", "SDG 12"],
      verification: "photo + teacher_approval",
    },
  ];
};

const ProblemStatement = () => {
  const printableRef = useRef(null);

  // Your full brief, normalized once.
  const brief = useMemo(
    () => ({
      id: "25009",
      title:
        "Gamified Environmental Education Platform for Schools and Colleges",
      description:
        "Despite the rising urgency of climate change and environmental degradation, environmental education remains largely theoretical in many Indian schools and colleges. Students are often taught textbook-based content with little emphasis on real-world application, local ecological issues, or personal responsibility.\n\nThere is a lack of engaging tools that motivate students to adopt eco-friendly practices or understand the direct consequences of their lifestyle choices. Traditional methods fail to instill sustainable habits or inspire youth participation in local environmental efforts.",
      impact:
        "As future decision-makers, students must be environmentally literate and empowered to take meaningful actions. Without innovative education methods, we risk raising a generation unaware of sustainability challenges.\n\nAn interactive, practical approach to environmental learning will foster long-term behavioral change, local involvement, and a ripple effect across families and communities. This aligns with India's SDG goals and NEP 2020's emphasis on experiential learning.",
      outcomes: [
        "A gamified mobile/web platform or app that teaches students about environmental issues through interactive lessons, challenges, quizzes, and real-world tasks (e.g., tree-planting, waste segregation).",
        "Tracking of eco-points, enabling school-level competitions.",
        "Rewards for sustainable practices through digital badges and recognition.",
      ],
      stakeholders: [
        "School and college students",
        "Teachers and eco-club coordinators",
        "Environmental NGOs and government departments",
      ],
      data: [
        "UNESCO reports that experiential, gamified learning increases student retention and engagement by over 70%.",
        "NEP 2020 encourages integration of environmental awareness into the curriculum.",
      ],
      org: "Government of Punjab",
      dept: "Department of Higher Education",
      category: "Software",
      theme: "Smart Education",
    }),
    []
  );

  const [toast, setToast] = useState(null);
  const [seedPreview, setSeedPreview] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1600);
  };

  const md = useMemo(() => mdFromBrief(brief), [brief]);

  const onCopyAll = async () => {
    const ok = await copyToClipboard(md);
    showToast(ok ? "Copied!" : "Copy failed");
  };

  const onDownload = () => {
    downloadAs("GreenSpark_ProblemStatement_25009.md", md);
    showToast("Downloading…");
  };

  const onPrint = () => {
    // Open print for only the printable area via a new window for safety
    const html = printableRef.current?.innerHTML || "";
    const w = window.open("", "_blank", "width=1024,height=768");
    if (!w) return;
    w.document.write(`
      <html>
        <head>
          <title>${brief.title}</title>
          <style>
            body{ font-family: Inter, system-ui, Arial, sans-serif; padding: 24px; color: #173e31; }
            h1,h2,h3{ color:#245b47; }
            .meta { color:#275a49; font-size: 14px; margin: 6px 0 16px; }
            .card { border:1px solid #cfeee0; border-radius:12px; padding:18px; margin-bottom:14px; background:#fff; }
            ul { margin-top: 8px; }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `);
    w.document.close();
    w.focus();
    w.print();
  };

  const onShare = async () => {
    const shareData = {
      title: brief.title,
      text:
        "Problem Statement 25009 – Gamified Environmental Education Platform (GreenSpark).",
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        showToast("Shared");
      } else {
        await copyToClipboard(`${shareData.title}\n\n${md}`);
        showToast("Copied for sharing");
      }
    } catch {
      /* ignore */
    }
  };

  const makeSeeds = () => {
    const seeds = createChallengeSeeds();
    setSeedPreview(seeds);
    showToast("Seeds generated (preview below)");
    // Later: POST to /api/admin/challenges/seed or similar.
  };

  return (
    <div style={sx.app}>
      {/* Header */}
      <header style={sx.header}>
        <div style={sx.brand}>
          <span style={sx.logo}>🌿</span>
          <h1 style={sx.brandTitle}>GreenSpark – Problem Statement</h1>
        </div>
        <div style={sx.actions}>
          <button style={sx.btnGhost} onClick={onShare}>🔗 Share</button>
          <button style={sx.btnGhost} onClick={onCopyAll}>📋 Copy</button>
          <button style={sx.btnGhost} onClick={onDownload}>⬇️ Download</button>
          <button style={sx.btnPrimary} onClick={onPrint}>🖨️ Print</button>
        </div>
      </header>

      {/* Meta */}
      <div style={sx.metaGrid}>
        <div style={sx.metaCard}>
          <div style={sx.metaLabel}>Problem Statement ID</div>
          <div style={sx.metaValue}>{brief.id}</div>
        </div>
        <div style={sx.metaCard}>
          <div style={sx.metaLabel}>Organization</div>
          <div style={sx.metaValue}>{brief.org}</div>
        </div>
        <div style={sx.metaCard}>
          <div style={sx.metaLabel}>Department</div>
          <div style={sx.metaValue}>{brief.dept}</div>
        </div>
        <div style={sx.metaCard}>
          <div style={sx.metaLabel}>Category</div>
          <div style={sx.metaValue}>{brief.category}</div>
        </div>
        <div style={sx.metaCard}>
          <div style={sx.metaLabel}>Theme</div>
          <div style={sx.metaValue}>{brief.theme}</div>
        </div>
      </div>

      {/* Printable area */}
      <div ref={printableRef}>
        {/* Title card */}
        <section style={sx.hero}>
          <h2 style={{ margin: "0 0 6px 0" }}>{brief.title}</h2>
          <div style={sx.tagRow}>
            <span style={sx.tag}>NEP 2020</span>
            <span style={sx.tag}>SDG-aligned</span>
            <span style={sx.tag}>Gamified Learning</span>
            <span style={sx.tag}>Schools & Colleges</span>
          </div>
        </section>

        {/* Sections */}
        <Section title="Problem Description" defaultOpen>
          <p style={sx.p}>
            {brief.description.split("\n").map((line, i) => (
              <span key={i}>
                {line}
                <br />
              </span>
            ))}
          </p>
        </Section>

        <Section title="Impact" defaultOpen>
          <p style={sx.p}>
            {brief.impact.split("\n").map((line, i) => (
              <span key={i}>
                {line}
                <br />
              </span>
            ))}
          </p>
        </Section>

        <Section title="Expected Outcomes" defaultOpen>
          <ul style={sx.ul}>
            {brief.outcomes.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </Section>

        <Section title="Relevant Stakeholders / Beneficiaries" defaultOpen>
          <ul style={sx.ul}>
            {brief.stakeholders.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </Section>

        <Section title="Supporting Data" defaultOpen>
          <ul style={sx.ul}>
            {brief.data.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </Section>
      </div>

      {/* Seeds & Integration helper */}
      <section style={sx.helperCard}>
        <div style={sx.helperHeader}>
          <h3 style={{ margin: 0, color: "#245b47" }}>
            Integration Helpers (Optional)
          </h3>
          <button style={sx.btnGhost} onClick={makeSeeds}>
            🌱 Create Challenge Seeds
          </button>
        </div>
        <p style={sx.helperP}>
          Use these to bootstrap your backend. Wire this to an admin route like{" "}
          <code style={sx.code}>POST /api/admin/challenges/seed</code> to insert
          starter tasks aligned to this brief (NEP 2020 / SDGs).
        </p>

        {seedPreview && (
          <div style={sx.seedWrap}>
            {seedPreview.map((c) => (
              <div key={c.id} style={sx.seedItem}>
                <div style={sx.seedTitle}>
                  #{c.id} — {c.title}
                </div>
                <div style={sx.seedMeta}>
                  <span>Points: {c.points}</span>
                  <span>Tags: {c.tags.join(", ")}</span>
                  <span>Due: {c.dueBy}</span>
                </div>
                <div style={sx.seedRubric}>Rubric: {c.rubric}</div>
                <div style={sx.seedMeta}>
                  <span>SDG: {c.sdg.join(", ")}</span>
                  <span>Verification: {c.verification}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Toast */}
      {toast && <div style={sx.toast}>{toast}</div>}
    </div>
  );
};

export default ProblemStatement;

/* ---------------------------------- Styles --------------------------------- */
const sx = {
  app: {
    fontFamily: "Inter, system-ui, Arial, sans-serif",
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f2fff6 0%, #e6f9ec 45%, #f8fff8 100%)",
    color: "#163c2f",
    padding: "28px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 20,
  },
  brand: { display: "flex", alignItems: "center", gap: 12 },
  logo: { fontSize: 28 },
  brandTitle: { margin: 0, fontSize: 24, color: "#245b47" },
  actions: { display: "flex", gap: 8, flexWrap: "wrap" },

  btnGhost: {
    border: "1px solid #b3ddc8",
    background: "rgba(241, 255, 242, 0.95)",
    padding: "10px 14px",
    borderRadius: 14,
    cursor: "pointer",
    color: "#1f4f32",
  },
  btnPrimary: {
    background: "#10714f",
    color: "white",
    border: "none",
    padding: "10px 14px",
    borderRadius: 14,
    cursor: "pointer",
    fontWeight: 700,
    boxShadow: "0 12px 24px rgba(16, 113, 79, 0.18)",
  },

  metaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
    marginBottom: 18,
  },
  metaCard: {
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(101, 183, 138, 0.2)",
    borderRadius: 16,
    padding: 14,
    boxShadow: "0 12px 24px rgba(24, 85, 46, 0.08)",
  },
  metaLabel: { fontSize: 12, color: "#2f6f52" },
  metaValue: { fontWeight: 700, color: "#14553c" },

  hero: {
    background: "rgba(223, 247, 233, 0.95)",
    border: "1px solid rgba(166, 223, 181, 0.45)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    boxShadow: "0 18px 28px rgba(15, 73, 44, 0.08)",
  },
  tagRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  tag: {
    background: "#f1fff8",
    border: "1px solid #cfeee0",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
  },

  section: {
    background: "rgba(255,255,255,0.9)",
    border: "1px solid rgba(166, 223, 181, 0.35)",
    borderRadius: 20,
    marginBottom: 14,
    overflow: "hidden",
    boxShadow: "0 12px 26px rgba(16, 83, 50, 0.05)",
  },
  sectionHeader: {
    width: "100%",
    textAlign: "left",
    background: "rgba(237, 255, 247, 0.96)",
    border: "none",
    borderBottom: "1px solid rgba(207, 238, 224, 0.7)",
    padding: "14px 16px",
    fontWeight: 700,
    color: "#1f5940",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  sectionChevron: { display: "inline-block", width: 16, textAlign: "center" },
  sectionBody: { padding: 14 },
  p: { margin: "6px 0 0 0", lineHeight: 1.6, color: "#1d4537" },
  ul: { margin: "8px 0 0 18px", lineHeight: 1.7 },

  helperCard: {
    background: "rgba(255,255,255,0.96)",
    border: "1px solid rgba(166, 223, 181, 0.35)",
    borderRadius: 18,
    padding: 18,
    marginTop: 18,
    boxShadow: "0 12px 22px rgba(27, 88, 51, 0.06)",
  },
  helperHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 8,
  },
  helperP: { marginTop: 8, color: "#254b3d" },
  code: {
    background: "#f6fffa",
    border: "1px solid #e1f5ea",
    padding: "2px 6px",
    borderRadius: 6,
  },

  seedWrap: { display: "grid", gap: 10, marginTop: 10 },
  seedItem: {
    background: "#f8fffb",
    border: "1px solid #e1f5ea",
    borderRadius: 12,
    padding: 12,
  },
  seedTitle: { fontWeight: 700, color: "#184b38" },
  seedMeta: {
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
    fontSize: 12,
    color: "#3d6e5a",
    marginTop: 4,
  },
  seedRubric: { marginTop: 6, color: "#214a3a" },

  toast: {
    position: "fixed",
    left: "50%",
    bottom: 22,
    transform: "translateX(-50%)",
    background: "#1b4332",
    color: "white",
    padding: "10px 14px",
    borderRadius: 10,
    boxShadow: "0 10px 18px rgba(0,0,0,0.18)",
    zIndex: 60,
  },
};
