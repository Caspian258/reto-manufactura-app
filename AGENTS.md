<!DOCTYPE html>
<html>
<head>
	<meta http-equiv="content-type" content="text/html; charset=utf-8"/>
	<title></title>
	<meta name="generator" content="LibreOffice 25.8.5.2 (Linux)"/>
	<meta name="created" content="00:00:00"/>
	<meta name="changed" content="2026-03-31T09:41:46.828054091"/>
	<style type="text/css">
		@page { size: 21.59cm 27.94cm; margin-left: 2cm; margin-right: 1cm; margin-top: 1cm; margin-bottom: 1cm }
		p { background: transparent; margin-bottom: 0.25cm; line-height: 115%; background: transparent }
		a:link { color: #000080; text-decoration: underline }
		a:visited { color: #800000; text-decoration: underline }
	</style>
</head>
<body lang="es-MX" link="#000080" vlink="#800000" dir="ltr"><p style="margin-bottom: 0cm; line-height: 100%">
&lt;!-- BEGIN:nextjs-agent-rules --&gt;</p>
<p style="margin-bottom: 0cm; line-height: 100%"># This is NOT the
Next.js you know</p>
<p style="margin-bottom: 0cm; line-height: 100%"><br/>

</p>
<p style="margin-bottom: 0cm; line-height: 100%">This version has
breaking changes — APIs, conventions, and file structure may all
differ from your training data. Read the relevant guide in
`node_modules/next/dist/docs/` before writing any code. Heed
deprecation notices.</p>
<p style="margin-bottom: 0cm; line-height: 100%">&lt;!--
END:nextjs-agent-rules --&gt;</p>
<p style="margin-bottom: 0cm; line-height: 100%"><br/>

</p>
<p style="margin-bottom: 0cm; line-height: 100%">---</p>
<p style="margin-bottom: 0cm; line-height: 100%"><br/>

</p>
<p style="margin-bottom: 0cm; line-height: 100%"># Reglas del agente
— manufactura.app</p>
<p style="margin-bottom: 0cm; line-height: 100%"><br/>

</p>
<p style="margin-bottom: 0cm; line-height: 100%">## Orquestador</p>
<p style="margin-bottom: 0cm; line-height: 100%"><br/>

</p>
<p style="margin-bottom: 0cm; line-height: 100%">Este proyecto tiene
un orquestador externo: **Claude (claude.ai)**, accesible en:</p>
<p style="margin-bottom: 0cm; line-height: 100%">`https://claude.ai/project/019d446c-9943-7533-a191-b2ca150041fe`</p>
<p style="margin-bottom: 0cm; line-height: 100%"><br/>

</p>
<p style="margin-bottom: 0cm; line-height: 100%">El orquestador
define la arquitectura, el roadmap y las decisiones técnicas.</p>
<p style="margin-bottom: 0cm; line-height: 100%">Claude Code es el
ejecutor — implementa lo que el orquestador indica.</p>
<p style="margin-bottom: 0cm; line-height: 100%"><br/>

</p>
<p style="margin-bottom: 0cm; line-height: 100%">Antes de tomar
decisiones grandes (nueva dependencia, cambio de estructura,</p>
<p style="margin-bottom: 0cm; line-height: 100%">nueva ruta),
consulta al orquestador. Para cambios pequeños y correcciones,</p>
<p style="margin-bottom: 0cm; line-height: 100%">procede y documenta
en CHANGELOG.md.</p>
<p style="margin-bottom: 0cm; line-height: 100%"><br/>

</p>
<p style="margin-bottom: 0cm; line-height: 100%">## Stack</p>
<p style="margin-bottom: 0cm; line-height: 100%">- Next.js 16 (App
Router) · Firebase (Auth + Firestore) · Tailwind v4 · TypeScript</p>
<p style="margin-bottom: 0cm; line-height: 100%"><br/>

</p>
<p style="margin-bottom: 0cm; line-height: 100%">## Commits y GitHub</p>
<p style="margin-bottom: 0cm; line-height: 100%"><br/>

</p>
<p style="margin-bottom: 0cm; line-height: 100%">**Nunca agregues
co-author a los commits.**</p>
<p style="margin-bottom: 0cm; line-height: 100%">No incluyas líneas
`Co-authored-by:` en ningún mensaje de commit.</p>
<p style="margin-bottom: 0cm; line-height: 100%"><br/>

</p>
<p style="margin-bottom: 0cm; line-height: 100%">Formato de commit:</p>
<p style="margin-bottom: 0cm; line-height: 100%">```</p>
<p style="margin-bottom: 0cm; line-height: 100%">tipo: descripción
corta en español</p>
<p style="margin-bottom: 0cm; line-height: 100%">```</p>
<p style="margin-bottom: 0cm; line-height: 100%"><br/>

</p>
<p style="margin-bottom: 0cm; line-height: 100%">Tipos válidos:
`feat`, `fix`, `refactor`, `docs`, `chore`.</p>
<p style="margin-bottom: 0cm; line-height: 100%"><br/>

</p>
<p style="margin-bottom: 0cm; line-height: 100%">## Bitácora
(CHANGELOG.md)</p>
<p style="margin-bottom: 0cm; line-height: 100%"><br/>

</p>
<p style="margin-bottom: 0cm; line-height: 100%">Después de cada
sesión agrega una entrada:</p>
<p style="margin-bottom: 0cm; line-height: 100%">```markdown</p>
<p style="margin-bottom: 0cm; line-height: 100%">## [fecha] —
título del cambio</p>
<p style="margin-bottom: 0cm; line-height: 100%"><br/>

</p>
<p style="margin-bottom: 0cm; line-height: 100%">**Qué se hizo:**
descripción breve.</p>
<p style="margin-bottom: 0cm; line-height: 100%">**Archivos
modificados:** lista.</p>
<p style="margin-bottom: 0cm; line-height: 100%">**Decisión
técnica:** justificación.</p>
<p style="margin-bottom: 0cm; line-height: 100%">**Pendiente:** qué
falta.</p>
<p style="margin-bottom: 0cm; line-height: 100%">```</p>
<p style="margin-bottom: 0cm; line-height: 100%"><br/>

</p>
<p style="margin-bottom: 0cm; line-height: 100%">## Reglas generales</p>
<p style="margin-bottom: 0cm; line-height: 100%"><br/>

</p>
<p style="margin-bottom: 0cm; line-height: 100%">- Leer
`node_modules/next/dist/docs/` antes de tocar routing o config.</p>
<p style="margin-bottom: 0cm; line-height: 100%">- No modificar
`.env*` ni `firebaseConfig`.</p>
<p style="margin-bottom: 0cm; line-height: 100%">- Mantener lógica
de Firestore en `lib/firestore.ts`.</p>
<p style="line-height: 100%; margin-bottom: 0cm">- No instalar
dependencias sin confirmar con el orquestador.</p>
</body>
</html>