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
const raycasterHover = new THREE.Raycaster();
let mouseHover = new THREE.Vector2();
scene.add(globe);

// Lighting
const light = new THREE.AmbientLight(0xbbbbbb, 2);
scene.add(light);
scene.background = new THREE.Color(0x000d21);
scene.fog = new THREE.Fog(0x535ef3, 400, 2000);

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
function onMouseMove(event) {
    // Update mouse position based on the client position
    mouseHover.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouseHover.y = -(event.clientY / window.innerHeight) * 2 + 1;
    checkForHoverEffect(); // Move hover effect checking here
}
// Add the event listener to track mouse movement
window.addEventListener('mousemove', onMouseMove, false);
// Function to create city markers
function createCityMarker(cityName, lat, lon, radius = 5, color = 0xFFa500) {
    const markerGeometry = new THREE.SphereGeometry(0.05, 10, 10); // Marker size
    const markerMaterial = new THREE.MeshBasicMaterial({ color });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);

    // Store lat, lon, radius, and city name in userData
    marker.userData = { cityName, lat, lon, radius };

    // Position marker relative to the globe's center
    updateMarkerPosition(marker);

    // Add marker to the globe (as its child)
    globe.add(marker);
    // Create an HTML label
    const label = document.createElement('div');
    label.className = 'city-label';
    label.textContent = cityName;
    document.body.appendChild(label);

    // Store the label reference
    marker.userData.label = label;

    // Apply hover effect
    applyHoverEffect(marker);

    return marker;
}

// Update marker position and apply label rotation
function updateMarkerPosition(marker) {
    const { cityName, lat, lon, radius } = marker.userData;

    // Ensure lat is between -90 and 90, and lon is between -180 and 180
    var latRad = lat * (Math.PI / 180);
    var lonRad = -lon * (Math.PI / 180);

    // Set position of marker in 3D space using spherical coordinates
    marker.position.set(
        Math.cos(latRad) * Math.cos(lonRad) * radius,
        Math.sin(latRad) * radius,
        Math.cos(latRad) * Math.sin(lonRad) * radius
    );
    marker.rotation.set(0.0, -lonRad, latRad - Math.PI * 0.5);

    // Adjust label's position to be at the bottom of the marker
    if (marker.userData.label) {
        // Adjust label position with a small offset along the y-axis (or z-axis if needed)
        const labelOffset = 15;  // Adjust this value for more or less space
        marker.userData.label.style.transform = `translate(-50%, -50%) translateY(${labelOffset}px)`;

        // Apply rotation to the label to make it rotate with the marker
        const labelRotation = new THREE.Euler(0, marker.rotation.y, 0);
        marker.userData.label.style.transform += ` rotate(${THREE.MathUtils.radToDeg(labelRotation.y)}deg)`;
    }
}

// Create markers for cities with city names included in the data
const cities = {
    'New York': createCityMarker('New York', 40.7128, -74.0060),
    'Los Angeles': createCityMarker('Los Angeles', 34.0522, -118.2437), 
    'San Diego': createCityMarker('San Diego', 32.7157, -117.1611), 
    'Miami': createCityMarker('Miami', 25.7617, -80.1918), 
    'Washington DC': createCityMarker('Washington DC', 38.9072, -77.0369), 
    'Toronto': createCityMarker('Toronto', 43.651070, -79.347015), 
    'Nashville': createCityMarker('Nashville', 36.1627, -86.7816), 
    'Grand Rapids': createCityMarker('Grand Rapids', 42.9634, -85.6681), 
    'Osaka': createCityMarker('Osaka', 34.6937, 135.5023), 
    'Seoul': createCityMarker('Seoul', 37.5665, 126.9780), 
    'Semarang': createCityMarker('Semarang', -6.9667, 110.4167), 
    'Bali': createCityMarker('Bali', -8.3405, 115.0920), 
};
// Variable to store the last hovered marker
let lastHoveredMarker = null;
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
                isPopupOpen = true; // Popup is open, stop rotation
            }
        }
    }
});

// Modify your popup logic to stop/resume the globe rotation
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

    // Images for the city
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

        // Smoothly return camera to default position
        new TWEEN.Tween(camera.position)
            .to({ x: 0, y: 0, z: 10 }, 1000)
            .easing(TWEEN.Easing.Quadratic.Out)
            .start();

        setTimeout(() => {
            document.body.removeChild(popup);
            resumeGlobeRotation(); // Resume globe rotation when popup is closed
        }, 300);

        isPopupOpen = false; // Popup closed, restart rotation
    };
    popup.appendChild(closeButton);

    document.body.appendChild(popup);

    // Fade-in Effect
    setTimeout(() => popup.style.opacity = '1', 10);

    // Smoothly move camera closer to the city
    const targetPosition = new THREE.Vector3(
        cities[city].position.x * 1.5,
        cities[city].position.y * 1.5,
        cities[city].position.z * 1.5
    );

    new TWEEN.Tween(camera.position)
        .to(targetPosition, 1000) // 1 second animation
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();

    // Make Popup Draggable
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

    stopGlobeRotation(); // Stop globe rotation when popup opens
}

