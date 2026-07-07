import { jsPDF } from "jspdf";
import type { Application, GuidePhase, Job, Question, Team } from "@/lib/mock-data";

type ExportInterviewSummaryPdfOptions = {
  application: Application;
  job: Job;
  team: Team;
  summaryText: string;
  questions: Question[];
  openRisks: string[];
  interviewGuide: GuidePhase[];
};

const page = {
  marginX: 13,
  width: 210,
  height: 297,
};

const contentWidth = page.width - page.marginX * 2;

const color = {
  night: [31, 0, 76] as const,
  purple: [133, 75, 255] as const,
  teal: [0, 143, 118] as const,
  green: [31, 122, 31] as const,
  warning: [138, 106, 0] as const,
  glow: [255, 252, 217] as const,
  card: [255, 255, 255] as const,
  muted: [246, 243, 251] as const,
  accent: [239, 230, 255] as const,
  tealSoft: [231, 248, 243] as const,
  greenSoft: [232, 248, 232] as const,
  risk: [255, 248, 223] as const,
  spectralGreen: [100, 225, 0] as const,
  spectralYellow: [253, 230, 0] as const,
  spectralCoral: [255, 190, 170] as const,
  border: [232, 222, 245] as const,
  textMuted: [90, 74, 122] as const,
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function formatDate(date = new Date()) {
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function filenameDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function shortPhase(phase: string) {
  return phase
    .replace("Ankommen & Rahmen setzen", "Intro")
    .replace("Werdegang & Motivation", "Werdegang")
    .replace("Fachliche Tiefe", "Fachl. Tiefe")
    .replace("Zusammenarbeit & Soft Skills", "Soft Skills")
    .replace("Kandidat:innen-Fragen & Abschluss", "Fragen & Abschluss");
}

function durationLabel(duration: string) {
  return duration.replace(" Min", "min");
}

function normalizeBullet(value: string) {
  return value.replace(/^[-–•]\s*/, "").trim();
}

function toBulletLines(text: string) {
  return text.split(/\r?\n/).map(normalizeBullet).filter(Boolean).slice(0, 4);
}

function truncateLines(lines: string[], maxLines: number) {
  if (lines.length <= maxLines) return lines;
  const next = lines.slice(0, maxLines);
  next[maxLines - 1] = `${next[maxLines - 1].replace(/[.\s]+$/, "")}...`;
  return next;
}

export function exportInterviewSummaryPdf({
  application,
  job,
  team,
  summaryText,
  questions,
  openRisks,
  interviewGuide,
}: ExportInterviewSummaryPdfOptions) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const setFill = (rgb: readonly [number, number, number]) =>
    doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  const setDraw = (rgb: readonly [number, number, number]) =>
    doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  const setText = (rgb: readonly [number, number, number]) =>
    doc.setTextColor(rgb[0], rgb[1], rgb[2]);

  const split = (text: string, width: number, size: number) => {
    doc.setFontSize(size);
    return doc.splitTextToSize(text, width);
  };

  const drawSpectralLine = (x: number, y: number, width: number, height = 0.9) => {
    setFill(color.night);
    doc.rect(x, y, width, height, "F");
  };

  const drawCard = (
    x: number,
    y: number,
    width: number,
    height: number,
    fill: readonly [number, number, number] = color.card,
    stroke: readonly [number, number, number] = color.border,
  ) => {
    setFill(fill);
    setDraw(stroke);
    doc.roundedRect(x, y, width, height, 2.2, 2.2, "FD");
  };

  const drawText = (
    text: string,
    x: number,
    y: number,
    options: {
      width: number;
      size: number;
      maxLines?: number;
      style?: "normal" | "bold";
      textColor?: readonly [number, number, number];
      lineGap?: number;
      align?: "left" | "center" | "right";
    },
  ) => {
    const {
      width,
      size,
      maxLines = 99,
      style = "normal",
      textColor = color.night,
      lineGap = 1.15,
      align = "left",
    } = options;
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    setText(textColor);
    const lines = truncateLines(split(text, width, size), maxLines);
    const textX = align === "center" ? x + width / 2 : align === "right" ? x + width : x;
    doc.text(lines, textX, y, { lineHeightFactor: lineGap, align });
    return y + lines.length * size * 0.36 * lineGap;
  };

  const drawFittedText = (
    text: string,
    x: number,
    y: number,
    options: {
      width: number;
      size: number;
      minSize: number;
      maxLines: number;
      style?: "normal" | "bold";
      textColor?: readonly [number, number, number];
      lineGap?: number;
    },
  ) => {
    let size = options.size;
    let lines = split(text, options.width, size);
    while (lines.length > options.maxLines && size > options.minSize) {
      size -= 0.2;
      lines = split(text, options.width, size);
    }
    doc.setFont("helvetica", options.style ?? "normal");
    doc.setFontSize(size);
    setText(options.textColor ?? color.night);
    doc.text(lines, x, y, { lineHeightFactor: options.lineGap ?? 1.05 });
    return { lines, size };
  };

  const drawPill = (
    text: string,
    x: number,
    y: number,
    width: number,
    options: {
      fill?: readonly [number, number, number];
      textColor?: readonly [number, number, number];
      size?: number;
    } = {},
  ) => {
    const { fill = color.accent, textColor = color.purple, size = 5.8 } = options;
    setFill(fill);
    doc.roundedRect(x, y, width, 5.2, 2.6, 2.6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    setText(textColor);
    doc.text(text, x + width / 2, y + 3.55, { align: "center" });
  };

  const sectionTitle = (title: string, x: number, y: number, width: number) => {
    drawSpectralLine(x, y, width, 0.8);
    setText(color.night);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.8);
    doc.text(title, x + 2, y + 8.2);
  };

  const drawHero = () => {
    const y = 8;
    drawCard(page.marginX, y, contentWidth, 26, color.glow);
    drawSpectralLine(page.marginX, y, contentWidth, 1.2);
    drawText("TalentFlow Interview-Steckbrief", page.marginX + 7, y + 9.5, {
      width: 100,
      size: 11.5,
      style: "bold",
    });
    drawText(
      "Vorbereitung fuer ein fokussiertes, evidenzbasiertes Interview",
      page.marginX + 7,
      y + 17,
      { width: 115, size: 7.2, style: "bold" },
    );
    drawText(
      "Kurzfassung fuer Interviewer:innen - Fokus, Fragen, Risiken und Ablauf auf einer Seite",
      page.marginX + 7,
      y + 23,
      { width: 128, size: 5.9, textColor: color.textMuted },
    );
    drawPill(formatDate(), page.marginX + contentWidth - 42, y + 5.5, 34);
    drawPill("AGG-geprueft", page.marginX + contentWidth - 42, y + 14, 34, {
      fill: color.greenSoft,
      textColor: color.green,
      size: 5.3,
    });
  };

  const drawCandidate = () => {
    const y = 39;
    drawCard(page.marginX, y, contentWidth, 38);
    drawText(
      `${application.name} · ${application.yearsExperience} Jahre Erfahrung`,
      page.marginX + 7,
      y + 9.5,
      {
        width: 115,
        size: 10.4,
        style: "bold",
      },
    );
    drawPill(job.title, page.marginX + contentWidth - 58, y + 6, 47);
    const metaY = y + 17;
    const columns = [
      ["Aktuelle Rolle", job.seniority || "Rollenlevel offen"],
      ["Zielteam", team.name],
      ["Setup", `${job.location} · ${application.location}`],
    ];
    columns.forEach(([label, value], index) => {
      const x = page.marginX + 7 + index * 55;
      drawText(label.toUpperCase(), x, metaY, {
        width: 48,
        size: 4.8,
        style: "bold",
        textColor: color.textMuted,
        maxLines: 1,
      });
      drawText(value, x, metaY + 5, { width: 48, size: 5.8, style: "bold", maxLines: 1 });
    });
    drawCard(page.marginX + 7, y + 28, contentWidth - 14, 7, color.muted);
    drawText(
      `CV-Signale: ${application.skills.slice(0, 3).join(", ")} · Stage-1-Hinweis pruefen`,
      page.marginX + 10,
      y + 32.8,
      { width: contentWidth - 20, size: 5.5, textColor: color.textMuted, maxLines: 1 },
    );
  };

  const drawSummary = () => {
    const y = 82;
    sectionTitle("Vor dem Gespraech klaeren", page.marginX, y, contentWidth);
    drawCard(page.marginX, y + 12, 116, 30, color.muted);
    drawText("EMPFEHLUNG", page.marginX + 6, y + 18, {
      width: 35,
      size: 4.9,
      style: "bold",
      textColor: color.textMuted,
    });
    const bullets = toBulletLines(summaryText);
    bullets.forEach((bullet, index) => {
      drawText(`- ${bullet}`, page.marginX + 6, y + 24 + index * 4.6, {
        width: 104,
        size: 5.7,
        style: index === 0 ? "bold" : "normal",
        maxLines: 1,
      });
    });

    const introX = page.marginX + 121;
    drawCard(introX, y + 12, contentWidth - 121, 30);
    drawText("Einstieg", introX + 6, y + 20, { width: 45, size: 6.2, style: "bold" });
    drawText("- Motivation kurz aktivieren", introX + 6, y + 27, {
      width: 55,
      size: 5.5,
      maxLines: 1,
    });
    drawText("- Erste Erwartung an Rolle klaeren", introX + 6, y + 32, {
      width: 55,
      size: 5.5,
      maxLines: 1,
    });
  };

  const drawQuestions = () => {
    const topY = 125;
    sectionTitle("8 Fragen mit klarer Prioritaet", page.marginX, topY, contentWidth);
    const gap = 4;
    const colWidth = (contentWidth - gap) / 2;
    const cardHeight = 24.2;
    const rowGap = 2.1;
    const startY = topY + 12;

    questions.slice(0, 8).forEach((question, index) => {
      const x = page.marginX + (index % 2) * (colWidth + gap);
      const y = startY + Math.floor(index / 2) * (cardHeight + rowGap);
      drawCard(x, y, colWidth, cardHeight);
      setFill(color.accent);
      doc.roundedRect(x + 3, y + 4, 6.8, 6.8, 1.6, 1.6, "F");
      setText(color.purple);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.6);
      doc.text(String(index + 1), x + 6.4, y + 8.6, { align: "center" });
      drawPill(question.scenarioTag || "Signal", x + 13, y + 3.4, 25, {
        fill: color.muted,
        textColor: color.textMuted,
        size: 4.2,
      });
      const fitted = drawFittedText(question.question, x + 13, y + 11.6, {
        width: colWidth - 17,
        size: 5.25,
        minSize: 4.45,
        style: "bold",
        maxLines: 3,
        lineGap: 1.02,
      });
      const metaY = y + 13.7 + fitted.lines.length * fitted.size * 0.36 * 1.02;
      drawText(`- ${question.why}`, x + 13, metaY, {
        width: colWidth - 17,
        size: 4.35,
        textColor: color.textMuted,
        maxLines: 1,
      });
      drawText(`- ${question.reference}`, x + 13, metaY + 3.3, {
        width: colWidth - 17,
        size: 4.1,
        textColor: color.textMuted,
        maxLines: 1,
      });
    });
  };

  const drawRisksAndGuide = () => {
    const y = 221;
    const gap = 7;
    const leftWidth = 87;
    const rightX = page.marginX + leftWidth + gap;
    const rightWidth = contentWidth - leftWidth - gap;

    sectionTitle("Zu verifizieren", page.marginX, y, leftWidth);
    openRisks.slice(0, 3).forEach((risk, index) => {
      const cardY = y + 12 + index * 11.8;
      drawCard(page.marginX, cardY, leftWidth, 9.5, color.risk, [244, 232, 194]);
      drawText("!", page.marginX + 6, cardY + 6, {
        width: 3,
        size: 6,
        style: "bold",
        textColor: color.warning,
        align: "center",
      });
      drawText(`- ${risk}`, page.marginX + 12, cardY + 5.7, {
        width: leftWidth - 17,
        size: 5.1,
        maxLines: 1,
      });
    });

    sectionTitle("Empfohlener Ablauf", rightX, y, rightWidth);
    const flowGap = 2.8;
    const flowWidth = (rightWidth - flowGap) / 2;
    interviewGuide.slice(0, 5).forEach((phase, index) => {
      const full = index === 4;
      const x = rightX + (full ? 0 : (index % 2) * (flowWidth + flowGap));
      const cardY = y + 12 + Math.floor(index / 2) * 15.8;
      const width = full ? rightWidth : flowWidth;
      drawCard(x, cardY, width, 13.5);
      drawPill(
        `${index + 1}. ${shortPhase(phase.phase)} [${durationLabel(phase.duration)}]`,
        x + 3,
        cardY + 2.2,
        width - 6,
        {
          size: full ? 4.4 : 4.2,
        },
      );
      drawText(`- ${phase.goal}`, x + 3, cardY + 10, {
        width: width - 6,
        size: 4.4,
        textColor: color.textMuted,
        maxLines: 1,
        align: "center",
      });
    });
  };

  const addFooter = () => {
    setDraw(color.border);
    doc.line(page.marginX, 286, page.width - page.marginX, 286);
    drawText("TalentFlow - metafinanz", page.marginX, 291, {
      width: 60,
      size: 6,
      textColor: color.textMuted,
    });
    drawText("1/1", page.width - page.marginX - 10, 291, {
      width: 10,
      size: 6,
      textColor: color.textMuted,
      align: "right",
    });
  };

  drawHero();
  drawCandidate();
  drawSummary();
  drawQuestions();
  drawRisksAndGuide();
  addFooter();

  const fileName = `talentflow-interview-kurzfassung-${slugify(application.name)}-${filenameDate()}.pdf`;
  doc.save(fileName);
  return fileName;
}
