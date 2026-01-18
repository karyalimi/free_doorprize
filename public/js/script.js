// ================= STATE VARIABELS =================
let participants = []; 
let winners = [];      
let manualSelection = []; // STORES MANUALLY SELECTED NAMES

let currentPrizeName = "";
let currentQuota = 0;
let isRolling = false;

// Audio Objects
let audioTension, audioWin;

// ================= INISIALISASI =================
document.addEventListener('DOMContentLoaded', () => {
    // Inisialisasi audio elements setelah DOM siap
    audioTension = document.getElementById('audio-tension');
    audioWin = document.getElementById('audio-win');
    
    renderParticipants();
});

// ================= FUNGSI FULLSCREEN =================
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// ================= FUNGSI ALERT POPUP =================
function showWarning(msg) {
    const modal = document.getElementById('modal_alert');
    const msgEl = document.getElementById('alert-message');
    msgEl.innerText = msg;
    modal.showModal();
}

// ================= LOGIC PESERTA =================
function handleEnterParticipant(e) {
    if (e.key === 'Enter') {
        addParticipant();
    }
}

function addParticipant() {
    const input = document.getElementById('input-new-participant');
    const name = input.value.trim();

    if (!name) return;
    if (participants.includes(name)) {
        showWarning("Participant name already exists!");
        return;
    }

    participants.push(name);
    input.value = "";
    input.focus();
    renderParticipants();
}

function removeParticipant(index) {
    const nameToRemove = participants[index];
    
    if (winners.includes(nameToRemove)) {
        showWarning("Cannot remove a participant who has already won. Please Reset.");
        return;
    }

    // Remove from manual selection if exists
    const manualIndex = manualSelection.indexOf(nameToRemove);
    if (manualIndex > -1) {
        manualSelection.splice(manualIndex, 1);
    }

    participants.splice(index, 1);
    renderParticipants();
}

function renderParticipants() {
    const container = document.getElementById('participant-list-container');
    container.innerHTML = '';

    if (participants.length === 0) {
        container.innerHTML = '<div class="text-center text-white text-lg mt-20 font-light">No participants yet.</div>';
        return;
    }

    participants.forEach((name, index) => {
        const hasWon = winners.includes(name);
        
        const wrapper = document.createElement('div');
        wrapper.className = `flex items-center justify-between p-3 rounded hover:bg-white/5 ${hasWon ? 'opacity-50 bg-red-900/10 border border-red-900/30' : ''}`;

        // Checkbox Wrapper
        const label = document.createElement('label');
        label.className = "cursor-pointer justify-start gap-4 flex-grow flex items-center";

        const input = document.createElement('input');
        input.type = "checkbox";
        input.value = name;
        input.className = "checkbox checkbox-warning"; 
        
        if (hasWon) {
            input.disabled = true; 
        } else {
            // Restore checked state from 'manualSelection' memory
            if (manualSelection.includes(name)) {
                input.checked = true;
            }
        }

        // PARTICIPANT LIST TEXT
        const span = document.createElement('span');
        span.className = "text-lg font-bold tracking-wide"; 
        span.style.color = "#ffffff"; 
        span.innerText = name;

        label.appendChild(input);
        label.appendChild(span);
        wrapper.appendChild(label);

        // Delete Button
        if (!hasWon) {
            const delBtn = document.createElement('button');
            delBtn.className = "btn btn-ghost text-red-400 hover:text-red-500 btn-sm";
            delBtn.innerHTML = '<i class="fa-solid fa-times"></i>';
            delBtn.onclick = () => removeParticipant(index);
            wrapper.appendChild(delBtn);
        } else {
            const badge = document.createElement('span');
            badge.className = "badge badge-error text-white border-none";
            badge.innerText = "WINNER";
            wrapper.appendChild(badge);
        }

        container.appendChild(wrapper);
    });
}

// ================= LOGIC SETTING & SAVE =================
function saveSettings() {
    const prizeInput = document.getElementById('input-prize-name');
    const quotaInput = document.getElementById('input-quota');
    
    const pName = prizeInput.value.trim();
    const qVal = parseInt(quotaInput.value);

    if (!pName) {
        showWarning("Prize name cannot be empty!");
        return;
    }
    if (isNaN(qVal) || qVal < 1) {
        showWarning("Quota must be greater than 0!");
        return;
    }
    if (participants.length === 0) {
        showWarning("Please add participants first!");
        return;
    }

    // SAVE MANUAL SELECTION STATE
    const checkedBoxes = Array.from(document.querySelectorAll('#participant-list-container input[type="checkbox"]:checked'));
    manualSelection = checkedBoxes.map(cb => cb.value);

    currentPrizeName = pName;
    currentQuota = qVal;

    document.getElementById('prize-name-display').innerText = currentPrizeName;
    document.getElementById('quota-display').innerText = currentQuota;
    
    document.getElementById('prize-area').classList.remove('opacity-0', 'translate-y-4');
    document.getElementById('quota-area').classList.remove('opacity-0');

    document.getElementById('modal_settings').close();
}