function applyHoverEffect(marker) {
    // Store the original scale and color in userData to revert back when mouse leaves
    const originalScale = marker.scale.clone();
    const originalColor = marker.material.color.clone();  // Store the original color in userData

    marker.userData.originalScale = originalScale;
    marker.userData.originalColor = originalColor;

    const hoverScale = 1.2; // 20% larger
    const hoverColor = new THREE.Color(0xFF8C00); // Darker orange color

    marker.onmouseover = () => {
        marker.scale.set(hoverScale, hoverScale, hoverScale); // Change size
        marker.material.color.set(hoverColor); // Change color
        marker.userData.label.style.fontWeight = 'bold'; // Bold the label text
    };

    marker.onmouseout = () => {
        marker.scale.copy(marker.userData.originalScale); // Reset size from userData
        marker.material.color.set(marker.userData.originalColor); // Reset color from userData
        marker.userData.label.style.fontWeight = 'normal'; // Revert label text to normal
    };
}


function checkForHoverEffect() {
    raycasterHover.setFromCamera(mouseHover, camera);
    const intersectsHover = raycasterHover.intersectObjects(globe.children);

    if (intersectsHover.length > 0) {
        const hoveredMarker = intersectsHover[0].object;

        if (lastHoveredMarker !== hoveredMarker) {
            if (lastHoveredMarker) {
                resetHoverEffect(lastHoveredMarker); // Reset previous marker hover effect
            }

            // Apply hover effect directly instead of relying on events
            hoveredMarker.scale.set(1.2, 1.2, 1.2); // Increase size
            hoveredMarker.material.color.set(0xFF8C00); // Change color to orange
            hoveredMarker.userData.label.style.fontWeight = 'bold'; // Bold the label

            lastHoveredMarker = hoveredMarker;
        }
    } else {
        if (lastHoveredMarker) {
            resetHoverEffect(lastHoveredMarker); // Reset hover effect when mouse leaves all markers
            lastHoveredMarker = null;
        }
    }
}


function resetHoverEffect(marker) {
    if (marker.userData.originalScale && marker.userData.originalColor) {
        marker.scale.copy(marker.userData.originalScale); // Reset size
        marker.material.color.set(marker.userData.originalColor); // Reset color
        marker.userData.label.style.fontWeight = 'normal'; // Revert label text to normal
    }
}


const cameraDirection = new THREE.Vector3();
// Animate function updated to include hover checking logic
let isPopupOpen = false; // Flag to control popup state

// Function to stop and resume the globe rotation
function stopGlobeRotation() {
    isPopupOpen = true;  // Popup is open, stop rotation
}

function resumeGlobeRotation() {
    isPopupOpen = false; // Popup closed, restart rotation
}

// Modify the animate function to check if the popup is open
function animate() {
    requestAnimationFrame(animate);
    TWEEN.update(); // This is crucial for the animations to run

    if (!isPopupOpen) {
        globe.rotation.y += 0.001; // Rotate around the Y-axis (slow spin)
    }

    // Camera direction for visibility check
    camera.getWorldDirection(cameraDirection);

    // Update the marker's positions and check for hover effects
    globe.children.forEach(marker => {
        if (marker instanceof THREE.Mesh && marker.userData.label) {
            updateMarkerPosition(marker);  // Update marker position based on lat, lon

            // Check visibility of marker and apply hover effects
            const markerDirection = marker.position.clone().sub(camera.position).normalize();
            const isFacingCamera = cameraDirection.dot(markerDirection) > 0;

            raycaster.set(camera.position, marker.position.clone().sub(camera.position).normalize());
            const intersects = raycaster.intersectObject(globe);
            const isBlocked = intersects.length > 0 && intersects[0].distance < camera.position.distanceTo(marker.position);

            if (isFacingCamera && !isBlocked) {
                const vector = marker.position.clone();
                vector.project(camera);

                const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
                const y = (1 - (vector.y * 0.5 + 0.5)) * window.innerHeight;

                const distance = camera.position.distanceTo(marker.position);
                const labelOffset = 5 * (distance / camera.position.z);

                marker.userData.label.style.display = 'block';
                marker.userData.label.style.left = `${x}px`;
                marker.userData.label.style.top = `${y + labelOffset}px`;

                marker.userData.label.style.transform = `translate(-50%, -50%) translateY(${labelOffset + 20}px)`;

                checkForHoverEffect(); // Perform hover detection and apply the effect
            } else {
                marker.userData.label.style.display = 'none'; // Hide label if behind camera
            }
        }
    });

    controls.update();
    renderer.render(scene, camera);
}

// Start the animation loop
animate();
