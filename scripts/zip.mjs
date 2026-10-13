import fs from 'fs/promises'
import { fileURLToPath } from 'url'
import archiver from 'archiver'
import { url, log, newVersion } from './utils.mjs'

const entryDir = url('../extension/')
const outputDir = url('../dist/')
const extName = `agent-workspace-reader-${newVersion}.zip`

try {
  await fs.access(entryDir)
  await fs.access(outputDir).catch(() => fs.mkdir(outputDir))

  const fh = await fs.open(url(extName, outputDir), 'w+')
  const output = fh.createWriteStream()

  const archive = archiver('zip', {
    zlib: { level: 9 },
  })

  archive.on('error', log.red)
  output.on('close', () =>
    log.green(
      `📦[output]: ${outputDir + extName} [${archive.pointer()} bytes]`,
    ),
  )

  archive.pipe(output)
  archive.directory(fileURLToPath(entryDir), false)
  // The shortcut script, next to the extension's files it takes its icon from
  archive.file(fileURLToPath(url('make-shortcut.ps1')), {
    name: 'make-shortcut.ps1',
  })
  archive.finalize()
} catch (err) {
  log.red(err)
  process.exit(1)
}
