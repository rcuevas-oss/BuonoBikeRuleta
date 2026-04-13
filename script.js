const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spin-btn');
const leadModal = document.getElementById('lead-modal');
const successModal = document.getElementById('success-modal');
const leadForm = document.getElementById('lead-form');
const couponDisplay = document.getElementById('coupon-display');

const DB_URL = "https://hull-talks-persons-additions.trycloudflare.com";

const prizes = [
    { label: "Bombín Specialized", color: "#111111" },
    { label: "Luz Delantera", color: "#222222" },
    { label: "Guantes Specialized", color: "#333333" },
    { label: "Experiencia E-Bike", color: "#444444" },
    { label: "Retiro Gratis para Mantención", color: "#1a1a1a" } // Winner (Now camouflaged)
];

let currentRotation = 0;
const numSegments = prizes.length;
const arc = 2 * Math.PI / numSegments;

function drawWheel() {
    const radius = canvas.width / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    prizes.forEach((prize, i) => {
        const angle = i * arc;
        
        ctx.beginPath();
        ctx.fillStyle = prize.color;
        ctx.moveTo(radius, radius);
        ctx.arc(radius, radius, radius, angle, angle + arc);
        ctx.lineTo(radius, radius);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.stroke();

        // Text
        ctx.save();
        ctx.translate(radius, radius);
        ctx.rotate(angle + arc / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "white";
        ctx.font = "bold 16px Outfit";
        ctx.fillText(prize.label, radius - 20, 10);
        ctx.restore();
    });
}

function spin() {
    spinBtn.disabled = true;
    
    // We want to land on "Retiro Gratis para Mantención" (Index 4)
    // The prize index is calculated counter-clockwise from the top (12 o'clock).
    // The pointer is at 1.5 * Math.PI (top).
    
    // Target angle for Index 4:
    // With 5 segments: 0: 0-72, 1: 72-144, 2: 144-216, 3: 216-288, 4: 288-360
    // We need the result of (1.5*PI - currentRotation) % 2*PI to be within the segment of Prize 4.
    
    const extraSpins = 5 + Math.random() * 5;
    const targetPrizeIndex = 4;
    
    // Calculate rotation to land EXACTLY on the middle of index 4 (Rojo)
    const segmentDeg = 360 / numSegments;
    const centerOfWinner = 324; // Center of index 4 (288 + 36)
    const pointerPos = 270; // Position of the top needle
    
    // Logic: (pointerPos - totalRotation) % 360 must be centerOfWinner
    // So targetDeg = pointerPos - centerOfWinner (adjusted for positive result)
    const targetDeg = (pointerPos - centerOfWinner + 360) % 360;
    
    const totalRotation = (Math.floor(extraSpins) * 360) + targetDeg;
    
    canvas.style.transition = 'transform 5s cubic-bezier(0.15, 0, 0.15, 1)';
    canvas.style.transform = `rotate(${totalRotation}deg)`;
    
    // Save state
    localStorage.setItem('buono_bike_spin', "true");

    setTimeout(() => {
        // Trigger Confetti!
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#E31B23', '#ffffff', '#000000']
        });
        
        leadModal.classList.remove('hidden');
    }, 5500);
}

leadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.innerText = "PROCESANDO...";
    submitBtn.disabled = true;

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const code = `RG-${Math.floor(Math.random() * 900) + 100}`;

    const data = {
        name: name,
        email: email,
        codigo: code,
        premio: "Retiro Gratis para Mantención"
    };

    try {
        const response = await fetch(`${DB_URL}/api/collections/leads_ruleta/records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            localStorage.setItem('buono_bike_completed', "true");
            couponDisplay.innerText = code;
            leadModal.classList.add('hidden');
            successModal.classList.remove('hidden');
        } else {
            alert("Error al guardar datos. Inténtalo de nuevo.");
            submitBtn.innerText = "OBTENER MI CÓDIGO";
            submitBtn.disabled = false;
        }
    } catch (err) {
        console.error(err);
        alert("Error de conexión.");
        submitBtn.innerText = "OBTENER MI CÓDIGO";
        submitBtn.disabled = false;
    }
});

// Check if already participated
window.addEventListener('load', () => {
    if (localStorage.getItem('buono_bike_completed')) {
        spinBtn.disabled = true;
        spinBtn.innerText = "YA PARTICIPASTE";
    }
});

spinBtn.addEventListener('click', spin);

drawWheel();
