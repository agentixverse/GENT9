"use client";

import { useEffect, useRef } from "react";
import { useResizeObserver } from "usehooks-ts";
import * as THREE from "three";

const PHRASES = [
  "Manual Backtesting",
  "Constant Monitoring",
  "Emotional Decisions",
  "Delayed Execution",
];

const COLORS = [0x8b4513, 0xa0522d, 0x6b4423, 0x654321, 0x5c4033, 0x704214];

const ITEM_SIZE = 1.0;
const ITEM_ASPECT = 2.4;
const GAP = 0.1;
const ITEM_WITH_GAP = ITEM_SIZE + GAP;

// Reduced from 3072 to 1024 for 90% smaller memory footprint
const TEXTURE_HEIGHT = 1024;
const TEXTURE_WIDTH = TEXTURE_HEIGHT * ITEM_ASPECT;

function createTextTexture(text: string, textColor = "#ffffff"): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.height = TEXTURE_HEIGHT;
  canvas.width = TEXTURE_WIDTH;

  // Clear to transparent
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.fillStyle = textColor;
  const fontSize = Math.floor(TEXTURE_HEIGHT * 0.12);
  ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = words[0];

  const maxWidth = canvas.width * 0.85;

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const measureWidth = ctx.measureText(currentLine + " " + word).width;
    if (measureWidth < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);

  const lineHeight = fontSize * 1.3;
  const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;

  lines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function createCardTexture(text: string, bgColor: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.height = TEXTURE_HEIGHT;
  canvas.width = TEXTURE_WIDTH;

  // Fill with background color
  ctx.fillStyle = `#${bgColor.toString(16).padStart(6, '0')}`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw text on top
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#ffffff";
  const fontSize = Math.floor(TEXTURE_HEIGHT * 0.12);
  ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = words[0];
  const maxWidth = canvas.width * 0.85;

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const measureWidth = ctx.measureText(currentLine + " " + word).width;
    if (measureWidth < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);

  const lineHeight = fontSize * 1.3;
  const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;

  lines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export function ProcessAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width = 0, height = 0 } = useResizeObserver({ ref: containerRef as React.RefObject<HTMLElement> });
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
    renderTarget: THREE.WebGLRenderTarget;
    columns: Array<{
      group: THREE.Group;
      speed: number;
      direction: string;
    }>;
    animationId: number | null;
    sharedGeometry: THREE.PlaneGeometry;
  } | null>(null);

  // Initialize scene once
  useEffect(() => {
    if (!containerRef.current || width === 0 || height === 0) return;

    // Shared geometry for all meshes
    const sharedGeometry = new THREE.PlaneGeometry(1, 1);

    const scene = new THREE.Scene();
    // No background - transparent

    const camera = new THREE.OrthographicCamera(
      width / -200,
      width / 200,
      (height / 200) * 0.85,
      (height / -200) * 0.85,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true, // Enable transparency
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2x for performance
    renderer.setClearColor(0x000000, 0); // Transparent clear
    containerRef.current.appendChild(renderer.domElement);

    const renderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    });

    const postProcessScene = new THREE.Scene();

    function createColumn(
      speed: number,
      direction: string,
      columnIndex: number,
      totalColumns: number
    ) {
      const group = new THREE.Group();
      const viewWidth = width / 100;
      const viewHeight = height / 100;

      const edgePadding = 0.6;
      const availableWidth = viewWidth - edgePadding * 2;
      const columnWidth = availableWidth / totalColumns;
      const xPosition = (columnIndex - (totalColumns - 1) / 2) * columnWidth;
      group.position.x = xPosition;

      const itemsNeeded = Math.ceil(viewHeight / ITEM_WITH_GAP) + 8;

      for (let i = 0; i < itemsNeeded; i++) {
        const y =
          direction === "up"
            ? -viewHeight / 2 + i * ITEM_WITH_GAP
            : viewHeight / 2 - i * ITEM_WITH_GAP;

        const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];

        // Create single card mesh with texture containing both background and text
        const cardTexture = createCardTexture(phrase, color);
        const cardMaterial = new THREE.MeshBasicMaterial({ map: cardTexture });
        const cardMesh = new THREE.Mesh(sharedGeometry, cardMaterial);
        cardMesh.scale.set(columnWidth * 0.85, ITEM_SIZE, 1);
        cardMesh.position.y = y;
        cardMesh.userData = { phrase, color, texture: cardTexture };

        group.add(cardMesh);
      }

      return { group, speed, direction };
    }

    const isMobile = width < 768;
    const totalColumns = isMobile ? 2 : 3;

    const columns = [
      createColumn(0.016128, "down", 0, totalColumns),
      !isMobile ? createColumn(0.012096, "up", 1, totalColumns) : null,
      createColumn(0.00896, "down", isMobile ? 1 : 2, totalColumns),
    ].filter(Boolean) as Array<{
      group: THREE.Group;
      speed: number;
      direction: string;
    }>;

    columns.forEach((col) => scene.add(col.group));

    // Halftone vignette post-processing shader
    const halftoneShader = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: renderTarget.texture },
        resolution: { value: new THREE.Vector2(width, height) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec2 resolution;
        varying vec2 vUv;

        void main() {
          vec4 color = texture2D(tDiffuse, vUv);

          // Calculate distance from center for vignette
          vec2 center = vec2(0.5, 0.5);
          float dist = length(vUv - center);

          // Vignette range - clean early fade
          float vignetteStart = 0.25;
          float vignetteEnd = 0.5;
          float vignette = smoothstep(vignetteStart, vignetteEnd, dist);

          // Aspect ratio correction for circular dots
          vec2 aspectRatio = vec2(resolution.x / resolution.y, 1.0);

          // Halftone dot pattern - very dense, small dots
          float dotSize = 100.0; // Higher = more dense
          vec2 dotCoord = vUv * aspectRatio * dotSize;
          vec2 grid = fract(dotCoord) - 0.5; // Center grid cells
          float dotDist = length(grid);

          // Small dot radius for fine halftone
          float dotRadius = 0.18;

          // Sharp circle edges for clean dots
          float dotMask = smoothstep(dotRadius + 0.02, dotRadius - 0.02, dotDist);

          // Apply halftone only at edges (vignette controls strength)
          // At center (vignette=0): full opacity (no halftone)
          // At edges (vignette=1): only dots remain, everything else transparent
          // Boost dot contrast: dots stay opaque, gaps more transparent
          float boostedDotMask = mix(dotMask * 0.3, 1.0, dotMask);
          color.a *= mix(1.0, boostedDotMask, vignette);

          // Additional smooth vignette fade to eliminate hard edges
          float smoothFadeStart = 0.1;
          float smoothFadeEnd = 0.9;
          float smoothFade = 1.0 - smoothstep(smoothFadeStart, smoothFadeEnd, dist);

          // Combine halftone with smooth fade
          color.a *= smoothFade;

          gl_FragColor = color;
        }
      `,
      transparent: true,
    });

    const postProcessGeometry = new THREE.PlaneGeometry(width / 100, height / 100);
    const postProcessMesh = new THREE.Mesh(postProcessGeometry, halftoneShader);
    postProcessScene.add(postProcessMesh);

    function animate() {
      const animationId = requestAnimationFrame(animate);
      if (sceneRef.current) {
        sceneRef.current.animationId = animationId;
      }

      const currentViewHeight = height / 100;

      columns.forEach(({ group, speed, direction }) => {
        group.children.forEach((cardMesh) => {
          if (direction === "up") {
            cardMesh.position.y += speed;

            if (cardMesh.position.y > currentViewHeight / 2 + ITEM_SIZE * 2) {
              let minY = Infinity;
              group.children.forEach((child) => {
                if (child !== cardMesh && child.position.y < minY) {
                  minY = child.position.y;
                }
              });

              cardMesh.position.y = minY - ITEM_WITH_GAP;

              // Update card with new texture
              const newPhrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];
              const newColor = COLORS[Math.floor(Math.random() * COLORS.length)];

              const card = cardMesh as THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;

              // Dispose old texture
              if (card.userData.texture) {
                card.userData.texture.dispose();
              }

              // Create and apply new texture
              const newTexture = createCardTexture(newPhrase, newColor);
              card.material.map = newTexture;
              card.material.needsUpdate = true;
              card.userData.phrase = newPhrase;
              card.userData.color = newColor;
              card.userData.texture = newTexture;
            }
          } else {
            cardMesh.position.y -= speed;

            if (cardMesh.position.y < -currentViewHeight / 2 - ITEM_SIZE * 2) {
              let maxY = -Infinity;
              group.children.forEach((child) => {
                if (child !== cardMesh && child.position.y > maxY) {
                  maxY = child.position.y;
                }
              });

              cardMesh.position.y = maxY + ITEM_WITH_GAP;

              // Update card with new texture
              const newPhrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];
              const newColor = COLORS[Math.floor(Math.random() * COLORS.length)];

              const card = cardMesh as THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;

              // Dispose old texture
              if (card.userData.texture) {
                card.userData.texture.dispose();
              }

              // Create and apply new texture
              const newTexture = createCardTexture(newPhrase, newColor);
              card.material.map = newTexture;
              card.material.needsUpdate = true;
              card.userData.phrase = newPhrase;
              card.userData.color = newColor;
              card.userData.texture = newTexture;
            }
          }
        });
      });

      // Render cards to texture
      renderer.setRenderTarget(renderTarget);
      renderer.render(scene, camera);

      // Render with halftone effect
      renderer.setRenderTarget(null);
      renderer.render(postProcessScene, camera);
    }

    sceneRef.current = {
      renderer,
      scene,
      camera,
      renderTarget,
      columns,
      animationId: null,
      sharedGeometry,
    };

    animate();

    return () => {
      if (sceneRef.current) {
        if (sceneRef.current.animationId) {
          cancelAnimationFrame(sceneRef.current.animationId);
        }

        // Dispose card textures
        sceneRef.current.columns.forEach(({ group }) => {
          group.children.forEach((cardMesh) => {
            const card = cardMesh as THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
            if (card.userData.texture) {
              card.userData.texture.dispose();
            }
          });
        });

        sceneRef.current.sharedGeometry.dispose();
        sceneRef.current.renderTarget.dispose();
        sceneRef.current.renderer.dispose();

        if (containerRef.current) {
          const canvas = sceneRef.current.renderer.domElement;
          if (canvas.parentNode === containerRef.current) {
            containerRef.current.removeChild(canvas);
          }
        }
      }
    };
  }, [width, height]);

  // Handle resize separately without recreating scene
  useEffect(() => {
    if (!sceneRef.current || width === 0 || height === 0) return;

    const { camera, renderer, renderTarget } = sceneRef.current;

    // Update camera
    camera.left = width / -200;
    camera.right = width / 200;
    camera.top = (height / 200) * 0.85;
    camera.bottom = (height / -200) * 0.85;
    camera.updateProjectionMatrix();

    // Update renderer and render target
    renderer.setSize(width, height);
    renderTarget.setSize(width, height);
  }, [width, height]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full animate-in fade-in duration-3000"
      style={{ overflow: "hidden" }}
    />
  );
}
