<!DOCTYPE html>
<html>
<head>
	<meta http-equiv="content-type" content="text/html; charset=utf-8"/>
	<title></title>
	<meta name="generator" content="LibreOffice 25.8.5.2 (Linux)"/>
	<meta name="created" content="00:00:00"/>
	<meta name="changed" content="2026-03-31T09:15:24.459185698"/>
	<style type="text/css">
		@page { size: 21.59cm 27.94cm; margin-left: 2cm; margin-right: 1cm; margin-top: 1cm; margin-bottom: 1cm }
		p { margin-bottom: 0.25cm; line-height: 115%; background: transparent }
	</style>
</head>
<body lang="es-MX" link="#000080" vlink="#800000" dir="ltr"><p style="line-height: 100%; margin-bottom: 0cm">
&lt;!-- BEGIN:nextjs-agent-rules --&gt;</p>
<p style="line-height: 100%; margin-bottom: 0cm"># This is NOT the
Next.js you know</p>
<p style="line-height: 100%; margin-bottom: 0cm"><br/>

</p>
<p style="line-height: 100%; margin-bottom: 0cm">This version has
breaking changes — APIs, conventions, and file structure may all
differ from your training data. Read the relevant guide in
`node_modules/next/dist/docs/` before writing any code. Heed
deprecation notices.</p>
<p style="line-height: 100%; margin-bottom: 0cm">&lt;!--
END:nextjs-agent-rules --&gt;</p>
<p style="line-height: 100%; margin-bottom: 0cm"><br/>

</p>
<p style="line-height: 100%; margin-bottom: 0cm">---</p>
<p style="line-height: 100%; margin-bottom: 0cm"><br/>

</p>
<p style="line-height: 100%; margin-bottom: 0cm"># Reglas del agente
— manufactura.app</p>
<p style="line-height: 100%; margin-bottom: 0cm"><br/>

</p>
<p style="line-height: 100%; margin-bottom: 0cm">## Stack</p>
<p style="line-height: 100%; margin-bottom: 0cm">- Next.js 16 (App
Router) · Firebase (Auth + Firestore) · Tailwind v4 · TypeScript</p>
<p style="line-height: 100%; margin-bottom: 0cm"><br/>

</p>
<p style="line-height: 100%; margin-bottom: 0cm">## Commits y GitHub</p>
<p style="line-height: 100%; margin-bottom: 0cm"><br/>

</p>
<p style="line-height: 100%; margin-bottom: 0cm">**Nunca agregues
co-author a los commits.**</p>
<p style="line-height: 100%; margin-bottom: 0cm">No incluyas líneas
`Co-authored-by:` en ningún mensaje de commit, sin importar el
cambio.</p>
<p style="line-height: 100%; margin-bottom: 0cm"><br/>

</p>
<p style="line-height: 100%; margin-bottom: 0cm">El formato de commit
es simple:</p>
<p style="line-height: 100%; margin-bottom: 0cm">```</p>
<p style="line-height: 100%; margin-bottom: 0cm">tipo: descripción
corta en español</p>
<p style="line-height: 100%; margin-bottom: 0cm"><br/>

</p>
<p style="line-height: 100%; margin-bottom: 0cm">Detalle opcional si
el cambio es complejo.</p>
<p style="line-height: 100%; margin-bottom: 0cm">```</p>
<p style="line-height: 100%; margin-bottom: 0cm"><br/>

</p>
<p style="line-height: 100%; margin-bottom: 0cm">Tipos válidos:
`feat`, `fix`, `refactor`, `docs`, `chore`.</p>
<p style="line-height: 100%; margin-bottom: 0cm"><br/>

</p>
<p style="line-height: 100%; margin-bottom: 0cm">Ejemplo correcto:</p>
<p style="line-height: 100%; margin-bottom: 0cm">```</p>
<p style="line-height: 100%; margin-bottom: 0cm">feat: agregar
invitación a equipos por código</p>
<p style="line-height: 100%; margin-bottom: 0cm">```</p>
<p style="line-height: 100%; margin-bottom: 0cm"><br/>

</p>
<p style="line-height: 100%; margin-bottom: 0cm">Ejemplo incorrecto —
nunca hacer esto:</p>
<p style="line-height: 100%; margin-bottom: 0cm">```</p>
<p style="line-height: 100%; margin-bottom: 0cm">feat: agregar
invitación a equipos por código</p>
<p style="line-height: 100%; margin-bottom: 0cm"><br/>

</p>
<p style="line-height: 100%; margin-bottom: 0cm">Co-authored-by:
Claude &lt;noreply@anthropic.com&gt;</p>
<p style="line-height: 100%; margin-bottom: 0cm">```</p>
<p style="line-height: 100%; margin-bottom: 0cm"><br/>

</p>
<p style="line-height: 100%; margin-bottom: 0cm">## Bitácora
(CHANGELOG.md)</p>
<p style="line-height: 100%; margin-bottom: 0cm"><br/>

</p>
<p style="line-height: 100%; margin-bottom: 0cm">Después de cada
sesión de cambios, agrega una entrada al archivo `CHANGELOG.md` en
la raíz del repo con este formato:</p>
<p style="line-height: 100%; margin-bottom: 0cm">```markdown</p>
<p style="line-height: 100%; margin-bottom: 0cm">## [fecha] —
título del cambio</p>
<p style="line-height: 100%; margin-bottom: 0cm"><br/>

</p>
<p style="line-height: 100%; margin-bottom: 0cm">**Qué se hizo:**
descripción breve.  
</p>
<p style="line-height: 100%; margin-bottom: 0cm">**Archivos
modificados:** lista de archivos.  
</p>
<p style="line-height: 100%; margin-bottom: 0cm">**Decisión
técnica:** por qué se hizo así (si aplica).  
</p>
<p style="line-height: 100%; margin-bottom: 0cm">**Pendiente:** qué
queda por hacer en esta área.</p>
<p style="line-height: 100%; margin-bottom: 0cm">```</p>
<p style="line-height: 100%; margin-bottom: 0cm"><br/>

</p>
<p style="line-height: 100%; margin-bottom: 0cm">Si `CHANGELOG.md` no
existe, créalo.</p>
<p style="line-height: 100%; margin-bottom: 0cm"><br/>

</p>
<p style="line-height: 100%; margin-bottom: 0cm">## Reglas generales</p>
<p style="line-height: 100%; margin-bottom: 0cm"><br/>

</p>
<p style="line-height: 100%; margin-bottom: 0cm">- Leer
`node_modules/next/dist/docs/` antes de tocar routing, middleware o
configuración.</p>
<p style="line-height: 100%; margin-bottom: 0cm">- No modificar
`.env*` ni `firebaseConfig` bajo ninguna circunstancia.</p>
<p style="line-height: 100%; margin-bottom: 0cm">- Mantener los
componentes en `components/`, la lógica de Firestore en
`lib/firestore.ts`.</p>
<p style="line-height: 100%; margin-bottom: 0cm">- No instalar
dependencias sin confirmar primero.</p>
</body>
</html>