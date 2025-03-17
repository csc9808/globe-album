// Setup scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
camera.position.z = 10;

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
scene.background = new THREE.Color(0x231d2b);
scene.fog = new THREE.Fog(0x535ef3, 400, 2000);


// OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

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

// Resize handling
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// Even handling for Mouse movement, check if mouse is hovering.
function onMouseMove(event) {
    // Update mouse position based on the client position
    mouseHover.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouseHover.y = -(event.clientY / window.innerHeight) * 2 + 1;
    checkForHoverEffect(); // Move hover effect checking here
}
// Add the event listener to track mouse movement
window.addEventListener('mousemove', onMouseMove, false);

// Ranoming the color of the stars
function getRandomHexColor() {
    // Generate a random number between 0 and 255 for each RGB component
    let r = Math.floor(Math.random() * 256); // Red
    let g = Math.floor(Math.random() * 256); // Green
    let b = Math.floor(Math.random() * 256); // Blue
  
    // Convert each component to a 2-digit hexadecimal string and combine them
    let hexColor = "#" + 
                   r.toString(16).padStart(2, '0') +
                   g.toString(16).padStart(2, '0') +
                   b.toString(16).padStart(2, '0');
  
    return hexColor;
}

// Create a starry background
function createStars() {
    const starCount = 10000; // Number of stars
    const starsGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3); // x, y, z positions for each star
    const colors = new Float32Array(starCount * 3); // r, g, b colors for each star

    for (let i = 0; i < starCount; i++) {
        // Randomly position the stars in a large volume around the camera
        positions[i * 3] = Math.random() * 2000 - 1000;  // x position
        positions[i * 3 + 1] = Math.random() * 2000 - 1000;  // y position
        positions[i * 3 + 2] = Math.random() * 2000 - 1000;  // z position

        // Randomize the color for each star (convert hex to RGB)
        const color = getRandomHexColor();
        const r = parseInt(color.slice(1, 3), 16) / 255; // Red
        const g = parseInt(color.slice(3, 5), 16) / 255; // Green
        const b = parseInt(color.slice(5, 7), 16) / 255; // Blue

        // Set the color values in the colors array
        colors[i * 3] = r;  // Red
        colors[i * 3 + 1] = g;  // Green
        colors[i * 3 + 2] = b;  // Blue
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Create a points material (stars) with transparency
    const starsMaterial = new THREE.PointsMaterial({
        size: Math.random(),         // Size of each star
        vertexColors: true,          // Enable vertex colors
        transparent: true,           // To handle the opacity
        opacity: 3                   // Star opacity
    });

    // Create a points object (stars) and add it to the scene
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
}
createStars();

// function to create city markers on the globe.
function createCityMarker(cityName, lat, lon, radius = 5, color = 0xFFa500) {
    // Create the marker geometry (sphere)
    const markerGeometry = new THREE.SphereGeometry(0.05, 10, 10); // Marker size
    const markerMaterial = new THREE.MeshBasicMaterial({ color });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);

    // Store city info in the marker's userData
    marker.userData = { cityName, lat, lon, radius };

    // Position marker relative to the globe's center
    updateMarkerPosition(marker);

    // Add marker to the globe (as a child)
    globe.add(marker);

    // Create a canvas for the label texture
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = '30px Arial';
    context.fillStyle = 'white';
    context.fillText(cityName, 10, 30);

    // Create a texture from the canvas
    const labelTexture = new THREE.CanvasTexture(canvas);
    
    // Create the sprite material and sprite for the label
    const labelMaterial = new THREE.SpriteMaterial({ map: labelTexture });
    const labelSprite = new THREE.Sprite(labelMaterial);
    labelSprite.scale.set(1, 0.5, 1); // Scale the sprite (adjust size here)
    
    // Position the label sprite just above the marker
    labelSprite.position.set(0, 0.1, 0);

    // Add the sprite to the marker as a child
    marker.add(labelSprite);

    return marker;
}

// function to update the marker position based on lat, lon
function updateMarkerPosition(marker) {
    const { lat, lon, radius } = marker.userData;

    var latRad = lat * (Math.PI / 180);
    var lonRad = -lon * (Math.PI / 180);

    // Update marker position based on lat, lon
    marker.position.set(
        Math.cos(latRad) * Math.cos(lonRad) * radius,
        Math.sin(latRad) * radius,
        Math.cos(latRad) * Math.sin(lonRad) * radius
    );

    // Update label position in screen space
    if (marker.userData.label) {
        const vector = marker.position.clone();
        vector.applyMatrix4(globe.matrixWorld); // Apply globe rotation
        vector.project(camera); // Convert 3D to 2D screen space

        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (1 - (vector.y * 0.5 + 0.5)) * window.innerHeight;

        const distance = camera.position.distanceTo(marker.position);
        const labelOffset = 5 * (distance / camera.position.z);

        // Update label position
        marker.userData.label.style.display = 'block';
        marker.userData.label.style.left = `${x}px`;
        marker.userData.label.style.top = (y + labelOffset) + 'px';

        // Apply rotation to follow the globe
        const labelRotation = THREE.MathUtils.radToDeg(globe.rotation.y);
marker.userData.label.style.transform = `translate(-50%, -50%) rotate(${labelRotation}deg)`;
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

// function to show pop-up when marker is clicked for album
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
    // Create the container for the images
    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-container';
    // Images for the city
    const images = {
        'Los Angeles': ['assets/city_images/la1.jpg', 'assets/city_images/la2.jpg'],
        'San Diego': ['assets/city_images/sd1.jpg', 'assets/city_images/sd2.jpg'],
        'Miami': ['assets/city_images/miami1.jpg','assets/city_images/miami1.jpg','assets/city_images/miami1.jpg','assets/city_images/miami1.jpg','assets/city_images/miami1.jpg', 'assets/city_images/miami2.jpg'],
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
        imageContainer.appendChild(img);
    });
    popup.appendChild(imageContainer);
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
    // Automatically scroll the images slowly
    let scrollInterval = setInterval(() => {
        imageContainer.scrollTop += 1; // Scroll the images slowly
        if (imageContainer.scrollTop + imageContainer.clientHeight >= imageContainer.scrollHeight) {
            imageContainer.scrollTop = 0; // Reset when the end is reached
        }
    }, 50); // Change the interval for faster/slower scrolling
    // Allow the user to manually drag images as well
    imageContainer.addEventListener('mousedown', (e) => {
        let startY = e.clientY;
        let startScrollTop = imageContainer.scrollTop;
        const onMouseMove = (moveEvent) => {
            const deltaY = moveEvent.clientY - startY;
            imageContainer.scrollTop = startScrollTop - deltaY;
        };
        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    });
}

