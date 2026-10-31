/**
 * jules.ts
 * tRPC router para o Dashboard de Acompanhamento do Esquadrão Google Jules.
 * Lê os diários em .Jules/*.md, as skills em .agents/skills/ e o histórico Git dos agentes.
 */
import fs from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";

const execFileAsync = promisify(execFile);

export type JulesAgentId = "bolt" | "sentinel" | "palette" | "radar" | "janitor";

export interface JulesAgentMeta {
  id: JulesAgentId;
  name: string;
  emoji: string;
  role: string;
  category: string;
  journalPath: string;
  skillPath: string;
  color: string;
}

export interface JulesJournalEntry {
  id: string;
  agentId: JulesAgentId;
  agentName: string;
  agentEmoji: string;
  category: string;
  date: string;
  title: string;
  vulnerability?: string;
  learning: string;
  action: string;
}

export interface JulesGitCommit {
  hash: string;
  shortHash: string;
  agentId: JulesAgentId;
  agentName: string;
  agentEmoji: string;
  date: string;
  subject: string;
}

export const JULES_AGENTS: JulesAgentMeta[] = [
  {
    id: "bolt",
    name: "Bolt",
    emoji: "⚡",
    role: "Engenheiro de Performance",
    category: "Performance",
    journalPath: ".Jules/bolt.md",
    skillPath: ".agents/skills/jules-bolt/SKILL.md",
    color: "#F59E0B",
  },
  {
    id: "sentinel",
    name: "Sentinel",
    emoji: "🛡️",
    role: "Auditor de Segurança (AppSec)",
    category: "Segurança",
    journalPath: ".Jules/sentinel.md",
    skillPath: ".agents/skills/jules-sentinel/SKILL.md",
    color: "#EF4444",
  },
  {
    id: "palette",
    name: "Palette",
    emoji: "🎨",
    role: "Especialista em UX & Acessibilidade",
    category: "UX & a11y",
    journalPath: ".Jules/palette.md",
    skillPath: ".agents/skills/jules-palette/SKILL.md",
    color: "#8B5CF6",
  },
  {
    id: "radar",
    name: "Radar",
    emoji: "🧪",
    role: "Engenheiro de Testes Automatizados & QA",
    category: "Testes Automatizados",
    journalPath: ".Jules/radar.md",
    skillPath: ".agents/skills/jules-radar/SKILL.md",
    color: "#10B981",
  },
  {
    id: "janitor",
    name: "Janitor",
    emoji: "🧹",
    role: "Guardião de Clean Code & Code Health",
    category: "Clean Code & Health",
    journalPath: ".Jules/janitor.md",
    skillPath: ".agents/skills/jules-janitor/SKILL.md",
    color: "#06B6D4",
  },
];

/**
 * Faz o parse de um arquivo Markdown de diário (.Jules/<agent>.md) em entradas estruturadas.
 */
