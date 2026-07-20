import { useRef, useEffect, type MutableRefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { computeRotation, type Pointer } from './service-scene-math';

gsap.registerPlugin(ScrollTrigger);

export type ServiceVariant = 'web' | 'video' | 'graphics';

interface ServiceSceneProps {
  variant: ServiceVariant;
  sectionId: string;
}

function VariantMesh({
  variant,
  progress,
  pointer,
}: {
  variant: ServiceVariant;
  progress: MutableRefObject<number>;
  pointer: MutableRefObject<Pointer>;
}) {
  const group = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!group.current) return;
    const next = computeRotation(progress.current, pointer.current, group.current.rotation);
    group.current.rotation.x = next.x;
    group.current.rotation.y = next.y;
    group.current.rotation.z = next.z;
  });

  const geometry =
    variant === 'web' ? (
      <icosahedronGeometry args={[1.2, 1]} />
    ) : variant === 'video' ? (
      <cylinderGeometry args={[1, 1, 0.25, 24, 1, true]} />
    ) : (
      <boxGeometry args={[1.6, 1.6, 0.15]} />
    );

  return (
    <group ref={group}>
      <mesh>
        {geometry}
        <meshStandardMaterial
          color="#141414"
          wireframe={variant === 'web'}
          emissive="#FF6B4A"
          emissiveIntensity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export default function ServiceScene({ variant, sectionId }: ServiceSceneProps) {
  const progress = useRef(0);
  const pointer = useRef<Pointer>({ x: 0, y: 0 });

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: `#${sectionId}`,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        progress.current = self.progress;
      },
    });

    const handlePointerMove = (event: PointerEvent) => {
      pointer.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: (event.clientY / window.innerHeight) * 2 - 1,
      };
    };
    window.addEventListener('pointermove', handlePointerMove);

    return () => {
      trigger.kill();
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [sectionId]);

  return (
    <Canvas camera={{ position: [0, 0, 4], fov: 40 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 2, 2]} intensity={0.8} />
      <VariantMesh variant={variant} progress={progress} pointer={pointer} />
    </Canvas>
  );
}
