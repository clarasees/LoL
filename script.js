// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('webcam');

    // Blue elements
    const blueCanvas = document.getElementById('blueCanvas');
    const blueCtx = blueCanvas.getContext('2d');
    const blueMaskedCanvas = document.getElementById('blueMaskedCanvas');
    const blueMaskedCtx = blueMaskedCanvas.getContext('2d');
    const blueSensitivitySlider = document.getElementById('blueSensitivity');
    const blueSensitivityValue = document.getElementById('blueSensitivityValue');

    // Red elements
    const redCanvas = document.getElementById('redCanvas');
    const redCtx = redCanvas.getContext('2d');
    const redMaskedCanvas = document.getElementById('redMaskedCanvas');
    const redMaskedCtx = redMaskedCanvas.getContext('2d');
    const redSensitivitySlider = document.getElementById('redSensitivity');
    const redSensitivityValue = document.getElementById('redSensitivityValue');

    // Yellow elements
    const yellowCanvas = document.getElementById('yellowCanvas');
    const yellowCtx = yellowCanvas.getContext('2d');
    const yellowMaskedCanvas = document.getElementById('yellowMaskedCanvas');
    const yellowMaskedCtx = yellowMaskedCanvas.getContext('2d');
    const yellowSensitivitySlider = document.getElementById('yellowSensitivity');
    const yellowSensitivityValue = document.getElementById('yellowSensitivityValue');

    // Combined output
    const combinedCanvas = document.getElementById('combinedCanvas');
    const combinedCtx = combinedCanvas.getContext('2d');

    // Common elements
    const cameraSelect = document.getElementById('cameraSelect');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const message = document.getElementById('message');

    let stream = null;
    let animationId = null;
    let blueSensitivity = 50;
    let redSensitivity = 50;
    let yellowSensitivity = 50;

    // Background images for each color
    let blueBackgroundImage = null;
    let redBackgroundImage = null;
    let yellowBackgroundImage = null;

    // Enumerate available cameras
    async function getCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');

            cameraSelect.innerHTML = '';

            if (videoDevices.length === 0) {
                cameraSelect.innerHTML = '<option value="">No cameras found</option>';
                return;
            }

            videoDevices.forEach((device, index) => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.text = device.label || `Camera ${index + 1}`;
                cameraSelect.appendChild(option);
            });

            message.textContent = `Found ${videoDevices.length} camera(s). Select one and click Start.`;
            message.style.color = '#333';
        } catch (error) {
            console.error('Error enumerating cameras:', error);
            cameraSelect.innerHTML = '<option value="">Error loading cameras</option>';
        }
    }

    // Load cameras on page load
    getCameras();

    // Update sensitivity value display for blue
    blueSensitivitySlider.addEventListener('input', function() {
        blueSensitivity = parseInt(this.value);
        blueSensitivityValue.textContent = blueSensitivity;
    });

    // Update sensitivity value display for red
    redSensitivitySlider.addEventListener('input', function() {
        redSensitivity = parseInt(this.value);
        redSensitivityValue.textContent = redSensitivity;
    });

    // Update sensitivity value display for yellow
    yellowSensitivitySlider.addEventListener('input', function() {
        yellowSensitivity = parseInt(this.value);
        yellowSensitivityValue.textContent = yellowSensitivity;
    });

    // Helper function to draw image with cover mode (preserves aspect ratio)
    function drawImageCover(ctx, img, canvasWidth, canvasHeight) {
        const imgAspect = img.width / img.height;
        const canvasAspect = canvasWidth / canvasHeight;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (imgAspect > canvasAspect) {
            // Image is wider than canvas
            drawHeight = canvasHeight;
            drawWidth = img.width * (canvasHeight / img.height);
            offsetX = (canvasWidth - drawWidth) / 2;
            offsetY = 0;
        } else {
            // Image is taller than canvas
            drawWidth = canvasWidth;
            drawHeight = img.height * (canvasWidth / img.width);
            offsetX = 0;
            offsetY = (canvasHeight - drawHeight) / 2;
        }

        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    }

    // Load predefined background images from backend
    function loadBackgroundImages() {
        // Load blue background
        const blueImg = new Image();
        blueImg.onload = function() {
            blueBackgroundImage = blueImg;
            console.log('Blue background loaded');
        };
        blueImg.onerror = function() {
            console.log('Blue background not found (blue-background.jpg)');
        };
        blueImg.src = 'blue-background.jpg';

        // Load red background
        const redImg = new Image();
        redImg.onload = function() {
            redBackgroundImage = redImg;
            console.log('Red background loaded');
        };
        redImg.onerror = function() {
            console.log('Red background not found (red-background.jpg)');
        };
        redImg.src = 'red-background.jpg';

        // Load yellow background
        const yellowImg = new Image();
        yellowImg.onload = function() {
            yellowBackgroundImage = yellowImg;
            console.log('Yellow background loaded');
        };
        yellowImg.onerror = function() {
            console.log('Yellow background not found (yellow-background.jpg)');
        };
        yellowImg.src = 'yellow-background.jpg';
    }

    // Load background images on page load
    loadBackgroundImages();

    // Process video frames to detect colors
    function processFrame() {
        if (!stream) return;

        // Draw current video frame to all detection canvases
        blueCtx.drawImage(video, 0, 0, blueCanvas.width, blueCanvas.height);
        redCtx.drawImage(video, 0, 0, redCanvas.width, redCanvas.height);
        yellowCtx.drawImage(video, 0, 0, yellowCanvas.width, yellowCanvas.height);

        // Get image data from all canvases
        const blueImageData = blueCtx.getImageData(0, 0, blueCanvas.width, blueCanvas.height);
        const redImageData = redCtx.getImageData(0, 0, redCanvas.width, redCanvas.height);
        const yellowImageData = yellowCtx.getImageData(0, 0, yellowCanvas.width, yellowCanvas.height);

        const blueData = blueImageData.data;
        const redData = redImageData.data;
        const yellowData = yellowImageData.data;

        // Process each pixel
        for (let i = 0; i < blueData.length; i += 4) {
            const r = blueData[i];
            const g = blueData[i + 1];
            const b = blueData[i + 2];

            // BLUE DETECTION
            const blueThreshold = blueSensitivity / 2;
            const isBlue = b > (r + blueThreshold) && b > (g + blueThreshold) && b > 100;

            // For blue detection canvas - show only blue pixels
            if (!isBlue) {
                blueData[i] = 0;
                blueData[i + 1] = 0;
                blueData[i + 2] = 0;
            }

            // RED DETECTION
            const redThreshold = redSensitivity / 2;
            const isRed = r > (g + redThreshold) && r > (b + redThreshold) && r > 100;

            // For red detection canvas - show only red pixels
            if (!isRed) {
                redData[i] = 0;
                redData[i + 1] = 0;
                redData[i + 2] = 0;
            }

            // YELLOW DETECTION
            // Yellow is high red + high green, low blue
            const yellowThreshold = yellowSensitivity / 2;
            const isYellow = r > (b + yellowThreshold) &&
                           g > (b + yellowThreshold) &&
                           r > 100 && g > 100 &&
                           Math.abs(r - g) < 50; // Red and green should be similar

            // For yellow detection canvas - show only yellow pixels
            if (!isYellow) {
                yellowData[i] = 0;
                yellowData[i + 1] = 0;
                yellowData[i + 2] = 0;
            }
        }

        // Put processed image data back to detection canvases
        blueCtx.putImageData(blueImageData, 0, 0);
        redCtx.putImageData(redImageData, 0, 0);
        yellowCtx.putImageData(yellowImageData, 0, 0);

        // Create masked outputs (apply backgrounds where color is detected)
        // Blue masked output
        if (blueBackgroundImage) {
            blueMaskedCtx.clearRect(0, 0, blueMaskedCanvas.width, blueMaskedCanvas.height);
            drawImageCover(blueMaskedCtx, blueBackgroundImage, blueMaskedCanvas.width, blueMaskedCanvas.height);
            const blueMaskedImageData = blueMaskedCtx.getImageData(0, 0, blueMaskedCanvas.width, blueMaskedCanvas.height);
            const blueMaskedData = blueMaskedImageData.data;

            // Re-read the blue detection data
            const blueDetectionData = blueCtx.getImageData(0, 0, blueCanvas.width, blueCanvas.height).data;

            for (let i = 0; i < blueMaskedData.length; i += 4) {
                const isBlueDetected = blueDetectionData[i] !== 0 || blueDetectionData[i + 1] !== 0 || blueDetectionData[i + 2] !== 0;
                if (isBlueDetected) {
                    // Keep the background image pixel
                } else {
                    // Use original video pixel
                    blueMaskedData[i] = blueData[i];
                    blueMaskedData[i + 1] = blueData[i + 1];
                    blueMaskedData[i + 2] = blueData[i + 2];
                }
            }
            blueMaskedCtx.putImageData(blueMaskedImageData, 0, 0);
        }

        // Red masked output
        if (redBackgroundImage) {
            redMaskedCtx.clearRect(0, 0, redMaskedCanvas.width, redMaskedCanvas.height);
            drawImageCover(redMaskedCtx, redBackgroundImage, redMaskedCanvas.width, redMaskedCanvas.height);
            const redMaskedImageData = redMaskedCtx.getImageData(0, 0, redMaskedCanvas.width, redMaskedCanvas.height);
            const redMaskedData = redMaskedImageData.data;

            const redDetectionData = redCtx.getImageData(0, 0, redCanvas.width, redCanvas.height).data;

            for (let i = 0; i < redMaskedData.length; i += 4) {
                const isRedDetected = redDetectionData[i] !== 0 || redDetectionData[i + 1] !== 0 || redDetectionData[i + 2] !== 0;
                if (isRedDetected) {
                    // Keep the background image pixel
                } else {
                    // Use original video pixel
                    redMaskedData[i] = redData[i];
                    redMaskedData[i + 1] = redData[i + 1];
                    redMaskedData[i + 2] = redData[i + 2];
                }
            }
            redMaskedCtx.putImageData(redMaskedImageData, 0, 0);
        }

        // Yellow masked output
        if (yellowBackgroundImage) {
            yellowMaskedCtx.clearRect(0, 0, yellowMaskedCanvas.width, yellowMaskedCanvas.height);
            drawImageCover(yellowMaskedCtx, yellowBackgroundImage, yellowMaskedCanvas.width, yellowMaskedCanvas.height);
            const yellowMaskedImageData = yellowMaskedCtx.getImageData(0, 0, yellowMaskedCanvas.width, yellowMaskedCanvas.height);
            const yellowMaskedData = yellowMaskedImageData.data;

            const yellowDetectionData = yellowCtx.getImageData(0, 0, yellowCanvas.width, yellowCanvas.height).data;

            for (let i = 0; i < yellowMaskedData.length; i += 4) {
                const isYellowDetected = yellowDetectionData[i] !== 0 || yellowDetectionData[i + 1] !== 0 || yellowDetectionData[i + 2] !== 0;
                if (isYellowDetected) {
                    // Keep the background image pixel
                } else {
                    // Use original video pixel
                    yellowMaskedData[i] = yellowData[i];
                    yellowMaskedData[i + 1] = yellowData[i + 1];
                    yellowMaskedData[i + 2] = yellowData[i + 2];
                }
            }
            yellowMaskedCtx.putImageData(yellowMaskedImageData, 0, 0);
        }

        // Create combined output - merge all three masked outputs
        // First draw the original video frame to combined canvas
        combinedCtx.drawImage(video, 0, 0, combinedCanvas.width, combinedCanvas.height);
        const combinedImageData = combinedCtx.getImageData(0, 0, combinedCanvas.width, combinedCanvas.height);
        const combinedData = combinedImageData.data;

        // Get masked data from each canvas (if available)
        const blueMaskedData = blueBackgroundImage ?
            blueMaskedCtx.getImageData(0, 0, blueMaskedCanvas.width, blueMaskedCanvas.height).data : null;
        const redMaskedData = redBackgroundImage ?
            redMaskedCtx.getImageData(0, 0, redMaskedCanvas.width, redMaskedCanvas.height).data : null;
        const yellowMaskedData = yellowBackgroundImage ?
            yellowMaskedCtx.getImageData(0, 0, yellowMaskedCanvas.width, yellowMaskedCanvas.height).data : null;

        // Re-read detection data (after processing)
        const blueDetectionData = blueCtx.getImageData(0, 0, blueCanvas.width, blueCanvas.height).data;
        const redDetectionData = redCtx.getImageData(0, 0, redCanvas.width, redCanvas.height).data;
        const yellowDetectionData = yellowCtx.getImageData(0, 0, yellowCanvas.width, yellowCanvas.height).data;

        // Apply masked backgrounds where colors are detected
        for (let i = 0; i < combinedData.length; i += 4) {
            // Check each color detection
            const blueDetected = blueDetectionData[i] !== 0 || blueDetectionData[i + 1] !== 0 || blueDetectionData[i + 2] !== 0;
            const redDetected = redDetectionData[i] !== 0 || redDetectionData[i + 1] !== 0 || redDetectionData[i + 2] !== 0;
            const yellowDetected = yellowDetectionData[i] !== 0 || yellowDetectionData[i + 1] !== 0 || yellowDetectionData[i + 2] !== 0;

            // Apply masked backgrounds in priority order (blue > red > yellow)
            if (blueDetected && blueMaskedData) {
                combinedData[i] = blueMaskedData[i];
                combinedData[i + 1] = blueMaskedData[i + 1];
                combinedData[i + 2] = blueMaskedData[i + 2];
            } else if (redDetected && redMaskedData) {
                combinedData[i] = redMaskedData[i];
                combinedData[i + 1] = redMaskedData[i + 1];
                combinedData[i + 2] = redMaskedData[i + 2];
            } else if (yellowDetected && yellowMaskedData) {
                combinedData[i] = yellowMaskedData[i];
                combinedData[i + 1] = yellowMaskedData[i + 1];
                combinedData[i + 2] = yellowMaskedData[i + 2];
            }
        }

        combinedCtx.putImageData(combinedImageData, 0, 0);

        // Continue processing frames
        animationId = requestAnimationFrame(processFrame);
    }

    // Start webcam
    startBtn.addEventListener('click', async function() {
        try {
            const selectedDeviceId = cameraSelect.value;

            if (!selectedDeviceId) {
                message.textContent = 'Please select a camera first.';
                message.style.color = '#dc3545';
                return;
            }

            // Request access to the selected webcam (portrait mode - HD)
            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    deviceId: { exact: selectedDeviceId },
                    width: 1080,
                    height: 1440
                },
                audio: false
            });

            // Set video source to webcam stream
            video.srcObject = stream;

            // Wait for video to load metadata
            video.addEventListener('loadedmetadata', () => {
                // Set canvas sizes to match video
                blueCanvas.width = video.videoWidth;
                blueCanvas.height = video.videoHeight;
                blueMaskedCanvas.width = video.videoWidth;
                blueMaskedCanvas.height = video.videoHeight;

                redCanvas.width = video.videoWidth;
                redCanvas.height = video.videoHeight;
                redMaskedCanvas.width = video.videoWidth;
                redMaskedCanvas.height = video.videoHeight;

                yellowCanvas.width = video.videoWidth;
                yellowCanvas.height = video.videoHeight;
                yellowMaskedCanvas.width = video.videoWidth;
                yellowMaskedCanvas.height = video.videoHeight;

                combinedCanvas.width = video.videoWidth;
                combinedCanvas.height = video.videoHeight;

                // Start processing frames
                processFrame();
            });

            // Update UI
            startBtn.disabled = true;
            stopBtn.disabled = false;
            message.textContent = 'Webcam started - detecting blue, red, and yellow colors!';
            message.style.color = '#28a745';

            console.log('Webcam started with multi-color detection');
        } catch (error) {
            console.error('Error accessing webcam:', error);
            message.textContent = 'Error: Could not access webcam. Please make sure you granted permission.';
            message.style.color = '#dc3545';
        }
    });

    // Stop webcam
    stopBtn.addEventListener('click', function() {
        if (stream) {
            // Stop animation frame
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }

            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
            video.srcObject = null;
            stream = null;

            // Clear all canvases
            blueCtx.clearRect(0, 0, blueCanvas.width, blueCanvas.height);
            blueMaskedCtx.clearRect(0, 0, blueMaskedCanvas.width, blueMaskedCanvas.height);
            redCtx.clearRect(0, 0, redCanvas.width, redCanvas.height);
            redMaskedCtx.clearRect(0, 0, redMaskedCanvas.width, redMaskedCanvas.height);
            yellowCtx.clearRect(0, 0, yellowCanvas.width, yellowCanvas.height);
            yellowMaskedCtx.clearRect(0, 0, yellowMaskedCanvas.width, yellowMaskedCanvas.height);
            combinedCtx.clearRect(0, 0, combinedCanvas.width, combinedCanvas.height);

            // Update UI
            startBtn.disabled = false;
            stopBtn.disabled = true;
            message.textContent = 'Webcam stopped.';
            message.style.color = '#333';

            console.log('Webcam stopped');
        }
    });

    console.log('Script loaded successfully');
});