// ================= LOGIC SPIN / UTAMA (FIXED SEQUENTIAL) =================
function handleSpin() {
    if (isRolling) return;
    
    if (!currentPrizeName) {
        showWarning("Please open settings (Gear) to set the prize and participants.");
        return;
    }

    if (currentQuota <= 0) {
        showWinnersModal();
        return;
    }

    // Determine Winner
    let winner;

    // MANUAL SELECTION LOGIC
    let validManualSelection = manualSelection.filter(name => !winners.includes(name));

    if (validManualSelection.length > 0) {
        // MANUAL MODE: Take index 0 (Sequential)
        winner = validManualSelection[0];
    } else {
        // RANDOM MODE
        let randomPool = participants.filter(p => !winners.includes(p));
        
        if (randomPool.length === 0) {
            showWarning("No participants available to draw.");
            return;
        }
        
        const winnerIndex = Math.floor(Math.random() * randomPool.length);
        winner = randomPool[winnerIndex];
    }

    // Start Animation
    isRolling = true;
    const btn = document.getElementById('btn-spin');
    btn.classList.add('loading'); 
    btn.disabled = true;

    if(audioTension) {
        audioTension.currentTime = 0;
        audioTension.play().catch(e => console.log("Audio play blocked by browser policy"));
    }

    const displayName = document.getElementById('display-name');
    displayName.classList.add('spin-active');
    displayName.classList.remove('text-transparent'); 
    displayName.style.color = "#fff";

    let counter = 0;
    let speed = 50; 

    const interval = setInterval(() => {
        const tempIndex = Math.floor(Math.random() * participants.length);
        displayName.innerText = participants[tempIndex];
        counter++;

        if (counter > 20) speed += 15;

        if (counter > 35) { 
            clearInterval(interval);
            finalizeSpin(winner);
        }

    }, speed);
}

function finalizeSpin(winner) {
    const displayName = document.getElementById('display-name');
    displayName.innerText = winner;
    displayName.classList.remove('spin-active');
    displayName.classList.add('text-transparent'); 
    displayName.style.color = ""; 
    displayName.classList.add('neon-text');

    if(audioTension) {
        audioTension.pause();
        audioTension.currentTime = 0;
    }
    if(audioWin) {
        audioWin.currentTime = 0;
        audioWin.play().catch(e => console.log("Win sound error"));
    }

    isRolling = false;
    const btn = document.getElementById('btn-spin');
    btn.classList.remove('loading');
    btn.disabled = false;

    winners.push(winner);
    currentQuota--;

    document.getElementById('quota-display').innerText = currentQuota;
    renderParticipants(); 
    
    createConfetti(); 

    if (currentQuota === 0) {
        setTimeout(() => {
            showWinnersModal();
        }, 2500);
    }
}

// ================= WINNERS & RESET =================
function showWinnersModal() {
    const modalBody = document.getElementById('winner-list-body');
    const modalPrizeName = document.getElementById('winner-modal-prize-name');
    
    modalPrizeName.innerText = currentPrizeName;
    modalBody.innerHTML = '';

    winners.forEach((w, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <th class="text-brand-yellow font-bold text-lg">#${index + 1}</th>
            <td class="text-xl font-bold text-white">${w}</td>
            <td class="text-xs text-gray-500">Winner</td>
        `;
        modalBody.appendChild(tr);
    });

    modal_winners.showModal();
}

function resetSystem() {
    if(confirm("Are you sure you want to reset the system?\nAll winner data will be deleted and the system starts from 0.")) {
        winners = [];
        manualSelection = []; 
        currentPrizeName = "";
        currentQuota = 0;

        document.getElementById('prize-name-display').innerText = "PRIZE HERE";
        document.getElementById('quota-display').innerText = "-";
        document.getElementById('display-name').innerText = "XXXXX";
        document.getElementById('display-name').classList.remove('spin-active');
        
        document.getElementById('prize-area').classList.add('opacity-0', 'translate-y-4');
        document.getElementById('quota-area').classList.add('opacity-0');

        document.getElementById('input-prize-name').value = "";
        document.getElementById('input-quota').value = "1";

        renderParticipants(); 
        
        modal_winners.close();
    }
}

// ================= UTILS =================
function createConfetti() {
    const colors = ['#facc15', '#7c3aed', '#ffffff'];
    for (let i = 0; i < 60; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti-piece');
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        confetti.style.width = (Math.random() * 10 + 5) + 'px';
        confetti.style.height = (Math.random() * 10 + 5) + 'px';
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            confetti.remove();
        }, 4000);
    }
}