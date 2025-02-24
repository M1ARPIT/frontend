// FINAL FIX: Rock Paper Scissors - Sci-Fi Theme with Enhanced End Popup

document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 DOM Fully Loaded!");
});


const socket = new WebSocket("ws://localhost:8080");

let playerRole = null;
let playerScore = 0;
let opponentScore = 0;
let isAIMode = false;
let roundCount = 0;

socket.onopen = () => console.log("✅ WebSocket Connected!");
socket.onerror = (error) => console.error("❌ WebSocket Error:", error);
socket.onclose = () => console.warn("⚠️ Connection lost!");

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log("📩 Message from server:", data);

    if (data.type === "MATCH_FOUND") {
        hideLoadingPopup();
        playerRole = data.player;
        isAIMode = false;
        roundCount = 0;
        startGame();
        showRoundPopup(`Round 1 Started`);
        sounds.roundStart.play();
    }

    if (data.type === "ROOM_CREATED") {
        showPopup(`🏠 Room Created! Share this Room ID: ${data.roomId}`, data.roomId);
    }

    if (data.type === "ROUND_RESULT") {
        console.log(`✅ ROUND RESULT -> You: ${data.p1Move}, Opponent: ${data.p2Move}`);
        document.getElementById("your-move").innerText = `You chose: ${data.p1Move}`;
        document.getElementById("opponent-move").innerText = `Opponent chose: ${data.p2Move}`;
        updateScore(data.winner);
        roundCount++;
        
        const resultMessage = data.winner === playerRole ? `You Won Round ${roundCount}!` : 
                             data.winner === "draw" ? `Round ${roundCount}: Draw!` : `Opponent Won Round ${roundCount}!`;
        showRoundResultPopup(resultMessage);
        sounds.roundEnd.play();

        if (roundCount < 3) {
            setTimeout(() => {
                showRoundPopup(`Round ${roundCount + 1} Started`);
                sounds.roundStart.play();
            }, 1500);
        }
    }

    if (data.type === "GAME_OVER") {
        const resultMessage = data.winner === playerRole ? "🎉 You Won!" : data.winner === "draw" ? "🤝 It's a Draw!" : "💀 You Lost!";
        showEndPopup(resultMessage);
        if (data.winner === playerRole) sounds.win.play();
        else if (data.winner === "draw") sounds.draw.play();
        else sounds.lose.play();
    }

    if (data.type === "PLAYER_LEFT") {
        showEndPopup("⚠️ Opponent Disconnected!");
        sounds.disconnect.play();
        resetGame();
    }
};
function loadSound(url) {
    const audio = new Audio(url);
    console.log(`Loading sound: ${url}`);
    audio.preload = "auto";
    audio.onerror = () => console.warn(`⚠️ Failed to load sound: ${url}`);
    audio.onloadeddata = () => console.log(`✅ Sound loaded: ${url}`);
    audio.load();
    return audio;
}

const sounds = {
    roundStart: loadSound("sound/roundstart.mp3"),
    roundEnd: loadSound("sound/roundend.mp3"),
    moveSelect: loadSound("sound/movu.mp3"),
    win: loadSound("sound/winner.mp3"),
    lose: loadSound("sound/losser.mp3"),
    draw: loadSound("sound/moves.mp3"),
    disconnect: loadSound("sound/dissconnect.mp3")
};
Object.values(sounds).forEach(sound => {
    sound.preload = "auto";
});

function updateScore(winner) {
    if (winner === "reset") {
        playerScore = 0;
        opponentScore = 0;
    } else if (winner === playerRole) {
        playerScore++;
    } else if (winner !== "draw") {
        opponentScore++;
    }
    
    document.getElementById("score").innerText = `You: ${playerScore} | Opponent: ${opponentScore}`;
}