// specific hover effect on marker
function applyHoverEffect(marker) {
    const originalScale = marker.scale.clone();  // Save the marker's scale
    const hoverScale = 1.2; // Scaling for hover effect
    const hoverColor = new THREE.Color(0xFF8C00); // Hover color for the marker
    marker.userData.originalScale = originalScale;
    marker.userData.originalColor = marker.material.color.clone();
    marker.onmouseover = () => {
        marker.scale.set(hoverScale, hoverScale, hoverScale); // Enlarge the marker
        marker.material.color.set(hoverColor); // Change the marker's color
        // Optionally apply scale effect to the sprite (label) as well
        if (marker.children[0]) {  // If the label sprite exists
            marker.children[0].scale.set(1.2, 0.6, 1); // Enlarge the sprite label
        }
    };
    marker.onmouseout = () => {
        marker.scale.copy(marker.userData.originalScale); // Reset scale
        marker.material.color.set(marker.userData.originalColor); // Reset color
        // Reset sprite label scale
        if (marker.children[0]) {
            marker.children[0].scale.set(1, 0.5, 1); // Reset sprite scale
        }
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
            // Save the original color and scale if they are not already saved
            if (!hoveredMarker.userData.originalScale) {
                hoveredMarker.userData.originalScale = hoveredMarker.scale.clone(); // Save original scale
                hoveredMarker.userData.originalColor = hoveredMarker.material.color.clone(); // Save original color
            }

            // Apply hover effect directly instead of relying on events
            hoveredMarker.scale.set(1.2, 1.2, 1.2); // Increase size
            hoveredMarker.material.color.set(0xFF8C00); // Change color to orange

            // If there's a label (THREE.Sprite), modify its properties
            if (hoveredMarker.children[0]) {  // If the label sprite exists
                const labelSprite = hoveredMarker.children[0];
                labelSprite.scale.set(1.2, 0.6, 1); // Enlarge the sprite label
            }

            lastHoveredMarker = hoveredMarker;
        }
    } else {
        if (lastHoveredMarker) {
            resetHoverEffect(lastHoveredMarker); // Reset hover effect when mouse leaves all markers
            lastHoveredMarker = null;
        }
    }
}

// function to reset hover effect
function resetHoverEffect(marker) {
    // Check if originalScale and originalColor are defined in userData
    if (marker.userData.originalScale && marker.userData.originalColor) {
        // Reset scale and color to original
        marker.scale.copy(marker.userData.originalScale);
        marker.material.color.copy(marker.userData.originalColor); // Reset color

        // If there's a label (THREE.Sprite), reset its scaling
        if (marker.children[0]) {  // If the label sprite exists
            marker.children[0].scale.set(1, 0.5, 1); // Reset label sprite scale
        }
    }
}
// Animate function
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
            // Update marker position based on lat, lon
            updateMarkerPosition(marker);

            // Check visibility of marker and apply hover effects
            const markerDirection = marker.position.clone().sub(camera.position).normalize();
            const isFacingCamera = cameraDirection.dot(markerDirection) > 0;

            raycaster.set(camera.position, marker.position.clone().sub(camera.position).normalize());
            const intersects = raycaster.intersectObject(globe);
            const isBlocked = intersects.length > 0 && intersects[0].distance < camera.position.distanceTo(marker.position);

            if (isFacingCamera && !isBlocked) {
                // Project marker's 3D position to 2D screen space
                const vector = marker.position.clone();
                vector.project(camera);

                const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
                const y = (1 - (vector.y * 0.5 + 0.5)) * window.innerHeight;

                const distance = camera.position.distanceTo(marker.position);
                const labelOffset = 5 * (distance / camera.position.z);

                // Show the label and position it
                marker.userData.label.style.display = 'block';
                marker.userData.label.style.left = `${x}px`;
                marker.userData.label.style.top = `${y + labelOffset}px`;

                // Apply only Y-axis rotation to the label to prevent vertical tilting
                const labelRotation = new THREE.Euler(0, marker.rotation.y, 0);
                marker.userData.label.style.transform = `translate(-50%, -50%) translateY(${labelOffset + 20}px)`;


                // Perform hover detection and apply effects
                checkForHoverEffect();
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