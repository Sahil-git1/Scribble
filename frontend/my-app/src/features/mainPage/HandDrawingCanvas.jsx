import React, { useEffect, useRef } from 'react';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

const HandDrawingCanvas = ({ color = '#00ccff', thickness = 4, eraserSize = 30 }) => {
  const canvasRef = useRef(null);
  const indicatorCanvasRef = useRef(null);
  const videoRef = useRef(null);
  const lastPosition = useRef({ x: null, y: null });

  useEffect(() => {
    const canvas = canvasRef.current;
    const indicatorCanvas = indicatorCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const indicatorCtx = indicatorCanvas.getContext('2d');
    const video = videoRef.current;

    // Set canvas dimensions to match parent container
    const updateCanvasSize = () => {
      const parent = canvas.parentElement;
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      
      canvas.width = width;
      canvas.height = height;
      indicatorCanvas.width = width;
      indicatorCanvas.height = height;

      // Fill background
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, width, height);
    };

    // Initial size setup
    updateCanvasSize();

    // Update size on window resize
    window.addEventListener('resize', updateCanvasSize);

    const hands = new window.Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults((results) => {
      // Clear only the indicator canvas
      indicatorCtx.clearRect(0, 0, indicatorCanvas.width, indicatorCanvas.height);

      if (
        results.multiHandLandmarks &&
        results.multiHandLandmarks.length > 0
      ) {
        const landmarks = results.multiHandLandmarks[0];
        const indexTip = landmarks[8];
        const thumbTip = landmarks[4];
        const palmBase = landmarks[0]; // Palm base landmark

        const x = indexTip.x * canvas.width;
        const y = indexTip.y * canvas.height;
        const z = indexTip.z;

        const dx = (indexTip.x - thumbTip.x) * canvas.width;
        const dy = (indexTip.y - thumbTip.y) * canvas.height;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const isDrawing = distance < 60 && z < 0.1;
        const isErasing = distance > 100; // When fingers are spread out

        // Draw position indicator when not drawing or erasing
        if (!isDrawing && !isErasing) {
          indicatorCtx.beginPath();
          indicatorCtx.arc(x, y, 3, 0, 2 * Math.PI);
          indicatorCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          indicatorCtx.fill();
          lastPosition.current = { x: null, y: null };
          return;
        }

        if (isErasing) {
          // Show eraser indicator
          const eraserX = palmBase.x * canvas.width;
          const eraserY = palmBase.y * canvas.height;
          
          indicatorCtx.beginPath();
          indicatorCtx.arc(eraserX, eraserY, eraserSize/2, 0, 2 * Math.PI);
          indicatorCtx.fillStyle = 'rgba(255, 0, 0, 0.2)';
          indicatorCtx.fill();
          indicatorCtx.strokeStyle = 'red';
          indicatorCtx.lineWidth = 2;
          indicatorCtx.stroke();

          // Erase the area
          ctx.beginPath();
          ctx.arc(eraserX, eraserY, eraserSize/2, 0, 2 * Math.PI);
          ctx.fillStyle = '#f5f5f5';
          ctx.fill();
          
          lastPosition.current = { x: null, y: null };
          return;
        }

        const smoothX =
          lastPosition.current.x !== null
            ? lastPosition.current.x * 0.7 + x * 0.3
            : x;
        const smoothY =
          lastPosition.current.y !== null
            ? lastPosition.current.y * 0.7 + y * 0.3
            : y;

        if (lastPosition.current.x === null) {
          lastPosition.current = { x: smoothX, y: smoothY };
        } else {
          ctx.beginPath();
          ctx.moveTo(lastPosition.current.x, lastPosition.current.y);
          ctx.lineTo(smoothX, smoothY);
          ctx.strokeStyle = color;
          ctx.lineWidth = thickness;
          ctx.lineCap = 'round';
          ctx.stroke();

          lastPosition.current = { x: smoothX, y: smoothY };
        }
      } else {
        lastPosition.current = { x: null, y: null };
      }
    });

    const camera = new window.Camera(video, {
      onFrame: async () => {
        await hands.send({ image: video });
      },
      width: 1280,
      height: 720,
    });

    camera.start();

    return () => {
      camera.stop();
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [color, thickness, eraserSize]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#000',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      {/* Video feed */}
      <video
        ref={videoRef}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)',
          position: 'absolute',
          zIndex: 0,
          opacity: 0.25,
        }}
        playsInline
        autoPlay
        muted
      />

      {/* Drawing canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          transform: 'rotateY(180deg)',
          background: '#f5f5f5',
          borderLeft: '2px solid #ccc',
          zIndex: 1,
        }}
      />

      {/* Indicator canvas */}
      <canvas
        ref={indicatorCanvasRef}
        style={{
          width: '100%',
          height: '100%',
          transform: 'rotateY(180deg)',
          position: 'absolute',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

export default HandDrawingCanvas;