export function parseJulesJournal(
  markdown: string,
  agent: JulesAgentMeta
): JulesJournalEntry[] {
  if (!markdown || !markdown.trim()) return [];

  const sections = markdown.split(/^##\s+/m).slice(1);
  const entries: JulesJournalEntry[] = [];

  sections.forEach((rawSection, index) => {
    const lines = rawSection.trim().split(/\r?\n/);
    const headerLine = lines[0]?.trim() ?? "";

    // Formato esperado: "YYYY-MM-DD - Título da Melhoria"
    const headerMatch = headerLine.match(/^([^\s-]+(?:-[^\s-]+)*)\s*-\s*(.+)$/);
    const date = headerMatch ? headerMatch[1].trim() : "Data N/D";
    const title = (headerMatch ? headerMatch[2] : headerLine)
      .replace(/^\[|\]$/g, "")
      .trim();

    const body = lines.slice(1).join("\n").trim();

    const vulnMatch = body.match(
      /\*\*Vulnerability:\*\*\s*([\s\S]*?)(?=\n\*\*(?:Learning|Action|Prevention):\*\*|$)/i
    );
    const learningMatch = body.match(
      /\*\*Learning:\*\*\s*([\s\S]*?)(?=\n\*\*(?:Action|Prevention):\*\*|$)/i
    );
    const actionMatch = body.match(
      /\*\*(?:Action|Prevention):\*\*\s*([\s\S]*?)$/i
    );

    entries.push({
      id: `${agent.id}-${index}-${date}`,
      agentId: agent.id,
      agentName: agent.name,
      agentEmoji: agent.emoji,
      category: agent.category,
      date,
      title,
      vulnerability: vulnMatch ? vulnMatch[1].trim() : undefined,
      learning: learningMatch ? learningMatch[1].trim() : body,
      action: actionMatch ? actionMatch[1].trim() : "",
    });
  });

  // Ordenar das mais recentes para as mais antigas
  return entries.reverse();
}

/**
 * Identifica a qual agente pertence um commit ou merge commit do Git.
 */
export function detectAgentFromCommit(subject: string): JulesAgentMeta | null {
  const lower = subject.toLowerCase();
  if (lower.includes("bolt") || subject.includes("⚡")) {
    return JULES_AGENTS[0];
  }
  if (lower.includes("sentinel") || subject.includes("🛡️")) {
    return JULES_AGENTS[1];
  }
  if (lower.includes("palette") || subject.includes("🎨")) {
    return JULES_AGENTS[2];
  }
  if (lower.includes("radar") || subject.includes("🧪")) {
    return JULES_AGENTS[3];
  }
  if (lower.includes("janitor") || subject.includes("🧹")) {
    return JULES_AGENTS[4];
  }
  return null;
}

async function getGitAgentCommits(
  repoRoot: string,
  limit = 60
): Promise<JulesGitCommit[]> {
  try {
    const { stdout } = await execFileAsync(
      "git",
      [
        "log",
        `-n`,
        String(limit * 3),
        "--date=short",
        "--pretty=format:%H|%h|%ad|%s",
      ],
      { cwd: repoRoot }
    );

    const commits: JulesGitCommit[] = [];
    for (const line of stdout.split("\n")) {
      if (!line.trim()) continue;
      const [hash, shortHash, date, ...subjectParts] = line.split("|");
      const subject = subjectParts.join("|").trim();
      const agent = detectAgentFromCommit(subject);
      if (agent) {
        commits.push({
          hash,
          shortHash,
          agentId: agent.id,
          agentName: agent.name,
          agentEmoji: agent.emoji,
          date,
          subject,
        });
        if (commits.length >= limit) break;
      }
    }
    return commits;
  } catch {
    return [];
  }
}

export const julesRouter = router({
  /**
   * Retorna todos os dados consolidados do Dashboard de Agentes:
   * - Metadados e contagens por agente
   * - Entradas dos diários .Jules/*.md
   * - Histórico de commits/PRs no Git
   * - Configuração da automação agendada diária
   */
  getDashboardData: publicProcedure
    .input(
      z
        .object({
          agentFilter: z
            .enum(["all", "bolt", "sentinel", "palette", "radar", "janitor"])
            .default("all"),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const repoRoot = process.cwd();
      const filter = input?.agentFilter ?? "all";

      const agentResults = await Promise.all(
        JULES_AGENTS.map(async agent => {
          const fullPath = path.join(repoRoot, agent.journalPath);
          let content = "";
          try {
            content = await fs.readFile(fullPath, "utf-8");
          } catch {
            content = "";
          }
          const entries = parseJulesJournal(content, agent);

          return {
            ...agent,
            entries,
            entriesCount: entries.length,
            latestEntry: entries[0] ?? null,
          };
        })
      );

      const allEntries: JulesJournalEntry[] = agentResults
        .flatMap(a => a.entries)
        .sort((a, b) => b.date.localeCompare(a.date));

      const agentStats = agentResults.map(({ entries: _entries, ...rest }) => rest);

      const gitCommits = await getGitAgentCommits(repoRoot, 60);

      // Contabilizar commits por agente
      const commitsByAgent: Record<JulesAgentId, number> = {
        bolt: 0,
        sentinel: 0,
        palette: 0,
        radar: 0,
        janitor: 0,
      };
      for (const c of gitCommits) {
        commitsByAgent[c.agentId] = (commitsByAgent[c.agentId] ?? 0) + 1;
      }

      const enrichedAgents = agentStats.map(a => ({
        ...a,
        commitsCount: commitsByAgent[a.id] ?? 0,
      }));

      const filteredEntries =
        filter === "all"
          ? allEntries
          : allEntries.filter(e => e.agentId === filter);

      const filteredCommits =
        filter === "all"
          ? gitCommits
          : gitCommits.filter(c => c.agentId === filter);

      return {
        schedule: {
          sidecarId: "daily-jules-squad",
          displayName: "Daily Jules Code Squad",
          cron: "CRON_TZ=America/Sao_Paulo 0 6 * * *",
          humanReadable: "Diariamente às 06:00 (Horário de Brasília)",
          orchestratorSkill: ".agents/skills/jules-daily-squad/SKILL.md",
        },
        totals: {
          agentsCount: JULES_AGENTS.length,
          journalEntriesCount: allEntries.length,
          gitCommitsCount: gitCommits.length,
        },
        agents: enrichedAgents,
        entries: filteredEntries,
        commits: filteredCommits,
      };
    }),
});
