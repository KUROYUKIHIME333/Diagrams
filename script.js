// Initialisation Mermaid
mermaid.initialize({ startOnLoad: false });

const mermaidInput = document.querySelector('#mermaid-input');
const mermaidRender = document.querySelector('#mermaid-render');
const canvas = document.querySelector('#free-draw-canvas');
const ctx = canvas.getContext('2d');

// Gestion des Onglets
function switchTab(mode) {
	document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
	if (mode === 'code') {
		document.querySelector('#code-section').style.display = 'flex';
		document.querySelector('#draw-section').style.display = 'none';
		mermaidRender.style.display = 'block';
		canvas.style.display = 'none';
		event.target.classList.add('active');
	} else {
		document.querySelector('#code-section').style.display = 'none';
		document.querySelector('#draw-section').style.display = 'flex';
		mermaidRender.style.display = 'none';
		canvas.style.display = 'block';
		event.target.classList.add('active');
		resizeCanvas();
	}
}

// Code vers Diagramme
async function renderDiagram() {
	const code = mermaidInput.value;
	mermaidRender.innerHTML = '';
	try {
		const { svg } = await mermaid.render('graphDiv', code);
		mermaidRender.innerHTML = svg;
	} catch (error) {
		mermaidRender.innerHTML = "<p style='color:red'>Erreur de syntaxe : " + error.message + '</p>';
	}
}

// Logique Dessin Libre
let drawing = false;

function resizeCanvas() {
	canvas.width = canvas.parentElement.clientWidth - 40;
	canvas.height = canvas.parentElement.clientHeight - 40;
}

canvas.addEventListener('mousedown', () => (drawing = true));
canvas.addEventListener('mouseup', () => {
	drawing = false;
	ctx.beginPath();
});
canvas.addEventListener('mousemove', draw);

function draw(e) {
	if (!drawing) return;
	ctx.lineWidth = 3;
	ctx.lineCap = 'round';
	ctx.strokeStyle = document.querySelector('#colorPicker').value;

	const rect = canvas.getBoundingClientRect();
	ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function clearCanvas() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Premier rendu au chargement
window.onload = () => {
	renderDiagram();
};
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
