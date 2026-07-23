const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const readline = require("readline");

async function inspectSample() {
  const file = path.join(__dirname, "LeetCodeDataset", "data", "LeetCodeDataset-v0.3.1-train.jsonl.gz");
  const stream = fs.createReadStream(file).pipe(zlib.createGunzip());
  const rl = readline.createInterface({ input: stream });

  for await (const line of rl) {
    if (!line.trim()) continue;
    const data = JSON.parse(line);
    if (data.task_id === "valid-palindrome" || data.task_id === "reverse-string") {
      console.log("==========================================");
      console.log("Task ID:", data.task_id);
      console.log("Title:", data.task_id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
      console.log("Difficulty:", data.difficulty);
      console.log("Tags:", data.tags);
      console.log("Entry Point:", data.entry_point);
      console.log("Starter Code:\n", data.starter_code);
      console.log("Description Snippet:\n", (data.problem_description || "").slice(0, 300));
      console.log("Input Output:", JSON.stringify(data.input_output, null, 2));
    }
  }
}

inspectSample().catch(console.error);
