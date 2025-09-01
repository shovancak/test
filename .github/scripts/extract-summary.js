const { Octokit } = require("@octokit/core");
const fs = require("fs");

const prNumber = process.env.GITHUB_REF.split("/")[2];
const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
const token = process.env.GITHUB_TOKEN;

const octokit = new Octokit({ auth: token });

function extractRelevantSections(content) {
  const sections = [];

  // Extract Walkthrough section
  const walkthroughMatch = content.match(
    /## Walkthrough\n\n([\s\S]*?)(?=\n## |$)/
  );
  if (walkthroughMatch) {
    sections.push(`## Walkthrough\n\n${walkthroughMatch[1].trim()}`);
  }

  // Extract Changes section
  const changesMatch = content.match(/## Changes\n\n([\s\S]*?)(?=\n## |$)/);
  if (changesMatch) {
    sections.push(`## Changes\n\n${changesMatch[1].trim()}`);
  }

  // Extract Sequence Diagram(s) section
  const sequenceMatch = content.match(
    /## Sequence Diagram\(s\)\n\n([\s\S]*?)(?=\n## |$)/
  );
  if (sequenceMatch) {
    sections.push(`## Sequence Diagram(s)\n\n${sequenceMatch[1].trim()}`);
  }

  return sections.join("\n\n");
}

async function run() {
  const pr = await octokit.request(
    "GET /repos/{owner}/{repo}/pulls/{pull_number}",
    {
      owner,
      repo,
      pull_number: prNumber,
    }
  );

  const comments = await octokit.request(
    "GET /repos/{owner}/{repo}/issues/{issue_number}/comments",
    {
      owner,
      repo,
      issue_number: prNumber,
    }
  );

  const coderabbitComment = comments.data.find((c) =>
    c.user.login.includes("coderabbit")
  );
  if (!coderabbitComment) {
    console.log("No Coderabbit summary found.");
    return;
  }

  const relevantContent = extractRelevantSections(coderabbitComment.body);
  if (!relevantContent.trim()) {
    console.log("No relevant sections found in Coderabbit comment.");
    return;
  }

  const filePath = `docs/changes/pr-${prNumber}.md`;

  fs.mkdirSync("docs/changes", { recursive: true });
  fs.writeFileSync(
    filePath,
    `# Summary for PR #${prNumber} - ${pr.data.title}\n\n${relevantContent}`
  );
  console.log(`Documentation written to ${filePath}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
