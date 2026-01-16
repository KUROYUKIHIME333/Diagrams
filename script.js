let currentMode = 'mermaid';
let timeout = null; // Pour le rendu automatique (debounce)
const codeInput = document.getElementById('code-input');
const plantImg = document.getElementById('plantuml-img');
const mermaidDiv = document.getElementById('mermaid-output');
const canvas = document.getElementById('free-draw-canvas');
const ctx = canvas.getContext('2d');

// CHARGEMENT (sauvegarde locale ou exemples)
const savedData = JSON.parse(localStorage.getItem('vibeStudio_backup')) || {};

const examples = {
	mermaid: savedData.mermaid || 'graph TD\n  A[Début] --> B{Choix}\n  B -- Oui --> C[Succès]\n  B -- Non --> D[Erreur]',
	plantuml: savedData.plantuml || 'usecaseDiagram\nactor "Admin" as Admin\npackage "Système" {\n  usecase "Gérer" as UC1\n}\nAdmin --> UC1',
	draw: '// Mode dessin libre activé.\n// Utilisez la souris sur la droite.',
};

// Init
codeInput.value = examples.mermaid;
mermaid.initialize({ startOnLoad: false });

// Écouteur pour rendu temps réel
codeInput.addEventListener('input', () => {
	document.getElementById('status').innerText = 'En cours...';
	clearTimeout(timeout);
	timeout = setTimeout(render, 500); // 500ms après la fin de la frappe
});

function setMode(mode) {
	// Sauvegarder le code actuel avant de changer
	saveToLocal();

	currentMode = mode;
	document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
	event.target.classList.add('active');
	document.getElementById('status').innerText = 'Mode: ' + mode.toUpperCase();

	mermaidDiv.style.display = mode === 'mermaid' ? 'block' : 'none';
	plantImg.style.display = mode === 'plantuml' ? 'block' : 'none';
	canvas.style.display = mode === 'draw' ? 'block' : 'none';

	if (mode === 'draw') resizeCanvas();

	// Code qui correspond au mode
	codeInput.value = examples[mode];
	render();
}

function saveToLocal() {
	examples[currentMode] = codeInput.value;
	localStorage.setItem('vibeStudio_backup', JSON.stringify(examples));
}

async function render() {
	saveToLocal();
	const code = codeInput.value;

	if (currentMode === 'mermaid') {
		mermaidDiv.innerHTML = '';
		try {
			const { svg } = await mermaid.render('mermaid-' + Math.floor(Math.random() * 1000), code);
			mermaidDiv.innerHTML = svg;
			document.getElementById('status').innerText = 'Mode: MERMAID (Prêt)';
		} catch (e) {
			mermaidDiv.innerHTML = '<p style="color:red">Erreur de syntaxe Mermaid</p>';
		}
	} else if (currentMode === 'plantuml') {
		let cleanCode = code.trim();
		if (!cleanCode.startsWith('@start')) {
			cleanCode = '@startuml\n' + cleanCode + '\n@enduml';
		}
		const encoded = encodePlantUML(cleanCode);

		// On utilise crossOrigin pour éviter les problèmes de sécurité lors de la conversion en canvas
		plantImg.crossOrigin = 'anonymous';
		plantImg.src = 'https://www.plantuml.com/plantuml/png/~1' + encoded;

		plantImg.onload = () => (document.getElementById('status').innerText = 'Mode: PLANTUML (Prêt)');
	}
}

function downloadImage() {
	const status = document.getElementById('status');
	status.innerText = 'Téléchargement...';

	// Nom du fichier
	let fileName = 'mon_diagramme';
	const titleMatch = codeInput.value.match(/title\s+(.+)/i);
	if (titleMatch) fileName = titleMatch[1].trim().replace(/\s+/g, '_');
	fileName += '_' + currentMode + '.png';

	const canvasExp = document.createElement('canvas');
	const ctxExp = canvasExp.getContext('2d');
	const img = new Image();
	img.crossOrigin = 'anonymous'; // Pour les images distantes (PlantUML)

	img.onload = function () {
		canvasExp.width = img.width;
		canvasExp.height = img.height;

		// Fond blanc pour éviter la transparence
		ctxExp.fillStyle = 'white';
		ctxExp.fillRect(0, 0, canvasExp.width, canvasExp.height);

		ctxExp.drawImage(img, 0, 0);

		// Vrai download
		canvasExp.toBlob((blob) => {
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = fileName;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			status.innerText = 'Enregistré !';
		}, 'image/png');
	};

	if (currentMode === 'plantuml') {
		img.src = plantImg.src;
	} else if (currentMode === 'draw') {
		img.src = canvas.toDataURL('image/png');
	} else if (currentMode === 'mermaid') {
		// SVG Mermaid vers PNG
		const svgElement = mermaidDiv.querySelector('svg');
		const svgData = new XMLSerializer().serializeToString(svgElement);
		img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
	}
}

// LOGIQUE PLANTUML
function encodePlantUML(s) {
	const data = new TextEncoder().encode(s);
	const compressed = pako.deflate(data, { level: 9 });
	return ascii64Encode(compressed);
}

function ascii64Encode(data) {
	let r = '';
	for (let i = 0; i < data.length; i += 3) {
		r += append3bytes(data[i], data[i + 1] || 0, data[i + 2] || 0);
	}
	return r;
}

function append3bytes(b1, b2, b3) {
	let c1 = b1 >> 2;
	let c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
	let c3 = ((b2 & 0xf) << 2) | (b3 >> 6);
	let c4 = b3 & 0x3f;
	return encode6bit(c1 & 0x3f) + encode6bit(c2 & 0x3f) + encode6bit(c3 & 0x3f) + encode6bit(c4 & 0x3f);
}

function encode6bit(b) {
	if (b < 10) return String.fromCharCode(48 + b);
	if (b < 36) return String.fromCharCode(65 + b - 10);
	if (b < 62) return String.fromCharCode(97 + b - 36);
	if (b === 62) return '-';
	if (b === 63) return '_';
	return '?';
}

// DESSIN ET EXPORT
function resizeCanvas() {
	const container = document.getElementById('preview-side');
	canvas.width = container.clientWidth - 40;
	canvas.height = container.clientHeight - 40;
	ctx.strokeStyle = '#3498db';
	ctx.lineWidth = 2;
}

// Dessin libre simple
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
};

window.onload = render;
