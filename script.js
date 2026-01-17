let currentMode = 'mermaid';
let timeout = null;
let currentZoom = 1;
let translateX = 0;
let translateY = 0;
let isPanning = false;
let lastPanX = 0;
let lastPanY = 0;
let imageWidth = 0;
let imageHeight = 0;

const codeInput = document.getElementById('code-input');
const plantImg = document.getElementById('plantuml-img');
const mermaidDiv = document.getElementById('mermaid-output');
const canvas = document.getElementById('free-draw-canvas');
const ctx = canvas.getContext('2d');
const renderContainer = document.getElementById('render-container');
const logContent = document.getElementById('error-log-content');
const errorIndicator = document.getElementById('error-indicator');
const logContainer = document.getElementById('error-log-container');

// --- INITIALISATION & SAUVEGARDE ---
const savedData = JSON.parse(localStorage.getItem('vibeStudio_backup')) || {};
savedData.theme = savedData.theme || 'light';
const examples = {
	mermaid: savedData.mermaid || 'graph TD\n  A[Début] --> B{Choix}\n  B -- Oui --> C[Succès]\n  B -- Non --> D[Erreur]',
	plantuml: savedData.plantuml || 'usecaseDiagram\nactor "Admin" as Admin\npackage "Système" {\n  usecase "Gérer" as UC1\n}\nAdmin --> UC1',
	draw: '// Mode dessin libre.',
};

codeInput.value = examples.mermaid;
if (savedData.theme === 'dark') codeInput.classList.add('dark-theme');
document.getElementById('theme-btn').innerHTML = savedData.theme === 'dark' ? '🌙' : '☀️';
document.getElementById('theme-btn').title = savedData.theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre';
mermaid.initialize({ startOnLoad: false, suppressErrorRendering: true });

codeInput.addEventListener('input', () => {
	document.getElementById('status').innerText = 'En cours...';
	clearTimeout(timeout);
	timeout = setTimeout(render, 300);
});

codeInput.addEventListener('keydown', function (e) {
	if (e.key === 'Tab') {
		e.preventDefault();
		const start = this.selectionStart;
		const end = this.selectionEnd;
		this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
		this.selectionStart = this.selectionEnd = start + 4;
	}
});

function setMode(mode) {
	saveToLocal();
	currentMode = mode;
	document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
	event.target.classList.add('active');

	mermaidDiv.style.display = mode === 'mermaid' ? 'block' : 'none';
	plantImg.style.display = mode === 'plantuml' ? 'block' : 'none';
	canvas.style.display = mode === 'draw' ? 'block' : 'none';

	if (mode === 'draw') {
		resizeCanvas();
		updateImageSize();
	}
	codeInput.value = examples[mode];
	render();
}

function saveToLocal() {
	examples[currentMode] = codeInput.value;
	savedData.mermaid = examples.mermaid;
	savedData.plantuml = examples.plantuml;
	savedData.draw = examples.draw;
	localStorage.setItem('vibeStudio_backup', JSON.stringify(savedData));
}

function toggleTheme() {
	codeInput.classList.toggle('dark-theme');
	const isDark = codeInput.classList.contains('dark-theme');
	savedData.theme = isDark ? 'dark' : 'light';
	localStorage.setItem('vibeStudio_backup', JSON.stringify(savedData));
	document.getElementById('theme-btn').innerHTML = isDark ? '🌙' : '☀️';
	document.getElementById('theme-btn').title = isDark ? 'Passer en mode clair' : 'Passer en mode sombre';
}

// --- LOGS ET CONSOLE ---
function log(msg, isError = true) {
	logContent.style.color = isError ? '#ff5f56' : '#4ade80';
	logContent.innerText = `[${new Date().toLocaleTimeString()}] ${msg}`;
	if (isError && logContainer.classList.contains('collapsed')) {
		errorIndicator.classList.remove('hidden');
	}
}

