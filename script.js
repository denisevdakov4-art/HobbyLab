let map;
let lastClickedCoords = null;

// Функция входа
function login() {
    const name = document.getElementById('username').value;
    if (name) {
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        initMap(); // Запускаем карту
    } else {
        alert("Введите имя!");
    }
}

// Инициализация карты
function initMap() {
    if (!map) {
        map = L.map('map').setView([51.16, 71.44], 13); // Координаты города
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

        map.on('click', function(e) {
            lastClickedCoords = e.latlng;
            alert("Место выбрано! Теперь введите название события снизу.");
        });
    }
}

// Добавление метки
function addMarker() {
    const name = document.getElementById('event-name').value;
    const time = document.getElementById('event-time').value;

    if (lastClickedCoords && name) {
        L.marker(lastClickedCoords).addTo(map)
            .bindPopup(`<b>${name}</b><br>Время: ${time}`)
            .openPopup();
    } else {
        alert("Сначала кликните на карту и введите название!");
    }
}