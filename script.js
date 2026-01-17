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

// Drawing variables
let currentTool = 'pencil';
let currentColor = '#000000';

const codeInput = document.getElementById('code-input');
const plantImg = document.getElementById('plantuml-img');
const mermaidDiv = document.getElementById('mermaid-output');
const canvas = document.getElementById('free-draw-canvas');
const ctx = canvas.getContext('2d');
const renderContainer = document.getElementById('render-container');
const logContent = document.getElementById('error-log-content');
const errorIndicator = document.getElementById('error-indicator');
const logContainer = document.getElementById('error-log-container');

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
	document.getElementById('draw-toolbar').style.display = mode === 'draw' ? 'block' : 'none';

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
	let newZoom = Math.min(Math.max(currentZoom + delta, 0.2), 10);
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

const scene = document.getElementById('scene');

scene.addEventListener('mousedown', startPan);
scene.addEventListener('mousemove', pan);
scene.addEventListener('mouseup', endPan);
scene.addEventListener('mouseleave', endPan);

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

// Zoom molette
scene.addEventListener(
	'wheel',
	(e) => {
		if (e.ctrlKey) {
			e.preventDefault();
			const delta = e.deltaY > 0 ? -0.05 : 0.05;
			changeZoom(delta);
		}
	},
	{ passive: false }
);

function downloadImage() {
	let fileName = (codeInput.value.match(/title\s+(.+)/i)?.[1] || 'diagramme').trim().replace(/\s+/g, '_');

	if (currentMode === 'mermaid') {
		const svgElement = mermaidDiv.querySelector('svg');
		if (!svgElement) return;

		const clonedSvg = svgElement.cloneNode(true);

		const bBox = svgElement.getBBox(); // Vraies dimensions du contenu du diagramme
		const padding = 20;

		// Clone pour l'export en vraies dimensions
		clonedSvg.setAttribute('viewBox', `${bBox.x - padding} ${bBox.y - padding} ${bBox.width + padding * 2} ${bBox.height + padding * 2}`);
		clonedSvg.setAttribute('width', bBox.width + padding * 2);
		clonedSvg.setAttribute('height', bBox.height + padding * 2);

		const svgData = new XMLSerializer().serializeToString(clonedSvg);
		const img = new Image();

		const scaleFactor = 2; // Multiplicateur HD (2 = 2x la résolution)

		img.onload = function () {
			const c = document.createElement('canvas');
			const ctxExp = c.getContext('2d');

			c.width = (bBox.width + padding * 2) * scaleFactor;
			c.height = (bBox.height + padding * 2) * scaleFactor;

			ctxExp.fillStyle = 'white'; // Fond blanc
			ctxExp.fillRect(0, 0, c.width, c.height);

			ctxExp.scale(scaleFactor, scaleFactor);
			ctxExp.drawImage(img, 0, 0);

			c.toBlob((blob) => {
				const a = document.createElement('a');
				a.href = URL.createObjectURL(blob);
				a.download = fileName + '_hd.png';
				a.click();
			}, 'image/png');
		};

		// Utilisation de blob pour éviter les erreurs de caractères spéciaux
		const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
		img.src = URL.createObjectURL(svgBlob);
	} else {
		// Logique simplifiée pour PlantUML et Draw
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
		img.src = currentMode === 'plantuml' ? plantImg.src : canvas.toDataURL('image/png');
	}
}

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

// DESSIN
function resizeCanvas() {
	const container = document.getElementById('preview-side');
	canvas.width = 800;
	canvas.height = 600;
	ctx.strokeStyle = currentColor;
	ctx.lineWidth = 2;
	ctx.lineCap = 'round';
	ctx.fillStyle = currentColor;
}

let drawing = false;
let startX, startY;

canvas.addEventListener('mousedown', (e) => {
	const rect = canvas.getBoundingClientRect();
	startX = e.clientX - rect.left;
	startY = e.clientY - rect.top;
	drawing = true;
	if (currentTool === 'pencil' || currentTool === 'eraser') {
		ctx.beginPath();
		ctx.moveTo(startX, startY);
	}
});

canvas.addEventListener('mousemove', (e) => {
	if (!drawing) return;
	const rect = canvas.getBoundingClientRect();
	const x = e.clientX - rect.left;
	const y = e.clientY - rect.top;
	if (currentTool === 'pencil') {
		ctx.strokeStyle = currentColor;
		ctx.lineTo(x, y);
		ctx.stroke();
	} else if (currentTool === 'eraser') {
		ctx.strokeStyle = '#FFFFFF';
		ctx.lineTo(x, y);
		ctx.stroke();
	}
});

