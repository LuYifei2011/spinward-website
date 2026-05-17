const DEFAULT_OWNER = 'LuYifei2011'
const DEFAULT_REPO = 'spinward-website'
const SIDEBAR_PATH = '.vitepress/sidebar.json'
const EXCLUDED_PREFIXES = [
  '.git/',
  '.vitepress/cache/',
  '.vitepress/dist/',
  'node_modules/',
  'public/',
  'functions/',
]

export async function onRequestGet(context) {
  return handleRequest(context)
}

export async function onRequestPost(context) {
  return handleRequest(context)
}

async function handleRequest({ request, env }) {
  try {
    const action = getAction(request)
    if (request.method === 'GET' && action === 'tree') return json(await getTree(env))
    if (request.method === 'GET' && action === 'file') return json(await getFile(request, env))
    if (request.method === 'GET' && action === 'sidebar') return json(await getSidebar(env))
    if (request.method === 'POST' && action === 'commit') return json(await commitChanges(request, env))
    return json({ ok: false, error: 'Unknown editor API route' }, 404)
  } catch (error) {
    return json({ ok: false, error: error.message || 'Editor API failed', details: error.details }, error.status || 500)
  }
}

function getAction(request) {
  const pathname = new URL(request.url).pathname
  return pathname.replace(/^\/api\/editor\/?/, '').split('/')[0] || ''
}

function getConfig(env) {
  const token = env.GITHUB_PAT
  if (!token) throw httpError(500, 'Missing GITHUB_PAT')
  return {
    token,
    owner: env.GITHUB_OWNER || DEFAULT_OWNER,
    repo: env.GITHUB_REPO || DEFAULT_REPO,
    branch: env.GITHUB_BRANCH || env.CF_PAGES_BRANCH || 'main',
  }
}

async function github(env, path, init = {}) {
  const config = getConfig(env)
  const response = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}${path}`, {
    ...init,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${config.token}`,
      'content-type': 'application/json',
      'user-agent': 'spinward-website-editor',
      'x-github-api-version': '2022-11-28',
      ...(init.headers || {}),
    },
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw httpError(response.status, data?.message || `GitHub API failed: ${response.status}`, data)
  }
  return data
}

async function getBranchHead(env) {
  const { branch } = getConfig(env)
  const ref = await github(env, `/git/ref/${encodeGitPath(`heads/${branch}`)}`)
  const commit = await github(env, `/git/commits/${ref.object.sha}`)
  return { branch, commitSha: ref.object.sha, treeSha: commit.tree.sha }
}

async function getRecursiveTree(env) {
  const head = await getBranchHead(env)
  const tree = await github(env, `/git/trees/${head.treeSha}?recursive=1`)
  return { ...head, tree: Array.isArray(tree.tree) ? tree.tree : [] }
}

async function getTree(env) {
  const { branch, commitSha, tree } = await getRecursiveTree(env)
  const files = tree
    .filter((item) => item.type === 'blob' && isMarkdownPath(item.path))
    .map((item) => ({ path: item.path, type: 'file', sha: item.sha, size: item.size }))

  const dirs = new Map()
  for (const file of files) {
    const parts = file.path.split('/')
    for (let index = 1; index < parts.length; index += 1) {
      const path = parts.slice(0, index).join('/')
      dirs.set(path, { path, type: 'dir' })
    }
  }

  return { ok: true, branch, baseCommitSha: commitSha, items: [...dirs.values(), ...files] }
}

async function getFile(request, env) {
  const path = validateMarkdownPath(new URL(request.url).searchParams.get('path') || '')
  const { tree } = await getRecursiveTree(env)
  const file = tree.find((item) => item.type === 'blob' && item.path === path)
  if (!file) throw httpError(404, 'Markdown file not found')
  const blob = await github(env, `/git/blobs/${file.sha}`)
  return { ok: true, path, sha: file.sha, content: decodeBase64Text(blob.content || '') }
}

async function getSidebar(env) {
  const { tree } = await getRecursiveTree(env)
  const file = tree.find((item) => item.type === 'blob' && item.path === SIDEBAR_PATH)
  if (!file) return { ok: true, path: SIDEBAR_PATH, sidebar: [] }
  const blob = await github(env, `/git/blobs/${file.sha}`)
  const content = decodeBase64Text(blob.content || '')
  return { ok: true, path: SIDEBAR_PATH, sidebar: JSON.parse(content) }
}

