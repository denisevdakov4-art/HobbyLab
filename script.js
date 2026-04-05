import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, updateDoc, doc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBIwN6d4QLauuhmKJKADvt_2pmxmSa4j3Y",
    authDomain: "hobbyapp-25e09.firebaseapp.com",
    projectId: "hobbyapp-25e09",
    storageBucket: "hobbyapp-25e09.firebasestorage.app",
    messagingSenderId: "379903732594",
    appId: "1:379903732594:web:6194284b4e85dd12ed8beb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const eventsCol = collection(db, "events");

let currentUser = "";
let map, markers = [], lastSelectedCoords = null;

// --- ФУНКЦИЯ УВЕДОМЛЕНИЙ ---
function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// --- ВХОД ---
document.getElementById('login-btn').addEventListener('click', () => {
    const name = document.getElementById('username').value.trim();
    if (name) {
        currentUser = name;
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'flex';
        initMap();
    } else {
        showToast("Введите ваше имя!");
    }
});

// --- КАРТА ---
function initMap() {
    if (map) return;
    map = L.map('map').setView([51.16, 71.47], 13); // Астана по умолчанию
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    map.locate({setView: true, maxZoom: 15});
    
    map.on('click', (e) => {
        lastSelectedCoords = e.latlng;
        L.popup().setLatLng(e.latlng).setContent("<b>Место выбрано!</b><br>Заполни форму ниже").openOn(map);
    });

    startRealtimeUpdates();
}

// --- КНОПКИ (Глобальные) ---
window.logout = () => location.reload();

window.addMarker = async () => {
    const name = document.getElementById('event-name').value;
    const time = document.getElementById('event-time').value;

    if (!lastSelectedCoords) return showToast("Сначала кликни на карту!");
    if (!name || !time) return showToast("Заполни все поля!");

    try {
        await addDoc(eventsCol, {
            name, date: time,
            coords: { lat: lastSelectedCoords.lat, lng: lastSelectedCoords.lng },
            participants: [currentUser]
        });
        document.getElementById('event-name').value = "";
        showToast("Событие создано!");
    } catch (e) {
        showToast("Ошибка базы данных");
    }
};

window.joinEvent = async (id) => {
    try {
        const eventRef = doc(db, "events", id);
        await updateDoc(eventRef, { participants: arrayUnion(currentUser) });
        showToast("Вы успешно записались!");
        map.closePopup();
    } catch (e) {
        showToast("Не удалось записаться");
    }
};

// --- ЖИВОЕ ОБНОВЛЕНИЕ ---
function startRealtimeUpdates() {
    onSnapshot(eventsCol, (snapshot) => {
        const container = document.getElementById('events-container');
        container.innerHTML = "<h3>События в твоем городе:</h3>";
        markers.forEach(m => map.removeLayer(m));
        markers = [];

        snapshot.forEach((docSnap) => {
            const ev = docSnap.data();
            const id = docSnap.id;
            const isJoined = ev.participants.includes(currentUser);

            const m = L.marker([ev.coords.lat, ev.coords.lng]).addTo(map)
                .bindPopup(`
                    <b>${ev.name}</b><br>${ev.date}<br>
                    <button class="popup-btn" ${isJoined ? 'disabled style="background:gray"' : ''} 
                    onclick="joinEvent('${id}')">
                        ${isJoined ? 'Вы идете ✅' : 'Записаться'}
                    </button>
                `);
            markers.push(m);

            const card = document.createElement('div');
            card.className = 'event-card';
            card.innerHTML = `
                <strong>${ev.name}</strong> — ${ev.date}<br>
                <small>Участники: ${ev.participants.join(', ')}</small><br>
                <button class="popup-btn" ${isJoined ? 'disabled style="background:gray"' : ''} 
                onclick="joinEvent('${id}')">${isJoined ? 'Вы записаны' : 'Записаться'}</button>
            `;
            container.appendChild(card);
        });
    });
}
