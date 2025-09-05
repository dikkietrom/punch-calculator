// Punch Calculator - Grid Layout with Arm Parameters

console.log('Punch Calculator loaded!');

// Application state
const state = {
    // Rotation speeds (degrees/second) - proper kinetic chain
    hipRotation: 45,        // Hip rotation - starts the chain
    spineSpring: 45,        // Spine spring constant - elastic response to hip
    shoulderRotation: 180,  // Shoulder rotation - independent shoulder movement
    elbowRotation: 270,     // Elbow rotation - final link
    // Initial bone angles (degrees)
    hipInitialAngle: 0,     // Hip initial position
    spineInitialAngle: 0,   // Spine initial position
    collarInitialAngle: 0,  // Collar bone initial position
    shoulderInitialAngle: 0, // Shoulder initial position
    elbowInitialAngle: 0,   // Elbow initial position
    // Arm lengths (centimeters - 1 pixel = 1 cm for display)
    hipLength: 20,          // 20 cm hip width
    collarLength: 20,       // 20 cm collar bone width
    upperArmLength: 35,     // 35 cm  
    forearmLength: 30,      // 30 cm
    // View settings
    currentView: 'top',     // 'top', 'front', 'side'
    // Animation
    isPlaying: false,
    time: 0,
    // Current instantaneous angles (degrees) used when not animating
    hipAngleDeg: 0,
    shoulderAngleDeg: 0,
    elbowAngleDeg: 0,
    // Punch type
    selectedPunch: 'jab',
    // Canvas and animation
    canvas: null,
    ctx: null,
    animationId: null,
    // Zoom and view
    zoom: 1.0,
    minZoom: 0.2,
    maxZoom: 5.0,
    // Scale: pixels per centimeter (4px = 1cm makes everything much bigger)
    pixelsPerCm: 4
};

// Punch presets - different rotation patterns for each punch type
const punchPresets = {
    jab: {
        name: 'Jab',
        hipRotation: 20,
        spineSpring: 30,
        shoulderRotation: 150,
        elbowRotation: 200
    },
    cross: {
        name: 'Cross',
        hipRotation: 40,
        spineSpring: 50,
        shoulderRotation: 200,
        elbowRotation: 300
    },
    hook: {
        name: 'Hook',
        hipRotation: 60,
        spineSpring: 80,
        shoulderRotation: 180,
        elbowRotation: 150
    },
    uppercut: {
        name: 'Uppercut',
        hipRotation: 50,
        spineSpring: 70,
        shoulderRotation: 220,
        elbowRotation: 280
    }
};

// Store slider references for updating
const sliders = {};

function createElement(tag, className = '', textContent = '') {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (textContent) el.textContent = textContent;
    return el;
}

function createSlider(label, value, min, max, step, onchange, sliderId = null) {
    const item = createElement('div', 'param-item');
    
    const labelEl = createElement('label', 'param-label', label);
    const controlDiv = createElement('div', 'param-control');
    
    const slider = createElement('input', 'param-slider');
    slider.type = 'range';
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = value;
    
    const valueDisplay = createElement('span', 'param-value', value);
    
    slider.addEventListener('input', (e) => {
        const newValue = parseFloat(e.target.value);
        valueDisplay.textContent = newValue;
        onchange(newValue);
    });
    
    // Store slider reference if ID provided
    if (sliderId) {
        sliders[sliderId] = { slider, valueDisplay };
    }
    
    controlDiv.appendChild(slider);
    controlDiv.appendChild(valueDisplay);
    item.appendChild(labelEl);
    item.appendChild(controlDiv);
    
    return item;
}

function updateSliderValues() {
    // Update hip rotation slider
    if (sliders.hipRotation) {
        sliders.hipRotation.slider.value = state.hipRotation;
        sliders.hipRotation.valueDisplay.textContent = state.hipRotation;
    }
    
    // Update spine spring slider
    if (sliders.spineSpring) {
        sliders.spineSpring.slider.value = state.spineSpring;
        sliders.spineSpring.valueDisplay.textContent = state.spineSpring;
    }
    
    // Update shoulder rotation slider
    if (sliders.shoulderRotation) {
        sliders.shoulderRotation.slider.value = state.shoulderRotation;
        sliders.shoulderRotation.valueDisplay.textContent = state.shoulderRotation;
    }
    
    // Update elbow rotation slider
    if (sliders.elbowRotation) {
        sliders.elbowRotation.slider.value = state.elbowRotation;
        sliders.elbowRotation.valueDisplay.textContent = state.elbowRotation;
    }

    if (sliders.hipInitial) {
        sliders.hipInitial.slider.value = state.hipInitialAngle || 0;
        sliders.hipInitial.valueDisplay.textContent = state.hipInitialAngle || 0;
    }

    if (sliders.shoulderInitial) {
        sliders.shoulderInitial.slider.value = state.shoulderInitialAngle || 0;
        sliders.shoulderInitial.valueDisplay.textContent = state.shoulderInitialAngle || 0;
    }

    if (sliders.elbowInitial) {
        sliders.elbowInitial.slider.value = state.elbowInitialAngle || 0;
        sliders.elbowInitial.valueDisplay.textContent = state.elbowInitialAngle || 0;
    }
}