function sendMove(move) {
    console.log(`📤 Move Sent -> ${move}`);
    sounds.moveSelect.play();
    if (isAIMode) {
        playWithAI(move);
    } else {
        socket.send(JSON.stringify({ type: "MOVE", move }));
    }
}

function startGame() {
    document.getElementById("menu").classList.add("hidden");
    document.getElementById("game").classList.remove("hidden");
}

function resetGame() {
    playerScore = 0;
    opponentScore = 0;
    roundCount = 0;
    document.getElementById("score").innerText = `You: 0 | Opponent: 0`;
}

window.startFriendGame = () => socket.send(JSON.stringify({ type: "CREATE_ROOM" }));
window.joinFriendGame = () => {
    const roomId = prompt("Enter Room ID:");
    if (roomId) socket.send(JSON.stringify({ type: "JOIN_ROOM", roomId }));
};
window.findStranger = () => {
    showLoadingPopup("🔍 Finding a Stranger...");
    socket.send(JSON.stringify({ type: "FIND_STRANGER" }));
};

// **Loading Popup Functions**
function showLoadingPopup(message) {
    const existingPopup = document.getElementById("loadingPopup");
    if (existingPopup) existingPopup.remove();

    const popup = document.createElement("div");
    popup.id = "loadingPopup";
    popup.className = "popup-overlay";
    popup.innerHTML = `
        <div class="popup">
            <h2>${message}</h2>
            <p>⌛ Please wait...</p>
            <div class="spinner"></div>
        </div>
    `;
    document.body.appendChild(popup);
}

function hideLoadingPopup() {
    const popup = document.getElementById("loadingPopup");
    if (popup) popup.remove();
}

// **Round Start Popup**
function showRoundPopup(message) {
    const existingPopup = document.getElementById("roundPopup");
    if (existingPopup) existingPopup.remove();

    const popup = document.createElement("div");
    popup.id = "roundPopup";
    popup.className = "popup-overlay round-popup";
    popup.innerHTML = `
        <div class="popup">
            <h2>${message}</h2>
        </div>
    `;
    document.body.appendChild(popup);

    setTimeout(() => {
        const popupToRemove = document.getElementById("roundPopup");
        if (popupToRemove) popupToRemove.remove();
    }, 1500);
}

// **Round Result Popup**
function showRoundResultPopup(message) {
    const existingPopup = document.getElementById("roundResultPopup");
    if (existingPopup) existingPopup.remove();

    const popup = document.createElement("div");
    popup.id = "roundResultPopup";
    popup.className = "popup-overlay round-popup";
    popup.innerHTML = `
        <div class="popup">
            <h2>${message}</h2>
        </div>
    `;
    document.body.appendChild(popup);

    setTimeout(() => {
        const popupToRemove = document.getElementById("roundResultPopup");
        if (popupToRemove) popupToRemove.remove();
    }, 1500);
}

// AI Game Mode with 3 Rounds
window.startAIGame = () => {
    console.log("🤖 Starting AI Game...");
    isAIMode = true;
    playerScore = 0;
    opponentScore = 0;
    roundCount = 0;

    console.log("🔄 Resetting Scores...");
    updateScore("reset");
    startGame();
    showRoundPopup("Round 1 Started");
    sounds.roundStart.play();
};

