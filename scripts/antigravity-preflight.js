const fs = require('fs');
const path = require('path');

const required = [
  ".agents/AGENTS.md",
  ".agents/INTENT.md",
  ".agents/README.md",
  ".agents/rules/00-runtime-and-intent.md",
  ".agents/rules/01-agent-workflow-sop.md",
  ".agents/rules/02-code-quality-and-debt.md",
  ".agents/rules/03-context-and-tools.md",
  ".agents/workflows/5fedu-project.md",
  ".agents/workflows/codex-research.md",
  ".agents/workflows/runtime-sync-audit.md"
];

const missing = [];
required.forEach(file => {
  if (!fs.existsSync(path.resolve(file))) {
    missing.push(file);
  }
});

if (missing.length > 0) {
  const message = "Antigravity hard activation missing: " + missing.join(", ") + ". Do not proceed as PASS until these guard files are restored.";
  console.log(JSON.stringify({
    injectSteps: [
      {
        ephemeralMessage: message
      }
    ]
  }, null, 2));
  process.exit(0);
}

const message = "Antigravity hard activation ready. Read .agents/INTENT.md, .agents/AGENTS.md and .agents/rules/00-runtime-and-intent.md first. Final must include Status: PASS/PARTIAL/BLOCKED. For 5fedu: mapping first; template-first/reference-pool before UI edits; production verify after context/domain gates; include Technical debt check. These guard files are protected runtime context, not cleanup artifacts.";

console.log(JSON.stringify({
  injectSteps: [
    {
      ephemeralMessage: message
    }
  ]
}, null, 2));
