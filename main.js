// Setup scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Load the world texture
const textureLoader = new THREE.TextureLoader();
const globeTexture = textureLoader.load('assets/world_map.jpg');

// Create globe
const globeGeometry = new THREE.SphereGeometry(5, 64, 64);
const globeMaterial = new THREE.MeshStandardMaterial({ map: globeTexture });
const globe = new THREE.Mesh(globeGeometry, globeMaterial);

scene.add(globe);

// Lighting
const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);

// Camera position
camera.position.z = 10;

// OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Resize handling
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// Function to create city markers
function createCityMarker(cityName, lat, lon, radius = 5, color = 0xff0000) {
    const markerGeometry = new THREE.SphereGeometry(0.1, 8, 8); // Marker size
    const markerMaterial = new THREE.MeshBasicMaterial({ color });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);

    // Store lat, lon, radius, and city name in userData
    marker.userData = { cityName, lat, lon, radius };

    // Position marker relative to the globe's center
    updateMarkerPosition(marker);

    // Add marker to the globe (as its child)
    globe.add(marker);

    return marker;
}

// Function to update marker position based on lat, lon, radius
function updateMarkerPosition(marker) {
    const { cityName, lat, lon, radius } = marker.userData;

    // Ensure lat is between -90 and 90, and lon is between -180 and 180
    const phi = ((90-lat)/180) * Math.PI;  // Latitude (phi)
    const theta = ((lon + 180)/360) * 2 * Math.PI;  // Longitude (theta)

    
    // Set position of marker in 3D space using spherical coordinates
    marker.position.set(
        radius * Math.sin(phi) * Math.cos(theta), // X
        radius * Math.cos(phi),                   // Y
        radius * Math.sin(phi) * Math.sin(theta)  // Z
    );
}

// Create markers for cities with city names included in the data
const cities = {
    'New York': createCityMarker('New York', 40.7128, -74.0060), // Orange
    'Los Angeles': createCityMarker('Los Angeles', 34.0522, -118.2437), // Yellow
    'San Diego': createCityMarker('San Diego', 32.7157, -117.1611), // Yellow
    'Miami': createCityMarker('Miami', 25.7617, -80.1918), // Green
    'Washington DC': createCityMarker('Washington DC', 38.9072, -77.0369), // Green
    'Toronto': createCityMarker('Toronto', 43.651070, -79.347015), // Blue
    'Nashville': createCityMarker('Nashville', 36.1627, -86.7816), // Purple
    'Grand Rapids': createCityMarker('Grand Rapids', 42.9634, -85.6681), // Purple
    'Osaka': createCityMarker('Osaka', 34.6937, 135.5023), // Pink
    'Seoul': createCityMarker('Seoul', 37.5665, 126.9780), // Pink
    'Semarang': createCityMarker('Semarang', -6.9667, 110.4167), // Cyan
    'Bali': createCityMarker('Bali', -8.3405, 115.0920), // Cyan
};

// Raycasting for detecting clicks
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Collect all objects in the scene (including globe and markers)
    const intersects = raycaster.intersectObjects([globe, ...globe.children]);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        for (let city in cities) {
            if (cities[city] === clickedObject) {
                showPopup(city);
            }
        }
    }
});

function showPopup(city) {
    const existingPopup = document.querySelector('.popup');
    if (existingPopup) {
        document.body.removeChild(existingPopup);
    }

    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.style.opacity = '0'; // Start hidden for fade-in effect

    // Title
    const title = document.createElement('h2');
    title.textContent = city;
    popup.appendChild(title);

    const images = {
        'New York': ['assets/city_images/ny1.jpg', 'assets/city_images/ny2.jpg'],
        'Los Angeles': ['assets/city_images/la1.jpg', 'assets/city_images/la2.jpg'],
        'San Diego': ['assets/city_images/sd1.jpg', 'assets/city_images/sd2.jpg'],
        'Miami': ['assets/city_images/miami1.jpg', 'assets/city_images/miami2.jpg'],
        'Washington DC': ['assets/city_images/dc1.jpg', 'assets/city_images/dc2.jpg'],
        'Toronto': ['assets/city_images/toronto1.jpg', 'assets/city_images/toronto2.jpg'],
        'Nashville': ['assets/city_images/nash1.jpg', 'assets/city_images/nash2.jpg'],
        'Grand Rapids': ['assets/city_images/gr1.jpg', 'assets/city_images/gr2.jpg'],
        'Osaka': ['assets/city_images/osaka1.jpg', 'assets/city_images/osaka2.jpg'],
        'Seoul': ['assets/city_images/seoul1.jpg', 'assets/city_images/seoul2.jpg'],
        'Semarang': ['assets/city_images/semarang1.jpg', 'assets/city_images/semarang2.jpg'],
        'Bali': ['assets/city_images/bali1.jpg', 'assets/city_images/bali2.jpg'],
    };

    images[city].forEach(imgSrc => {
        const img = document.createElement('img');
        img.src = imgSrc;
        popup.appendChild(img);
    });

    // Close Button
    const closeButton = document.createElement('button');
    closeButton.className = 'close-btn';
    closeButton.textContent = 'Close';
    closeButton.onclick = () => {
        popup.style.opacity = '0';
        
        // **Smoothly return camera to default position**
        new TWEEN.Tween(camera.position)
            .to({ x: 0, y: 0, z: 10 }, 1000)
            .easing(TWEEN.Easing.Quadratic.Out)
            .start();

        setTimeout(() => document.body.removeChild(popup), 300);
    };
    popup.appendChild(closeButton);

    document.body.appendChild(popup);

    // **Fade-in Effect**
    setTimeout(() => popup.style.opacity = '1', 10);

    // **Smoothly move camera closer to the city**
    const targetPosition = new THREE.Vector3(
        cities[city].position.x * 1.5,
        cities[city].position.y * 1.5,
        cities[city].position.z * 1.5
    );

    new TWEEN.Tween(camera.position)
        .to(targetPosition, 1000) // 1 second animation
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();

    // **Make Popup Draggable**
    let isDragging = false, offsetX, offsetY;

    popup.addEventListener('mousedown', (event) => {
        isDragging = true;
        offsetX = event.clientX - popup.offsetLeft;
        offsetY = event.clientY - popup.offsetTop;
        popup.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (event) => {
        if (isDragging) {
            popup.style.left = `${event.clientX - offsetX}px`;
            popup.style.top = `${event.clientY - offsetY}px`;
        }
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
        popup.style.cursor = 'grab';
    });
}

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    // Update globe rotation (spinning effect)
    //globe.rotation.y += 0.002; // Adjust speed of rotation

    // Update marker positions relative to the globe's rotation
    globe.children.forEach(marker => {
        if (marker instanceof THREE.Mesh) {
            updateMarkerPosition(marker);
        }
    });

    // Update controls (for OrbitControls)
    controls.update();

    // Render the scene
    renderer.render(scene, camera);
}

// Start the animation loop
animate();
