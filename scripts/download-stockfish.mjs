#!/usr/bin/env node
/**
 * Download the pinned official Stockfish release into vendor/stockfish/.
 * Does not commit the binary. See NOTICE and src/engine-pin.ts.
 */
import { createWriteStream } from "node:fs"
import {
  chmod,
  copyFile,
  mkdir,
  mkdtemp,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { pipeline } from "node:stream/promises"
import { fileURLToPath } from "node:url"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const VENDOR = join(ROOT, "vendor", "stockfish")

const PIN = {
  releaseTag: "sf_19",
  downloadBaseUrl:
    "https://github.com/official-stockfish/Stockfish/releases/download/sf_19",
  copyingUrl:
    "https://raw.githubusercontent.com/official-stockfish/Stockfish/sf_19/Copying.txt",
  sourceUrl: "https://github.com/official-stockfish/Stockfish/tree/sf_19",
  defaultNnueFile: "nn-1a298aa575a0.nnue",
}

const ASSETS = {
  "linux-x86-64": "stockfish-linux-x86-64-universal.tar.gz",
  "linux-arm64": "stockfish-linux-arm64-universal.tar.gz",
  "macos-universal": "stockfish-macos-universal.tar.gz",
  "windows-x86-64": "stockfish-windows-x86-64-universal.zip",
  "windows-arm64": "stockfish-windows-arm64-universal.zip",
}

const detectPlatform = () => {
  const { platform, arch } = process
  if (platform === "linux" && arch === "x64") return "linux-x86-64"
  if (platform === "linux" && (arch === "arm64" || arch === "aarch64")) {
    return "linux-arm64"
  }
  if (platform === "darwin") return "macos-universal"
  if (platform === "win32" && arch === "x64") return "windows-x86-64"
  if (platform === "win32" && arch === "arm64") return "windows-arm64"
  throw new Error(`Unsupported host for Stockfish download: ${platform}/${arch}`)
}

const binaryName = (platform) =>
  platform.startsWith("windows") ? "stockfish.exe" : "stockfish"

const fetchToFile = async (url, destPath) => {
  const response = await fetch(url, {
    headers: { "User-Agent": "AxiomChess-analyzer-engine-download" },
    redirect: "follow",
  })
  if (!response.ok || !response.body) {
    throw new Error(`Download failed (${response.status}): ${url}`)
  }
  await pipeline(response.body, createWriteStream(destPath))
}

const findBinary = async (dir, name) => {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      const nested = await findBinary(full, name)
      if (nested) return nested
      continue
    }
    if (entry.isFile() && entry.name === name) return full
  }
  return null
}

const extractArchive = async (archivePath, destDir, platform) => {
  if (platform.startsWith("windows")) {
    if (process.platform === "win32") {
      const ps = `Expand-Archive -LiteralPath '${archivePath.replaceAll("'", "''")}' -DestinationPath '${destDir.replaceAll("'", "''")}' -Force`
      await execFileAsync("powershell.exe", ["-NoProfile", "-Command", ps])
      return
    }
    await execFileAsync("unzip", ["-o", archivePath, "-d", destDir])
    return
  }

  await execFileAsync("tar", ["-xzf", archivePath, "-C", destDir])
}

const main = async () => {
  const platform = detectPlatform()
  const asset = ASSETS[platform]
  const url = `${PIN.downloadBaseUrl}/${asset}`
  const outBinary = binaryName(platform)

  await mkdir(VENDOR, { recursive: true })
  const work = await mkdtemp(join(tmpdir(), "axiomchess-sf-"))

  try {
    const archivePath = join(work, asset)
    process.stdout.write(`Fetching ${url}\n`)
    await fetchToFile(url, archivePath)
    await extractArchive(archivePath, work, platform)

    const found = await findBinary(work, outBinary)
    if (!found) {
      throw new Error(`Extracted archive did not contain ${outBinary}`)
    }

    const destBinary = join(VENDOR, outBinary)
    await copyFile(found, destBinary)
    if (!platform.startsWith("windows")) {
      await chmod(destBinary, 0o755)
    }

    process.stdout.write(`Fetching ${PIN.copyingUrl}\n`)
    const copyingRes = await fetch(PIN.copyingUrl, {
      headers: { "User-Agent": "AxiomChess-analyzer-engine-download" },
    })
    if (!copyingRes.ok) {
      throw new Error(`Failed to fetch Copying.txt (${copyingRes.status})`)
    }
    await writeFile(join(VENDOR, "Copying.txt"), await copyingRes.text(), "utf8")

    await writeFile(
      join(VENDOR, "pin.json"),
      `${JSON.stringify(
        {
          ...PIN,
          platform,
          asset,
          binary: outBinary,
          downloadedAt: new Date().toISOString(),
        },
        null,
        2,
      )}\n`,
      "utf8",
    )

    process.stdout.write(
      `Stockfish ${PIN.releaseTag} installed at ${destBinary}\n`,
    )
    process.stdout.write(
      `Default NNUE (bundled upstream): ${PIN.defaultNnueFile}\n`,
    )
    process.stdout.write(`Source pointer: ${PIN.sourceUrl}\n`)
  } finally {
    await rm(work, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
