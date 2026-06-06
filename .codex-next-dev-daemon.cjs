const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const root = __dirname;
const outPath = path.join(root, "next-dev.out.log");
const errPath = path.join(root, "next-dev.err.log");
const pidPath = path.join(root, ".next-dev.pid");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");

const out = fs.openSync(outPath, "a");
const err = fs.openSync(errPath, "a");

const child = spawn(process.execPath, [nextBin, "dev", "--hostname", "127.0.0.1"], {
  cwd: path.join(root, "frontend"),
  env: {
    ...process.env,
    FORCE_COLOR: "0",
  },
  stdio: ["pipe", out, err],
  windowsHide: true,
});

fs.writeFileSync(pidPath, `${child.pid}\n`);

function stop() {
  if (!child.killed) {
    child.kill("SIGTERM");
  }
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);

child.on("exit", (code, signal) => {
  fs.appendFileSync(
    errPath,
    `\nNext dev exited with code=${code ?? "null"} signal=${signal ?? "null"}\n`,
  );
  process.exit(code ?? 0);
});

setInterval(() => {
  if (child.stdin.writable) {
    child.stdin.write("\n");
  }
}, 30_000);
