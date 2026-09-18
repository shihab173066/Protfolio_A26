#!/usr/bin/env node
// Writes the admin credential into shihab-portfolio/.env.local as a PBKDF2-SHA256
// hash + random salt. The plaintext password is never written to disk.
//
//   npm run set-admin-password                  (prompts, input hidden)
//   npm run set-admin-password -- --id a@b      (override the login id)
//
// The derivation here must stay byte-identical to the WebCrypto one in
// src/composables/useAuth.js: SHA-256, same iteration count, 32-byte output.
//
// NOTE ON WHAT THIS PROTECTS. Vite inlines VITE_* vars into the built bundle, so
// the hash below ships publicly in dist/. That is fine and expected — the point is
// that the *plaintext* never leaves your machine, so the password stays private
// even though anyone can read the hash. A browser-only login on a static host is
// always bypassable via devtools; see the comment block in useAuth.js.

import { pbkdf2, randomBytes } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const ENV_PATH = join(ROOT, 'shihab-portfolio', '.env.local')

const ITERATIONS = 310000
const KEY_BYTES = 32
const DIGEST = 'sha256'
const DEFAULT_ID = 'shihab@mysite'

function arg(name) {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null
}

/** Reads a password from stdin without echoing it to the terminal. */
function promptHidden(question) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) {
      reject(new Error('No TTY available. Pass the password with --password instead.'))
      return
    }
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    // Swallow echo while the answer is being typed.
    const onData = () => rl.output.write('\x1b[2K\r' + question)
    process.stdout.write(question)
    rl.input.on('data', onData)
    rl.question('', (answer) => {
      rl.input.off('data', onData)
      rl.close()
      process.stdout.write('\n')
      resolve(answer)
    })
  })
}

function derive(password, salt) {
  return new Promise((resolve, reject) => {
    pbkdf2(password, salt, ITERATIONS, KEY_BYTES, DIGEST, (err, key) =>
      err ? reject(err) : resolve(key),
    )
  })
}

/** Rewrites `key=` in place if present, appends it otherwise. Other lines are untouched. */
function upsert(contents, key, value) {
  const line = `${key}=${value}`
  const re = new RegExp(`^${key}=.*$`, 'm')
  if (re.test(contents)) return contents.replace(re, line)
  return (contents.trimEnd() + '\n' + line).trimStart() + '\n'
}

async function main() {
  const id = arg('id') || DEFAULT_ID
  let password = arg('password')

  if (!password) password = await promptHidden('Admin password: ')
  if (!password) {
    console.error('Aborted: empty password.')
    process.exit(1)
  }
  if (password.length < 12) {
    console.error(`Aborted: password must be at least 12 characters (got ${password.length}).`)
    process.exit(1)
  }

  const salt = randomBytes(16)
  const hash = await derive(password, salt)

  mkdirSync(dirname(ENV_PATH), { recursive: true })
  let contents = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, 'utf8') : ''
  if (!contents.trim()) {
    contents =
      '# Local secrets — gitignored. Regenerate with `npm run set-admin-password`.\n' +
      '# Do NOT commit this file.\n'
  }

  contents = upsert(contents, 'VITE_ADMIN_ID', id)
  contents = upsert(contents, 'VITE_ADMIN_PW_SALT', salt.toString('base64'))
  contents = upsert(contents, 'VITE_ADMIN_PW_HASH', hash.toString('base64'))
  contents = upsert(contents, 'VITE_ADMIN_PW_ITERATIONS', String(ITERATIONS))

  writeFileSync(ENV_PATH, contents, { mode: 0o600 })

  console.log(`Wrote ${ENV_PATH}`)
  console.log(`  VITE_ADMIN_ID=${id}`)
  console.log(`  VITE_ADMIN_PW_SALT / _HASH  (${ITERATIONS} iterations, sha256)`)
  console.log('\nThe plaintext password was not saved. Restart `npm run dev` to pick this up.')
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