async function commitChanges(request, env) {
  const payload = await request.json().catch(() => null)
  if (!payload || typeof payload !== 'object') throw httpError(400, 'Invalid JSON payload')

  const { branch, commitSha, treeSha } = await getBranchHead(env)
  if (payload.baseCommitSha && payload.baseCommitSha !== commitSha) {
    throw httpError(409, 'Remote branch changed. Refresh the editor and retry.', { expected: payload.baseCommitSha, current: commitSha })
  }

  const changes = Array.isArray(payload.changes) ? payload.changes : []
  const treeItems = []
  const seen = new Set()

  for (const change of changes) {
    const path = validateMarkdownPath(change?.path || '')
    if (seen.has(path)) throw httpError(400, `Duplicate change path: ${path}`)
    seen.add(path)
    if (change.content === null) {
      treeItems.push({ path, mode: '100644', type: 'blob', sha: null })
    } else if (typeof change.content === 'string') {
      treeItems.push({ path, mode: '100644', type: 'blob', content: change.content })
    } else {
      throw httpError(400, `Invalid content for ${path}`)
    }
  }

  if (Array.isArray(payload.sidebar)) {
    treeItems.push({
      path: SIDEBAR_PATH,
      mode: '100644',
      type: 'blob',
      content: `${JSON.stringify(normalizeSidebar(payload.sidebar), null, 2)}\n`,
    })
  }

  if (!treeItems.length) throw httpError(400, 'Nothing to commit')

  const author = validateAuthor(payload.author)
  const message = buildCommitMessage(payload.message, author, branch)
  const tree = await github(env, '/git/trees', {
    method: 'POST',
    body: JSON.stringify({ base_tree: treeSha, tree: treeItems }),
  })
  const commit = await github(env, '/git/commits', {
    method: 'POST',
    body: JSON.stringify({
      message,
      tree: tree.sha,
      parents: [commitSha],
      author,
      committer: {
        name: 'Spinward Website Editor',
        email: 'editor@spinward.pages.dev',
      },
    }),
  })
  await github(env, `/git/refs/${encodeGitPath(`heads/${branch}`)}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha, force: false }),
  })

  return { ok: true, branch, commitSha: commit.sha }
}

function validateMarkdownPath(input) {
  const path = normalizePath(input)
  if (!isMarkdownPath(path)) throw httpError(400, 'Only Markdown files can be edited')
  return path
}

function normalizePath(input) {
  if (typeof input !== 'string') throw httpError(400, 'Path must be a string')
  const path = input.trim().replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+/g, '/')
  if (!path || path.includes('..') || path.startsWith('/')) throw httpError(400, 'Invalid path')
  if (EXCLUDED_PREFIXES.some((prefix) => path === prefix.slice(0, -1) || path.startsWith(prefix))) {
    throw httpError(400, 'Path is outside the editable Markdown scope')
  }
  return path
}

function isMarkdownPath(path) {
  if (typeof path !== 'string') return false
  if (!path.endsWith('.md')) return false
  try {
    normalizePath(path)
    return true
  } catch {
    return false
  }
}

function validateAuthor(author) {
  const name = typeof author?.name === 'string' ? author.name.trim() : ''
  const email = typeof author?.email === 'string' ? author.email.trim() : ''
  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw httpError(400, 'Author name and a valid email are required')
  }
  return { name, email }
}

function buildCommitMessage(input, author, branch) {
  const firstLine = typeof input === 'string' && input.trim() ? input.trim() : 'Update site content'
  return `${firstLine}\n\nSubmitted via /admin/editor\nEditor author: ${author.name} <${author.email}>\nTarget branch: ${branch}`
}

function normalizeSidebar(items) {
  return items
    .map((item) => {
      const text = typeof item?.text === 'string' ? item.text.trim() : ''
      const children = Array.isArray(item?.items) ? normalizeSidebar(item.items) : []
      if (!text) return null
      if (children.length) return { text, items: children }
      const link = typeof item?.link === 'string' && item.link.trim() ? item.link.trim() : '/'
      return { text, link }
    })
    .filter(Boolean)
}

function decodeBase64Text(input) {
  const binary = atob(input.replace(/\s/g, ''))
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function encodeGitPath(path) {
  return path.split('/').map(encodeURIComponent).join('/')
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

function httpError(status, message, details) {
  const error = new Error(message)
  error.status = status
  error.details = details
  return error
}
