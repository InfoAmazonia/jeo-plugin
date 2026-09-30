// Integrated local development preview for the complete site.
//
// Starts both dev servers and stitches them under a single origin:
//
//   http://localhost:5173/       landing (React + Vite HMR)
//   http://localhost:5173/docs/  documentation (VitePress dev, proxied by
//                                the landing dev server — see the `server.proxy`
//                                block in landing-page/vite.config.js)
//
// Both processes share this script's lifetime: Ctrl+C stops them together.
import { spawn } from 'node:child_process'

const DOCS_PORT = '5174'

const targets = [
	{
		name: 'docs',
		cmd: 'npm',
		args: ['--prefix', 'docs', 'run', 'docs:dev', '--', '--port', DOCS_PORT],
	},
	{
		name: 'landing',
		cmd: 'npm',
		args: ['--prefix', 'landing-page', 'run', 'dev'],
	},
]

let stopping = false

const children = targets.map(({ name, cmd, args }) => {
	const child = spawn(cmd, args, { stdio: 'inherit' })
	child.on('exit', (code) => {
		console.log(`[dev-site] ${name} exited (code ${code ?? 'signal'})`)
		if (! stopping) {
			// If one server dies, bring the whole thing down.
			stopping = true
			children.forEach((other) => other !== child && other.kill())
			process.exitCode = code ?? 0
		}
	})
	return child
})

for (const signal of ['SIGINT', 'SIGTERM']) {
	process.on(signal, () => {
		if (stopping) {
			return
		}
		stopping = true
		children.forEach((child) => child.kill(signal))
	})
}

// Wait for the first child to exit; its handler tears the rest down.
await new Promise(() => {})
