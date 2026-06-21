#!/usr/bin/env node
/**
 * Generate a client-ready PDF from RELATORIO_3.0.0_ATE_ATUAL.md with a Hacklab
 * header and an NDA/confidentiality footer repeated on every page.
 *
 * Usage: node scripts/relatorio-to-pdf.mjs
 *
 * Produces: build-pdf/relatorio.html (intermediate) — printed to PDF by Chrome.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire( import.meta.url );
const MarkdownIt = require( 'markdown-it' );

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const root = path.resolve( __dirname, '..' );

const SRC = path.join( root, 'RELATORIO_3.0.0_ATE_ATUAL.md' );
const OUT_DIR = path.join( root, 'build-pdf' );
const OUT_HTML = path.join( OUT_DIR, 'relatorio.html' );

fs.mkdirSync( OUT_DIR, { recursive: true } );

const md = new MarkdownIt( { html: true, linkify: true, typographer: false } );
const markdown = fs.readFileSync( SRC, 'utf8' );
const body = md.render( markdown );

const today = new Intl.DateTimeFormat( 'pt-BR', {
	day: '2-digit',
	month: 'long',
	year: 'numeric',
} ).format( new Date() );

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>JEO Plugin — Relatório Técnico</title>
<style>
	/*
	 * Repeating header/footer use the thead/tfoot technique, which headless
	 * Chrome reliably repeats on every printed page (position:fixed + @page
	 * margins is inconsistent in headless print).
	 */
	@page {
		size: A4;
		margin: 12mm 14mm 12mm 14mm;
	}

	* { box-sizing: border-box; }

	html, body {
		font-family: "Helvetica Neue", Arial, sans-serif;
		font-size: 10.5pt;
		line-height: 1.55;
		color: #1f2328;
		margin: 0;
		padding: 0;
		-webkit-print-color-adjust: exact;
		print-color-adjust: exact;
	}

	table.page-frame {
		width: 100%;
		border-collapse: collapse;
	}
	table.page-frame > thead { display: table-header-group; }
	table.page-frame > tfoot { display: table-footer-group; }
	table.page-frame > thead > tr > td,
	table.page-frame > tfoot > tr > td,
	table.page-frame > tbody > tr > td { border: none; padding: 0; }

	/* Header band (Hacklab brand) — repeats at top of every page */
	.hl-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 0 5pt;
		margin-bottom: 12pt;
		border-bottom: 2px solid #111;
	}
	.hl-brand {
		font-size: 15pt;
		font-weight: 800;
		letter-spacing: -0.5px;
		color: #111;
	}
	.hl-brand span { color: #e15a2d; }
	.hl-header-meta {
		text-align: right;
		font-size: 8pt;
		color: #555;
		line-height: 1.3;
	}

	/* Footer band (NDA / confidentiality) — repeats at bottom of every page */
	.hl-footer {
		padding-top: 5pt;
		margin-top: 12pt;
		border-top: 1px solid #ccc;
	}
	.hl-footer-text {
		font-size: 7pt;
		color: #6a6a6a;
		line-height: 1.35;
	}
	.hl-footer-text strong { color: #b8431c; }

	/* Content */
	.hl-content { padding: 0; }

	h1 { font-size: 19pt; color: #111; margin: 4pt 0 4pt; line-height: 1.2; }
	h2 {
		font-size: 14pt;
		color: #111;
		margin: 16pt 0 6pt;
		padding-bottom: 3pt;
		border-bottom: 1px solid #e15a2d;
		break-after: avoid;
	}
	h3 { font-size: 11.5pt; color: #b8431c; margin: 12pt 0 4pt; break-after: avoid; }
	h4 { font-size: 10.5pt; color: #333; margin: 10pt 0 3pt; break-after: avoid; }
	p { margin: 0 0 7pt; }
	ul, ol { margin: 0 0 8pt; padding-left: 18pt; }
	li { margin: 0 0 3pt; }

	a { color: #1f5fae; text-decoration: none; }
	code {
		font-family: "SFMono-Regular", Consolas, monospace;
		font-size: 8.6pt;
		background: #f3f4f6;
		padding: 1px 4px;
		border-radius: 3px;
		color: #b8431c;
	}

	.hl-content table {
		border-collapse: collapse;
		width: 100%;
		margin: 6pt 0 12pt;
		font-size: 9pt;
		break-inside: avoid;
	}
	.hl-content th, .hl-content td {
		border: 1px solid #d6d6d6;
		padding: 4pt 6pt;
		text-align: left;
		vertical-align: top;
	}
	.hl-content th { background: #f6f3f1; color: #111; font-weight: 700; }
	.hl-content tr:nth-child(even) td { background: #fbfafa; }

	hr { border: none; border-top: 1px solid #e5e5e5; margin: 14pt 0; }

	pre { break-inside: avoid; }
</style>
</head>
<body>
	<table class="page-frame">
		<thead>
			<tr><td>
				<div class="hl-header">
					<div class="hl-brand">hacklab<span>/</span></div>
					<div class="hl-header-meta">
						JEO Plugin — Relatório Técnico de Evolução<br />
						Confidencial · ${ today }
					</div>
				</div>
			</td></tr>
		</thead>
		<tfoot>
			<tr><td>
				<div class="hl-footer">
					<div class="hl-footer-text">
						<strong>CONFIDENCIAL — sujeito a Acordo de Confidencialidade (NDA).</strong>
						Este documento e seu conteúdo são de propriedade da Hacklab Cooperativa e
						destinam-se exclusivamente ao destinatário. É vedada a reprodução, distribuição
						ou divulgação, total ou parcial, a terceiros sem autorização prévia e por escrito.
						© ${ new Date().getFullYear() } Hacklab · hacklab.com.br
					</div>
				</div>
			</td></tr>
		</tfoot>
		<tbody>
			<tr><td>
				<main class="hl-content">
					${ body }
				</main>
			</td></tr>
		</tbody>
	</table>
</body>
</html>`;

fs.writeFileSync( OUT_HTML, html, 'utf8' );
process.stdout.write( OUT_HTML + '\n' );