// Drawing functions
function drawHip(ctx, centerX, centerY, angle, length) {
    const halfLength = length / 2;
    
    // Calculate hip endpoints (rotates around center)
    const startX = centerX - Math.cos(angle) * halfLength;
    const startY = centerY - Math.sin(angle) * halfLength;
    const endX = centerX + Math.cos(angle) * halfLength;
    const endY = centerY + Math.sin(angle) * halfLength;
    
    // Draw hip bones
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    // Draw hip center point
    ctx.fillStyle = '#7c3aed';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI);
    ctx.fill();
    
    return { startX, startY, endX, endY, centerX, centerY };
}

function drawCollarBones(ctx, centerX, centerY, angle, length) {
    const halfLength = length / 2;
    
    // Calculate collar bone endpoints (rotates around center - spine)
    const startX = centerX - Math.cos(angle) * halfLength;
    const startY = centerY - Math.sin(angle) * halfLength;
    const endX = centerX + Math.cos(angle) * halfLength;
    const endY = centerY + Math.sin(angle) * halfLength;
    
    // Draw collar bones
    ctx.strokeStyle = '#4a9eff';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    // Draw spine center point
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw shoulder connection points
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(startX, startY, 2, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(endX, endY, 2, 0, 2 * Math.PI);
    ctx.fill();
    
    return { startX, startY, endX, endY, centerX, centerY };
}

function drawUpperArm(ctx, shoulderX, shoulderY, angle, length) {
    // Calculate upper arm end point
    const elbowX = shoulderX + Math.cos(angle) * length;
    const elbowY = shoulderY + Math.sin(angle) * length;
    
    // Draw upper arm
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(elbowX, elbowY);
    ctx.stroke();
    
    // Draw shoulder joint
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(shoulderX, shoulderY, 3, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw elbow joint
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(elbowX, elbowY, 2, 0, 2 * Math.PI);
    ctx.fill();
    
    return { elbowX, elbowY };
}

function drawForearm(ctx, elbowX, elbowY, angle, length) {
    // Calculate forearm end point (wrist/fist position)
    const fistX = elbowX + Math.cos(angle) * length;
    const fistY = elbowY + Math.sin(angle) * length;
    
    // Draw forearm
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(elbowX, elbowY);
    ctx.lineTo(fistX, fistY);
    ctx.stroke();
    
    return { fistX, fistY };
}

function drawFist(ctx, fistX, fistY) {
    // Draw fist as a circle
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(fistX, fistY, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw fist outline
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(fistX, fistY, 4, 0, 2 * Math.PI);
    ctx.stroke();
    
    return { fistX, fistY };
}

function drawTarget(ctx, targetX, targetY) {
    const radius = 5 * state.pixelsPerCm; // 5cm radius = 10cm diameter target
    
    // Draw target rings (bullseye style)
    // Outer ring - red
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(targetX, targetY, radius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Middle ring - white
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(targetX, targetY, radius * 0.7, 0, 2 * Math.PI);
    ctx.fill();
    
    // Inner ring - red
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(targetX, targetY, radius * 0.4, 0, 2 * Math.PI);
    ctx.fill();
    
    // Bull's eye - black
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(targetX, targetY, radius * 0.15, 0, 2 * Math.PI);
    ctx.fill();
    
    // Target outline
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(targetX, targetY, radius, 0, 2 * Math.PI);
    ctx.stroke();
    
    return { targetX, targetY, radius };
}

function drawGrid(ctx, width, height) {
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    
    // Grid size: 2 pixels = 1 cm, so 40px = 20cm squares for visibility
    const gridSize = 20 * state.pixelsPerCm; // 20cm squares
    
    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    
    // Horizontal lines  
    for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    // Draw center cross for reference
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    
    // Center vertical line
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    
    // Center horizontal line
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
}

function render() {
    if (!state.ctx) return;
    
    const ctx = state.ctx;
    const canvas = state.canvas;
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Save context for zoom transformations
    ctx.save();
    
    // Calculate center of canvas
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Apply zoom transformation (zoom from center)
    ctx.translate(centerX, centerY);
    ctx.scale(state.zoom, state.zoom);
    ctx.translate(-centerX, -centerY);
    
    // Draw grid (scaled with zoom)
    drawGrid(ctx, canvas.width, canvas.height);
    
    // Calculate angles: if playing, compute from rotation speeds; if paused, use instantaneous slider-set angles
    let hipAngle;
    let shoulderAngle;
    let elbowAngle;

    if (state.isPlaying) {
        // hipAngular: hip rotation angle (radians)
        hipAngle = (state.time * state.hipRotation * Math.PI / 180) % (2 * Math.PI);
        shoulderAngle = (state.time * state.shoulderRotation * Math.PI / 180) % (2 * Math.PI);
        elbowAngle = shoulderAngle + (state.time * state.elbowRotation * Math.PI / 180) % (2 * Math.PI);
    } else {
        // Use instantaneous angles (converted from degrees)
        hipAngle = (state.hipAngleDeg || 0) * Math.PI / 180;
        shoulderAngle = (state.shoulderAngleDeg || 0) * Math.PI / 180;
        elbowAngle = (state.elbowAngleDeg || 0) * Math.PI / 180;
    }

    // Map spineSpring (k) to a time constant tau: higher k -> faster response (smaller tau)
    const k = Math.max(0.0001, state.spineSpring);
    const tau = 0.2 + (100 - Math.min(100, k)) / 100 * 0.8; // tau in seconds, clamped

    // For immediate sync: collar follows hip exactly
    const collarAngle = hipAngle;
    
    // Draw hip (foundation of the kinetic chain) - same position as collar bones in top view
    const hip = drawHip(ctx, centerX, centerY, hipAngle, state.hipLength * state.pixelsPerCm);
    
    // Draw collar bones (collar rotation connected through spine inertia)
    const collarBones = drawCollarBones(ctx, centerX, centerY, collarAngle, state.collarLength * state.pixelsPerCm);
    
    // Use the right end of the collar bones as the shoulder connection point
    const shoulderX = collarBones.endX;
    const shoulderY = collarBones.endY;
    
    // Draw upper arm
    const upperArm = drawUpperArm(ctx, shoulderX, shoulderY, shoulderAngle, state.upperArmLength * state.pixelsPerCm);
    
    // Draw forearm
    const forearm = drawForearm(ctx, upperArm.elbowX, upperArm.elbowY, elbowAngle, state.forearmLength * state.pixelsPerCm);
    
    // Draw fist
    const fist = drawFist(ctx, forearm.fistX, forearm.fistY);
    
    // Draw target (positioned 50cm above center - punches go upwards)
    drawTarget(ctx, centerX, centerY - 50 * state.pixelsPerCm);
    
    // Restore context
    ctx.restore();
    
    // Draw zoom info and scale info in top-right corner (not affected by zoom)
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Zoom: ${(state.zoom * 100).toFixed(0)}%`, canvas.width - 10, 20);
    ctx.fillText(`Scale: ${state.pixelsPerCm}px = 1cm`, canvas.width - 10, 35);
}

function animate() {
    if (state.isPlaying) {
        state.time += 0.016; // ~60fps
        render();
        state.animationId = requestAnimationFrame(animate);
    }
}

function createParameterGroup(title, items) {
    const group = createElement('div', 'param-group');
    const titleEl = createElement('h4', '', title);
    group.appendChild(titleEl);
    
    items.forEach(item => group.appendChild(item));
    return group;
}

function init() {
    console.log('Initializing Punch Calculator...');
    
    // Create main container
    const container = createElement('div', 'container');
    
    // Header
    const header = createElement('div', 'header');
    const title = createElement('h1', 'title', 'Punch Calculator');
    header.appendChild(title);
    
    // Left parameters - Rotation Controls
    const leftParams = createElement('div', 'left-params');
    const leftTitle = createElement('h3', 'section-title', 'Rotation Controls');
    leftParams.appendChild(leftTitle);
    
    // Hip rotation group (starts the chain)
    const hipGroup = createParameterGroup('Hip Rotation', [
        createSlider('Hip Rotation Speed (°/s)', state.hipRotation, 0, 180, 5, (value) => {
            state.hipRotation = value;
            // Update instantaneous hip angle (deg) to reflect new speed at the current time
            state.hipAngleDeg = ((state.time * value) % 360);
            console.log('Hip rotation:', value, '°/s');
            render();
        }, 'hipRotation')
    ]);
    
    // Spine spring group (elastic response to hip rotation)
    const spineGroup = createParameterGroup('Spine Spring', [
        createSlider('Spine Spring (k)', state.spineSpring, 0, 180, 5, (value) => {
            state.spineSpring = value;
            console.log('Spine spring constant:', value);
            render();
        }, 'spineSpring')
    ]);
    
    // Shoulder rotation group (independent shoulder movement)
    const shoulderGroup = createParameterGroup('Shoulder Rotation', [
        createSlider('Shoulder Speed (°/s)', state.shoulderRotation, 0, 360, 10, (value) => {
            state.shoulderRotation = value;
            // Update instantaneous shoulder angle (deg) to reflect new speed at the current time
            state.shoulderAngleDeg = ((state.time * value) % 360);
            console.log('Shoulder rotation:', value, '°/s');
            render();
        }, 'shoulderRotation')
    ]);
    
    // Elbow rotation group
    const elbowGroup = createParameterGroup('Elbow Rotation', [
        createSlider('Elbow Speed (°/s)', state.elbowRotation, 0, 540, 10, (value) => {
            state.elbowRotation = value;
            // Update instantaneous elbow angle (deg) to reflect new speed at the current time
            state.elbowAngleDeg = ((state.time * value) % 360);
            console.log('Elbow rotation:', value, '°/s');
            render();
        }, 'elbowRotation')
    ]);
    
    leftParams.appendChild(hipGroup);
    leftParams.appendChild(spineGroup);
    leftParams.appendChild(shoulderGroup);
    leftParams.appendChild(elbowGroup);
    
    // Center punch area
    const punchArea = createElement('div', 'punch-area');
    
    // Create view tabs
    const viewTabContainer = createElement('div', 'view-tab-container');
    const viewTabNav = createElement('div', 'view-tab-nav');
    
    const topViewTab = createElement('button', 'view-tab-button active', 'Top View');
    const frontViewTab = createElement('button', 'view-tab-button', 'Front View');
    const sideViewTab = createElement('button', 'view-tab-button', 'Side View');
    
    viewTabNav.appendChild(topViewTab);
    viewTabNav.appendChild(frontViewTab);
    viewTabNav.appendChild(sideViewTab);
    
    viewTabContainer.appendChild(viewTabNav);
    punchArea.appendChild(viewTabContainer);
    
    // Create canvas
    const canvas = createElement('canvas', 'punch-canvas');
    state.canvas = canvas;
    state.ctx = canvas.getContext('2d');
    
    // Function to resize canvas properly
    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        render();
    }
    
    // Set initial size and add resize listener
    setTimeout(resizeCanvas, 0); // Wait for DOM to settle
    window.addEventListener('resize', resizeCanvas);
    
    // Ensure pixel-perfect rendering
    const ctx = state.ctx;
    ctx.imageSmoothingEnabled = false;
    
    // Add mouse wheel zoom functionality
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault(); // Prevent page scrolling
        
        const zoomStep = 0.1;
        const delta = e.deltaY > 0 ? -zoomStep : zoomStep; // Reverse direction for intuitive zoom
        
        updateZoom(state.zoom + delta);
    });
    
    // Function to update zoom (will be defined later)
    function updateZoom(newZoom) {
        state.zoom = Math.max(state.minZoom, Math.min(state.maxZoom, newZoom));
        if (zoomSlider) zoomSlider.value = state.zoom;
        if (zoomValue) zoomValue.textContent = `${Math.round(state.zoom * 100)}%`;
        render();
    }
    
    // Zoom controls
    const zoomControls = createElement('div', 'zoom-controls');
    
    const zoomLabel = createElement('span', 'zoom-label', 'Zoom:');
    
    const zoomSlider = createElement('input', 'zoom-slider');
    zoomSlider.type = 'range';
    zoomSlider.min = state.minZoom;
    zoomSlider.max = state.maxZoom;
    zoomSlider.step = 0.1;
    zoomSlider.value = state.zoom;
    
    const zoomValue = createElement('span', 'zoom-value', '100%');
    
    const zoomButtons = createElement('div', 'zoom-buttons');
    const zoomInBtn = createElement('button', 'btn-zoom', '+');
    const zoomOutBtn = createElement('button', 'btn-zoom', '−');
    const zoomResetBtn = createElement('button', 'btn-zoom', '1:1');
    
    // Zoom event listeners
    zoomSlider.addEventListener('input', (e) => {
        updateZoom(parseFloat(e.target.value));
    });
    
    zoomInBtn.addEventListener('click', () => {
        updateZoom(state.zoom + 0.2);
    });
    
    zoomOutBtn.addEventListener('click', () => {
        updateZoom(state.zoom - 0.2);
    });
    
    zoomResetBtn.addEventListener('click', () => {
        updateZoom(1.0);
    });
    
    zoomButtons.appendChild(zoomOutBtn);
    zoomButtons.appendChild(zoomResetBtn);
    zoomButtons.appendChild(zoomInBtn);
    
    zoomControls.appendChild(zoomLabel);
    zoomControls.appendChild(zoomSlider);
    zoomControls.appendChild(zoomValue);
    zoomControls.appendChild(zoomButtons);
    
    const controls = createElement('div', 'controls');
    const playBtn = createElement('button', 'btn btn-play', '▶ Play');
    const pauseBtn = createElement('button', 'btn btn-pause', '⏸ Pause');
    const resetBtn = createElement('button', 'btn btn-reset', '⏹ Reset');
    
    playBtn.addEventListener('click', () => {
        state.isPlaying = true;
        animate();
        console.log('Animation started');
    });
    
    pauseBtn.addEventListener('click', () => {
        state.isPlaying = false;
        if (state.animationId) {
            cancelAnimationFrame(state.animationId);
        }
        console.log('Animation paused');
    });
    
    resetBtn.addEventListener('click', () => {
        state.isPlaying = false;
        state.time = 0;
        if (state.animationId) {
            cancelAnimationFrame(state.animationId);
        }
        render();
        console.log('Animation reset');
    });
    
    controls.appendChild(playBtn);
    controls.appendChild(pauseBtn);
    controls.appendChild(resetBtn);
    
    // Punch type selection
    const punchTypes = createElement('div', 'punch-types');
    
    const jabBtn = createElement('button', 'btn btn-punch btn-jab active', '👊 Jab');
    const crossBtn = createElement('button', 'btn btn-punch btn-cross', '🥊 Cross');
    const hookBtn = createElement('button', 'btn btn-punch btn-hook', '🤜 Hook');
    
    // Function to apply punch preset
    function applyPunchPreset(punchType) {
        const preset = punchPresets[punchType];
        state.selectedPunch = punchType;
        state.hipRotation = preset.hipRotation;
        state.spineSpring = preset.spineSpring;
        state.shoulderRotation = preset.shoulderRotation;
        state.elbowRotation = preset.elbowRotation;
        
        // Update slider values in the UI
        updateSliderValues();
        
        console.log(`Applied ${preset.name} preset:`, preset);
    }
    
    // Function to update active button
    function setActivePunchButton(activeBtn) {
        [jabBtn, crossBtn, hookBtn].forEach(btn => btn.classList.remove('active'));
        activeBtn.classList.add('active');
    }
    
    jabBtn.addEventListener('click', () => {
        applyPunchPreset('jab');
        setActivePunchButton(jabBtn);
    });
    
    crossBtn.addEventListener('click', () => {
        applyPunchPreset('cross');
        setActivePunchButton(crossBtn);
    });
    
    hookBtn.addEventListener('click', () => {
        applyPunchPreset('hook');
        setActivePunchButton(hookBtn);
    });
    
    punchTypes.appendChild(jabBtn);
    punchTypes.appendChild(crossBtn);
    punchTypes.appendChild(hookBtn);
    
    // Add view tab switching functionality
    topViewTab.addEventListener('click', () => {
        state.currentView = 'top';
        topViewTab.classList.add('active');
        frontViewTab.classList.remove('active');
        sideViewTab.classList.remove('active');
        render();
        console.log('Switched to top view');
    });
    
    frontViewTab.addEventListener('click', () => {
        state.currentView = 'front';
        frontViewTab.classList.add('active');
        topViewTab.classList.remove('active');
        sideViewTab.classList.remove('active');
        render();
        console.log('Switched to front view');
    });
    
    sideViewTab.addEventListener('click', () => {
        state.currentView = 'side';
        sideViewTab.classList.add('active');
        topViewTab.classList.remove('active');
        frontViewTab.classList.remove('active');
        render();
        console.log('Switched to side view');
    });
    
    punchArea.appendChild(canvas);
    punchArea.appendChild(zoomControls);
    punchArea.appendChild(controls);
    punchArea.appendChild(punchTypes);
    
    // Right parameters - Arm Dimensions
    const rightParams = createElement('div', 'right-params');
    const rightTitle = createElement('h3', 'section-title', 'Arm Dimensions');
    rightParams.appendChild(rightTitle);
    
    // Create tab container
    const tabContainer = createElement('div', 'tab-container');
    
    // Create tab navigation
    const tabNav = createElement('div', 'tab-nav');
    const lengthsTab = createElement('button', 'tab-button active', 'Lengths');
    const anglesTab = createElement('button', 'tab-button', 'Initial Angles');
    
    tabNav.appendChild(lengthsTab);
    tabNav.appendChild(anglesTab);
    
    // Create tab content
    const tabContent = createElement('div', 'tab-content');
    
    // Lengths tab pane
    const lengthsPane = createElement('div', 'tab-pane active');
    const armLengthGroup = createParameterGroup('Segment Lengths', [
        createSlider('Hip Length (cm)', state.hipLength, 10, 40, 1, (value) => {
            state.hipLength = value;
            render();
            console.log('Hip length:', value, 'cm');
        }),
        createSlider('Collar Bone Length (cm)', state.collarLength, 10, 40, 1, (value) => {
            state.collarLength = value;
            render();
            console.log('Collar bone length:', value, 'cm');
        }),
        createSlider('Upper Arm Length (cm)', state.upperArmLength, 20, 60, 1, (value) => {
            state.upperArmLength = value;
            render();
            console.log('Upper arm length:', value, 'cm');
        }),
        createSlider('Forearm Length (cm)', state.forearmLength, 20, 50, 1, (value) => {
            state.forearmLength = value;
            render();
            console.log('Forearm length:', value, 'cm');
        })
    ]);
    lengthsPane.appendChild(armLengthGroup);
    
    // Initial angles tab pane
    const anglesPane = createElement('div', 'tab-pane');
    const initialAnglesGroup = createParameterGroup('Initial Bone Angles', [
    createSlider('Hip Initial (°)', state.hipInitialAngle || 0, -45, 45, 1, (value) => {
            state.hipInitialAngle = value;
            state.hipAngleDeg = value;
            render();
            console.log('Hip initial angle:', value, '°');
    }, 'hipInitial'),
    createSlider('Shoulder Initial (°)', state.shoulderInitialAngle || 0, -90, 90, 1, (value) => {
            state.shoulderInitialAngle = value;
            state.shoulderAngleDeg = value;
            render();
            console.log('Shoulder initial angle:', value, '°');
    }, 'shoulderInitial'),
    createSlider('Elbow Initial (°)', state.elbowInitialAngle || 0, -150, 30, 1, (value) => {
            state.elbowInitialAngle = value;
            state.elbowAngleDeg = value;
            render();
            console.log('Elbow initial angle:', value, '°');
    }, 'elbowInitial')
    ]);
    anglesPane.appendChild(initialAnglesGroup);
    
    // Add tab switching functionality
    lengthsTab.addEventListener('click', () => {
        lengthsTab.classList.add('active');
        anglesTab.classList.remove('active');
        lengthsPane.classList.add('active');
        anglesPane.classList.remove('active');
    });
    
    anglesTab.addEventListener('click', () => {
        anglesTab.classList.add('active');
        lengthsTab.classList.remove('active');
        anglesPane.classList.add('active');
        lengthsPane.classList.remove('active');
    });
    
    tabContent.appendChild(lengthsPane);
    tabContent.appendChild(anglesPane);
    
    tabContainer.appendChild(tabNav);
    tabContainer.appendChild(tabContent);
    
    rightParams.appendChild(tabContainer);
    
    // Assemble the layout
    container.appendChild(header);
    container.appendChild(leftParams);
    container.appendChild(punchArea);
    container.appendChild(rightParams);
    
    document.body.appendChild(container);
    
    // Initial render
    render();
    
    console.log('Layout created successfully!');
    console.log('Current state:', state);
}

// Initialize when page loads
init();
