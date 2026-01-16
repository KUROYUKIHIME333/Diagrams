let currentMode = 'mermaid';
let timeout = null;
let currentZoom = 1;

const codeInput = document.getElementById('code-input');
const plantImg = document.getElementById('plantuml-img');
const mermaidDiv = document.getElementById('mermaid-output');
const canvas = document.getElementById('free-draw-canvas');
const ctx = canvas.getContext('2d');
const renderContainer = document.getElementById('render-container');
const logContent = document.getElementById('error-log-content');

// --- INITIALISATION & SAUVEGARDE ---
const savedData = JSON.parse(localStorage.getItem('vibeStudio_backup')) || {};
const examples = {
	mermaid: savedData.mermaid || 'graph TD\n  A[Début] --> B{Choix}\n  B -- Oui --> C[Succès]\n  B -- Non --> D[Erreur]',
	plantuml: savedData.plantuml || 'usecaseDiagram\nactor "Admin" as Admin\npackage "Système" {\n  usecase "Gérer" as UC1\n}\nAdmin --> UC1',
	draw: '// Mode dessin libre.',
};

codeInput.value = examples.mermaid;
mermaid.initialize({ startOnLoad: false, suppressErrorRendering: true });

codeInput.addEventListener('input', () => {
	document.getElementById('status').innerText = 'En cours...';
	clearTimeout(timeout);
	timeout = setTimeout(render, 300);
});

function setMode(mode) {
	saveToLocal();
	currentMode = mode;
	document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
	event.target.classList.add('active');

	mermaidDiv.style.display = mode === 'mermaid' ? 'block' : 'none';
	plantImg.style.display = mode === 'plantuml' ? 'block' : 'none';
	canvas.style.display = mode === 'draw' ? 'block' : 'none';

	if (mode === 'draw') resizeCanvas();
	codeInput.value = examples[mode];
	render();
}

function saveToLocal() {
	examples[currentMode] = codeInput.value;
	localStorage.setItem('vibeStudio_backup', JSON.stringify(examples));
}

// --- RENDU ET LOGS ---
function log(msg, isError = true) {
	logContent.style.color = isError ? '#ff5f56' : '#4ade80';
	logContent.innerText = `[${new Date().toLocaleTimeString()}] ${msg}`;
}

async function render() {
	saveToLocal();
	const code = codeInput.value.trim();

	if (currentMode === 'mermaid') {
		// Nettoyage des erreurs Mermaid du DOM pour éviter la saturation
		mermaidDiv.innerHTML = '';
		document.querySelectorAll('[id^="dmermaid"]').forEach((el) => el.remove());

		try {
			const { svg } = await mermaid.render('m' + Math.floor(Math.random() * 1000), code);
			mermaidDiv.innerHTML = svg;
			document.getElementById('status').innerText = 'Mode: MERMAID (Prêt)';
			log('Rendu Mermaid réussi', false);
		} catch (e) {
			log('Erreur Mermaid : ' + e.message);
		}
	} else if (currentMode === 'plantuml') {
		let cleanCode = code;
		if (!cleanCode.startsWith('@start')) cleanCode = '@startuml\n' + cleanCode + '\n@enduml';

		const encoded = encodePlantUML(cleanCode);
		plantImg.crossOrigin = 'anonymous';
		plantImg.src = 'https://www.plantuml.com/plantuml/png/~1' + encoded;

		plantImg.onload = () => {
			document.getElementById('status').innerText = 'Mode: PLANTUML (Prêt)';
			log('Rendu PlantUML réussi', false);
		};
		plantImg.onerror = () => log('Erreur de rendu PlantUML');
	}
}

// --- GESTION DU ZOOM ---
function updateZoom(val) {
	currentZoom = parseFloat(val);
	renderContainer.style.transform = `scale(${currentZoom})`;
	document.getElementById('zoom-value').innerText = Math.round(currentZoom * 100) + '%';
	document.getElementById('zoom-slider').value = currentZoom;
}

function changeZoom(delta) {
	let newZoom = Math.min(Math.max(currentZoom + delta, 0.2), 3);
	updateZoom(newZoom);
}

// Zoom molette (Ctrl + Scroll)
document.getElementById('preview-side').addEventListener(
	'wheel',
	(e) => {
		if (e.ctrlKey) {
			e.preventDefault();
			changeZoom(e.deltaY > 0 ? -0.1 : 0.1);
		}
	},
	{ passive: false }
);

// --- TÉLÉCHARGEMENT ---
function downloadImage() {
	let fileName = (codeInput.value.match(/title\s+(.+)/i)?.[1] || 'diagramme').trim().replace(/\s+/g, '_');
	const img = new Image();
	img.crossOrigin = 'anonymous';

	img.onload = function () {
		const c = document.createElement('canvas');
		const ctxExp = c.getContext('2d');
		c.width = img.width;
		c.height = img.height;
		ctxExp.fillStyle = 'white';
		ctxExp.fillRect(0, 0, c.width, c.height);
		ctxExp.drawImage(img, 0, 0);
		c.toBlob((blob) => {
			const a = document.createElement('a');
			a.href = URL.createObjectURL(blob);
			a.download = fileName + '.png';
			a.click();
		}, 'image/png');
	};

	if (currentMode === 'plantuml') img.src = plantImg.src;
	else if (currentMode === 'draw') img.src = canvas.toDataURL('image/png');
	else {
		const svgData = new XMLSerializer().serializeToString(mermaidDiv.querySelector('svg'));
		img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
	}
}

// --- LOGIQUE PLANTUML (ENCODAGE) ---
function encodePlantUML(s) {
	const data = new TextEncoder().encode(s);
	const compressed = pako.deflate(data, { level: 9 });
	return ascii64Encode(compressed);
}
function ascii64Encode(data) {
	let r = '';
	for (let i = 0; i < data.length; i += 3) r += append3bytes(data[i], data[i + 1] || 0, data[i + 2] || 0);
	return r;
}
function append3bytes(b1, b2, b3) {
	let c1 = b1 >> 2,
		c2 = ((b1 & 0x3) << 4) | (b2 >> 4),
		c3 = ((b2 & 0xf) << 2) | (b3 >> 6),
		c4 = b3 & 0x3f;
	return encode6bit(c1 & 0x3f) + encode6bit(c2 & 0x3f) + encode6bit(c3 & 0x3f) + encode6bit(c4 & 0x3f);
}
function encode6bit(b) {
	if (b < 10) return String.fromCharCode(48 + b);
	if (b < 36) return String.fromCharCode(65 + b - 10);
	if (b < 62) return String.fromCharCode(97 + b - 36);
	return b === 62 ? '-' : b === 63 ? '_' : '?';
}

// --- DESSIN ---
function resizeCanvas() {
	const container = document.getElementById('preview-side');
	canvas.width = 800;
	canvas.height = 600;
	ctx.strokeStyle = '#3498db';
	ctx.lineWidth = 2;
	ctx.lineCap = 'round';
}
let drawing = false;
canvas.onmousedown = () => (drawing = true);
canvas.onmouseup = () => {
	drawing = false;
	ctx.beginPath();
};
canvas.onmousemove = (e) => {
	if (!drawing) return;
	const rect = canvas.getBoundingClientRect();
	ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
};

window.onload = render;