function playWithAI(playerMove) {
    let moves = ["rock", "paper", "scissors"];
    let aiMove = moves[Math.floor(Math.random() * moves.length)];

    console.log(`🤖 AI Move -> ${aiMove}`);
    console.log(`🆚 You: ${playerMove} | AI: ${aiMove}`);

    document.getElementById("your-move").innerText = `You chose: ${playerMove}`;
    document.getElementById("opponent-move").innerText = `AI chose: ${aiMove}`;

    let winner = decideWinner(playerMove, aiMove);
    updateScore(winner);
    roundCount++;

    const resultMessage = winner === "player" ? `You Won Round ${roundCount}!` : 
                         winner === "draw" ? `Round ${roundCount}: Draw!` : `AI Won Round ${roundCount}!`;
    showRoundResultPopup(resultMessage);
    sounds.roundEnd.play();

    if (roundCount < 3) {
        setTimeout(() => {
            showRoundPopup(`Round ${roundCount + 1} Started`);
            sounds.roundStart.play();
        }, 1500);
    }

    if (roundCount >= 3) {
        const resultMessage = playerScore > opponentScore ? "🎉 You Won!" : playerScore === opponentScore ? "🤝 It's a Draw!" : "💀 You Lost!";
        showEndPopup(resultMessage);
        if (playerScore > opponentScore) sounds.win.play();
        else if (playerScore === opponentScore) sounds.draw.play();
        else sounds.lose.play();
    }
}

function decideWinner(playerMove, aiMove) {
    if (playerMove === aiMove) return "draw";
    if ((playerMove === "rock" && aiMove === "scissors") ||
        (playerMove === "paper" && aiMove === "rock") ||
        (playerMove === "scissors" && aiMove === "paper")) {
        return "player";
    } else {
        return "ai";
    }
}

function showPopup(message, roomId) {
    const existingPopup = document.getElementById("roomPopup");
    if (existingPopup) existingPopup.remove();

    const popup = document.createElement("div");
    popup.id = "roomPopup";
    popup.className = "popup-container";
    popup.innerHTML = `
        <h2>🏠 Room Created! Here's your room "ID"</h2>
        <p class="room-id">Room ID: <span id="room-id-text">${roomId}</span></p>
        <div class="popup-buttons">
            <button class="copy-btn" onclick="copyRoomID('${roomId}')">📋 Copy</button>
            <button class="close-btn" onclick="closePopup()">❌ Close</button>
        </div>
    `;
    document.body.appendChild(popup);
}

function copyRoomID(roomId) {
    let text = document.getElementById("room-id-text").textContent.trim();
    let extractedRoomId = text.split(": ").pop();
    
    navigator.clipboard.writeText(extractedRoomId).then(() => {
        console.log(`✅ Room ID copied: ${extractedRoomId}`);
    }).catch(err => {
        alert("❌ Copy Failed!");
        console.error(err);
    });
}

function closePopup() {
    const popup = document.getElementById("roomPopup");
    if (popup) popup.remove();
}

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        closePopup();
    }
});

// **Enhanced Sci-Fi End Popup**
function showEndPopup(message) {
    const existingPopup = document.getElementById("endPopup");
    if (existingPopup) existingPopup.remove();

    const popup = document.createElement("div");
    popup.id = "endPopup";
    popup.className = "popup-overlay end-popup fade-in";
    
    let extraClass = "";
    let scoreText = `Final Score - You: ${playerScore} | ${isAIMode ? "AI" : "Opponent"}: ${opponentScore}`;
    if (message.includes("Won")) extraClass = "win";
    else if (message.includes("Lost")) extraClass = "lose";
    else if (message.includes("Draw")) extraClass = "draw";
    else extraClass = "disconnect";

    popup.innerHTML = `
        <div class="popup ${extraClass}">
            <h2>${message}</h2>
            <p>${scoreText}</p>
            <div class="popup-buttons">
                <button class="menu-btn" onclick="goToMenu()">🏠 Main Menu</button>
                <button class="menu-btn" onclick="retryGame()">🔄 Retry</button>
            </div>
        </div>
    `;
    document.body.appendChild(popup);
}

window.goToMenu = () => {
    document.querySelector(".end-popup").remove();
    resetGame();
    document.getElementById("game").classList.add("hidden");
    document.getElementById("menu").classList.remove("hidden");
};

window.retryGame = () => {
    document.querySelector(".end-popup").remove();
    resetGame();
    startGame();
    if (isAIMode) {
        showRoundPopup("Round 1 Started");
        sounds.roundStart.play();
    }
};

console.log("🛠️");