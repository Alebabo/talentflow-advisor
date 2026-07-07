import { useEffect, useMemo, useState } from "react";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import { applications as mockApplications, type Application } from "@/lib/mock-data";

const STORAGE_KEY = "tf.uploadedApplications";
const LAST_UPLOADED_KEY = "tf.lastUploadedApplicationId";
const STORAGE_EVENT = "tf.uploadedApplications.changed";

export type UploadedApplication = Application & {
  sourceFileName: string;
  sourceFileSize: number;
  sourceFileType: string;
};

export const MAX_CV_FILE_SIZE = 5 * 1024 * 1024;

const skillKeywords = [
  "Azure",
  "AWS",
  "GCP",
  "Terraform",
  "Kubernetes",
  "Docker",
  "Java",
  "Spring",
  "TypeScript",
  "JavaScript",
  "React",
  "Node.js",
  "Python",
  "SQL",
  "Power BI",
  "Databricks",
  "dbt",
  "Go",
  "Backstage",
  "DDD",
  "DataOps",
  "Stakeholder Management",
  "Mentoring",
];

function readUploadedApplications(): UploadedApplication[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeUploadedApplications(next: UploadedApplication[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

function prettifyNameFromFile(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  const withoutNoise = withoutExtension
    .replace(/cv|resume|lebenslauf|bewerbung/gi, " ")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!withoutNoise) return "Neue Kandidat:in";

  return withoutNoise
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function extractEmail(text: string) {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
}

function extractYearsExperience(text: string) {
  const normalized = text.replace(/\s+/g, " ");
  const explicitMatch = normalized.match(/(\d{1,2})\s*(?:\+?\s*)?(?:Jahre|J\.|years?)\s+(?:Berufserfahrung|Erfahrung|experience)/i);
  if (explicitMatch?.[1]) return Number(explicitMatch[1]);

  const sinceMatch = normalized.match(/seit\s+(\d{4})/i);
  if (sinceMatch?.[1]) {
    const years = new Date().getFullYear() - Number(sinceMatch[1]);
    return Math.max(0, Math.min(40, years));
  }

  return 0;
}

function extractLocation(text: string) {
  const cities = [
    "Muenchen",
    "Munich",
    "Berlin",
    "Hamburg",
    "Koeln",
    "Cologne",
    "Frankfurt",
    "Stuttgart",
    "Duesseldorf",
    "Remote",
    "Wien",
    "Vienna",
    "Zuerich",
    "Zurich",
  ];
  const normalized = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const match = cities.find((city) => new RegExp(`\\b${city}\\b`, "i").test(normalized));
  return match ?? "Noch zu erfassen";
}

function extractSkills(text: string) {
  const normalized = text.toLowerCase();
  const skills = skillKeywords.filter((skill) => normalized.includes(skill.toLowerCase()));
  return Array.from(new Set(skills)).slice(0, 8);
}

function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function isPlainTextFile(file: File) {
  const fileName = file.name.toLowerCase();
  return file.type.startsWith("text/") || fileName.endsWith(".txt") || fileName.endsWith(".md");
}

async function extractPdfText(file: File) {
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
  GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

  const pdf = await getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (pageText) pages.push(pageText);
  }

  return pages.join("\n");
}

async function extractCvText(file: File) {
  if (isPdfFile(file)) return extractPdfText(file);
  if (isPlainTextFile(file)) return file.text();
  return "";
}

function createShortProfile(file: File, text: string, skills: string[], yearsExperience: number) {
  const firstUsefulLine = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 40 && line.length < 220);

  if (firstUsefulLine) return firstUsefulLine;

  const experience = yearsExperience > 0 ? `${yearsExperience} Jahre Erfahrung` : "Erfahrung noch zu pruefen";
  const skillText = skills.length > 0 ? skills.slice(0, 4).join(", ") : "Skills aus CV hochgeladen";
  return `${experience}. CV-Datei "${file.name}" wurde hochgeladen; Fokus: ${skillText}.`;
}

export async function applicationFromCvFile(file: File): Promise<UploadedApplication> {
  const text = await extractCvText(file).catch(() => "");
  const skills = extractSkills(text);
  const yearsExperience = extractYearsExperience(text);

  return {
    id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: prettifyNameFromFile(file.name),
    email: extractEmail(text) || "email.noch.zu.erfassen@example.com",
    location: extractLocation(text),
    shortProfile: createShortProfile(file, text, skills, yearsExperience),
    skills: skills.length ? skills : ["CV hochgeladen"],
    yearsExperience,
    uploadedAt: new Date().toISOString(),
    sourceFileName: file.name,
    sourceFileSize: file.size,
    sourceFileType: file.type || "application/octet-stream",
  };
}

export function saveUploadedApplications(nextUploads: UploadedApplication[]) {
  writeUploadedApplications(nextUploads);
}

export function saveLastUploadedApplicationId(applicationId: string) {
  localStorage.setItem(LAST_UPLOADED_KEY, applicationId);
}

export function readLastUploadedApplicationId() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(LAST_UPLOADED_KEY) ?? "";
}

export function useApplications() {
  const [uploadedApplications, setUploadedApplications] = useState<UploadedApplication[]>(readUploadedApplications);

  useEffect(() => {
    const sync = () => setUploadedApplications(readUploadedApplications());
    window.addEventListener(STORAGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STORAGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const allApplications = useMemo(
    () => [...uploadedApplications, ...mockApplications],
    [uploadedApplications],
  );

  return {
    applications: allApplications,
    uploadedApplications,
    setUploadedApplications: (next: UploadedApplication[]) => {
      setUploadedApplications(next);
      saveUploadedApplications(next);
    },
  };
}
