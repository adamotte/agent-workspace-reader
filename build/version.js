const { execFileSync } = require('child_process')

const pad = n => String(n).padStart(2, '0')

// The extension is versioned after its last commit: the commit's day (UTC)
// and short hash, such as 2026.10.12-4a6cac3. Chrome's `version` only takes
// dotted numbers without leading zeros, so the hash goes in `version_name`.
function formatVersion(date, hash) {
  const day = [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()]
  return {
    version: day.join('.'),
    versionName: `${day[0]}.${pad(day[1])}.${pad(day[2])}-${hash}`,
  }
}

function buildVersion() {
  try {
    const [seconds, hash] = execFileSync(
      'git',
      ['log', '-1', '--format=%ct %H'],
      { cwd: __dirname, encoding: 'utf-8' },
    )
      .trim()
      .split(' ')
    return formatVersion(new Date(seconds * 1000), hash.slice(0, 7))
  } catch {
    return formatVersion(new Date(), 'nogit')
  }
}

module.exports = { formatVersion, buildVersion }