canvas.addEventListener('mouseup', (e) => {
	if (!drawing) return;
	drawing = false;
	const rect = canvas.getBoundingClientRect();
	const endX = e.clientX - rect.left;
	const endY = e.clientY - rect.top;
	if (['square', 'circle', 'triangle', 'ellipse', 'pentagon', 'hexagon', 'trapezoid'].includes(currentTool)) {
		drawShape(currentTool, startX, startY, endX, endY);
	}
	ctx.beginPath();
});

function drawShape(shape, x1, y1, x2, y2) {
	const width = x2 - x1;
	const height = y2 - y1;
	ctx.strokeStyle = currentColor;
	ctx.fillStyle = currentColor;
	ctx.beginPath();
	switch (shape) {
		case 'square':
			ctx.rect(x1, y1, width, height);
			ctx.stroke();
			break;
		case 'circle':
			const radius = Math.sqrt(width * width + height * height) / 2;
			ctx.arc(x1 + width / 2, y1 + height / 2, radius, 0, 2 * Math.PI);
			ctx.stroke();
			break;
		case 'triangle':
			ctx.moveTo(x1 + width / 2, y1);
			ctx.lineTo(x1, y2);
			ctx.lineTo(x2, y2);
			ctx.closePath();
			ctx.stroke();
			break;
		case 'ellipse':
			ctx.ellipse(x1 + width / 2, y1 + height / 2, Math.abs(width / 2), Math.abs(height / 2), 0, 0, 2 * Math.PI);
			ctx.stroke();
			break;
		case 'pentagon':
			drawPolygon(5, x1 + width / 2, y1 + height / 2, Math.min(Math.abs(width), Math.abs(height)) / 2);
			break;
		case 'hexagon':
			drawPolygon(6, x1 + width / 2, y1 + height / 2, Math.min(Math.abs(width), Math.abs(height)) / 2);
			break;
		case 'trapezoid':
			ctx.moveTo(x1 + width * 0.2, y1);
			ctx.lineTo(x2 - width * 0.2, y1);
			ctx.lineTo(x2, y2);
			ctx.lineTo(x1, y2);
			ctx.closePath();
			ctx.stroke();
			break;
	}
}

function drawPolygon(sides, centerX, centerY, radius) {
	ctx.beginPath();
	for (let i = 0; i < sides; i++) {
		const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
		const x = centerX + radius * Math.cos(angle);
		const y = centerY + radius * Math.sin(angle);
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}
	ctx.closePath();
	ctx.stroke();
}

window.onload = render;

// Resizing functionality
const resizer = document.querySelector('.resizer');
let isResizing = false;

resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    document.body.style.cursor = window.innerWidth > 768 ? 'ew-resize' : 'ns-resize';
    e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    if (window.innerWidth > 768) {
        // Desktop: resize width
        const newWidth = (e.clientX / window.innerWidth) * 100;
        const clamped = Math.min(50, Math.max(25, newWidth));
        document.querySelector('.editor-side').style.width = clamped + 'vw';
    } else {
        // Mobile: resize height
        const newHeight = (e.clientY / window.innerHeight) * 100;
        const clamped = Math.min(45, Math.max(20, newHeight));
        document.querySelector('.editor-side').style.height = clamped + 'vh';
        document.querySelector('.preview-side').style.height = `calc(100vh - ${clamped}vh - 5px)`;
    }
});

document.addEventListener('mouseup', () => {
    isResizing = false;
    document.body.style.cursor = '';
});

// Drawing toolbar events
document.getElementById('pencil-btn').addEventListener('click', () => setTool('pencil'));
document.getElementById('eraser-btn').addEventListener('click', () => setTool('eraser'));
document.getElementById('shape-select').addEventListener('change', (e) => setTool(e.target.value));
document.getElementById('clear-btn').addEventListener('click', clearCanvas);
document.querySelectorAll('.color-btn').forEach(btn => {
	btn.addEventListener('click', (e) => {
		currentColor = e.target.dataset.color;
		document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
		e.target.classList.add('selected');
	});
});
document.querySelector('.color-btn').classList.add('selected');

function setTool(tool) {
	currentTool = tool;
	document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
	if (tool === 'pencil') document.getElementById('pencil-btn').classList.add('active');
	else if (tool === 'eraser') document.getElementById('eraser-btn').classList.add('active');
	document.getElementById('shape-select').value = tool === 'pencil' || tool === 'eraser' ? 'none' : tool;
}

function clearCanvas() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
}