function toggleLog() {
	logContainer.classList.toggle('collapsed');
	if (logContainer.classList.contains('collapsed')) {
		errorIndicator.classList.add('hidden');
	}
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
			updateImageSize();
			resetView(); // Reset view après rendu
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
			updateImageSize();
			resetView(); // Reset view après rendu
		};
		plantImg.onerror = () => log('Erreur de rendu PlantUML');
	}
}

// --- GESTION DU ZOOM ET PAN ---
function updateImageSize() {
	if (currentMode === 'mermaid') {
		const svg = mermaidDiv.querySelector('svg');
		if (svg) {
			imageWidth = svg.clientWidth || svg.getBoundingClientRect().width;
			imageHeight = svg.clientHeight || svg.getBoundingClientRect().height;
		}
	} else if (currentMode === 'plantuml') {
		imageWidth = plantImg.naturalWidth || plantImg.clientWidth;
		imageHeight = plantImg.naturalHeight || plantImg.clientHeight;
	} else if (currentMode === 'draw') {
		imageWidth = canvas.width;
		imageHeight = canvas.height;
	}
}
function updateZoom(val) {
	currentZoom = parseFloat(val);
	applyTransform();
	document.getElementById('zoom-value').innerText = Math.round(currentZoom * 100) + '%';
	document.getElementById('zoom-slider').value = currentZoom;
}

function changeZoom(delta) {
	let newZoom = Math.min(Math.max(currentZoom + delta, 0.2), 3);
	updateZoom(newZoom);
}

function resetView() {
	currentZoom = 1;
	translateX = 0;
	translateY = 0;
	applyTransform();
	document.getElementById('zoom-value').innerText = '100%';
	document.getElementById('zoom-slider').value = 1;
}

function applyTransform() {
	renderContainer.style.transform = `translate(-50%, -50%) scale(${currentZoom}) translate(${translateX}px, ${translateY}px)`;
}

// Gestion du pan (déplacement)
const scene = document.getElementById('scene');

scene.addEventListener('mousedown', startPan);
scene.addEventListener('mousemove', pan);
scene.addEventListener('mouseup', endPan);
scene.addEventListener('mouseleave', endPan);

// Support tactile pour mobile
scene.addEventListener('touchstart', startPan, { passive: false });
scene.addEventListener('touchmove', pan, { passive: false });
scene.addEventListener('touchend', endPan);

function startPan(e) {
	if (currentZoom <= 1) return; // Pas de pan si pas zoomé
	e.preventDefault();
	isPanning = true;
	lastPanX = e.clientX || e.touches[0].clientX;
	lastPanY = e.clientY || e.touches[0].clientY;
}

function pan(e) {
	if (!isPanning) return;
	e.preventDefault();
	const clientX = e.clientX || e.touches[0].clientX;
	const clientY = e.clientY || e.touches[0].clientY;
	const deltaX = clientX - lastPanX;
	const deltaY = clientY - lastPanY;
	translateX += deltaX / currentZoom;
	translateY += deltaY / currentZoom;

	// Limiter le pan dynamiquement basé sur la taille de l'image
	const sceneRect = scene.getBoundingClientRect();
	const maxX = Math.max(0, (imageWidth * currentZoom - sceneRect.width) / 2 / currentZoom);
	const maxY = Math.max(0, (imageHeight * currentZoom - sceneRect.height) / 2 / currentZoom);
	translateX = Math.max(-maxX, Math.min(maxX, translateX));
	translateY = Math.max(-maxY, Math.min(maxY, translateY));

	lastPanX = clientX;
	lastPanY = clientY;
	applyTransform();
}

function endPan() {
	isPanning = false;
}

// Zoom molette (Ctrl + Scroll) - sensibilité ajustée
scene.addEventListener(
	'wheel',
	(e) => {
		if (e.ctrlKey) {
			e.preventDefault();
			const delta = e.deltaY > 0 ? -0.05 : 0.05; // Moins sensible
			changeZoom(delta);
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
