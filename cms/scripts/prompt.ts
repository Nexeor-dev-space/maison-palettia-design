/**
 * Reads a line from the terminal without echoing it — for passwords and the
 * old server secret. Shared by reseal.ts and reset-password.ts.
 *
 * Raw mode on the TTY, characters collected until Enter; Backspace works,
 * Ctrl-C aborts with the usual exit code. When stdin is not a TTY (CI, a
 * pipe) there is nothing to hide from, so stdin is read once and handed out
 * line by line — one line per prompt, so a script with two prompts can be
 * driven by `printf 'a\nb\n' | …`.
 */

let pipedLines: Promise<string[]> | undefined;

function readAllPipedLines(): Promise<string[]> {
  pipedLines ??= new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data.split(/\r?\n/)));
  });
  return pipedLines;
}

export async function readHidden(prompt: string): Promise<string> {
  const { stdin, stdout } = process;
  stdout.write(prompt);

  if (!stdin.isTTY) {
    const lines = await readAllPipedLines();
    const line = lines.shift() ?? "";
    stdout.write("\n");
    return line;
  }

  return new Promise((resolve) => {
    let value = "";
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === "\u0003") {
          stdout.write("\n");
          process.exit(130);
        }
        if (char === "\r" || char === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          stdout.write("\n");
          resolve(value);
          return;
        }
        if (char === "\u007f" || char === "\b") {
          value = value.slice(0, -1);
          continue;
        }
        value += char;
      }
    };
    stdin.on("data", onData);
  });
}
