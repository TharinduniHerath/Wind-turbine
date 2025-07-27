import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const WindTurbine3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const turbineGroupRef = useRef<THREE.Group>();
  const rotorRef = useRef<THREE.Group>();

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f8ff);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 5, 10);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Create wind turbine
    const turbineGroup = new THREE.Group();
    turbineGroupRef.current = turbineGroup;
    scene.add(turbineGroup);

    // Base/Foundation
    const baseGeometry = new THREE.CylinderGeometry(1, 1.2, 0.5, 16);
    const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -6;
    base.receiveShadow = true;
    turbineGroup.add(base);

    // Tower
    const towerGeometry = new THREE.CylinderGeometry(0.3, 0.8, 12, 16);
    const towerMaterial = new THREE.MeshLambertMaterial({ color: 0xe0e0e0 });
    const tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.y = 0;
    tower.castShadow = true;
    tower.receiveShadow = true;
    turbineGroup.add(tower);

    // Nacelle (housing)
    const nacelleGeometry = new THREE.BoxGeometry(3, 1.5, 1.5);
    const nacelleMaterial = new THREE.MeshLambertMaterial({ color: 0xf0f0f0 });
    const nacelle = new THREE.Mesh(nacelleGeometry, nacelleMaterial);
    nacelle.position.y = 6.5;
    nacelle.castShadow = true;
    turbineGroup.add(nacelle);

    // Rotor hub
    const hubGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const hubMaterial = new THREE.MeshLambertMaterial({ color: 0x606060 });
    const hub = new THREE.Mesh(hubGeometry, hubMaterial);
    hub.position.set(1.5, 6.5, 0);
    hub.castShadow = true;
    turbineGroup.add(hub);

    // Rotor blades
    const rotorGroup = new THREE.Group();
    rotorRef.current = rotorGroup;
    rotorGroup.position.set(1.5, 6.5, 0);
    turbineGroup.add(rotorGroup);

    // Create three blades
    for (let i = 0; i < 3; i++) {
      const bladeGroup = new THREE.Group();
      
      // Blade geometry (more realistic shape)
      const bladeShape = new THREE.Shape();
      bladeShape.moveTo(0, 0);
      bladeShape.lineTo(0.3, 0.2);
      bladeShape.lineTo(0.8, 4);
      bladeShape.lineTo(0.2, 8);
      bladeShape.lineTo(0, 8);
      bladeShape.lineTo(-0.2, 4);
      bladeShape.lineTo(-0.1, 0.2);
      bladeShape.lineTo(0, 0);

      const extrudeSettings = {
        depth: 0.1,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 2,
        bevelSize: 0.02,
        bevelThickness: 0.02
      };

      const bladeGeometry = new THREE.ExtrudeGeometry(bladeShape, extrudeSettings);
      const bladeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
      const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
      
      blade.castShadow = true;
      blade.position.z = -0.05;
      bladeGroup.add(blade);
      
      // Position each blade at 120-degree intervals
      bladeGroup.rotation.z = (i * Math.PI * 2) / 3;
      rotorGroup.add(bladeGroup);
    }

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -6.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Mouse controls
    let mouseDown = false;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseDown = (event: MouseEvent) => {
      mouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const handleMouseUp = () => {
      mouseDown = false;
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!mouseDown) return;

      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;

      turbineGroup.rotation.y += deltaX * 0.01;
      turbineGroup.rotation.x += deltaY * 0.01;

      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      camera.position.z += event.deltaY * 0.01;
      camera.position.z = Math.max(5, Math.min(20, camera.position.z));
    };

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('wheel', handleWheel);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Rotate the rotor blades
      if (rotorRef.current) {
        rotorRef.current.rotation.z += 0.02;
      }

      // Look at the turbine
      camera.lookAt(turbineGroup.position);
      
      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">3D Turbine Model</h3>
        <div className="text-sm text-gray-500">
          Interactive • Click and drag to rotate, scroll to zoom
        </div>
      </div>
      <div 
        ref={mountRef} 
        className="w-full h-96 bg-gradient-to-b from-blue-50 to-green-50 rounded-lg overflow-hidden"
        style={{ cursor: 'grab' }}
      />
    </div>
  );
};

export default WindTurbine3D;