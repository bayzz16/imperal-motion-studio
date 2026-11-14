import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import {BackSide} from 'three';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {CelestialBody} from './CelestialBody';
import {getOrbitPosition} from './solar-system-kinematics';

type PlanetDefinition = {
  name: string;
  color: string;
  radius: number;
  orbit: number;
  period: number;
  inclination: number;
  ring?: boolean;
};

const PLANETS: PlanetDefinition[] = [
  {name: 'Merkurius', color: '#a9a39b', radius: 0.075, orbit: 1.35, period: 760, inclination: 0.24},
  {name: 'Venus', color: '#d9b17c', radius: 0.12, orbit: 1.9, period: 1120, inclination: 0.28},
  {name: 'Bumi', color: '#328bd0', radius: 0.14, orbit: 2.5, period: 1540, inclination: 0.32},
  {name: 'Mars', color: '#c76f4c', radius: 0.105, orbit: 3.05, period: 1980, inclination: 0.36},
  {name: 'Jupiter', color: '#d6ad83', radius: 0.29, orbit: 3.75, period: 2780, inclination: 0.4},
  {name: 'Saturnus', color: '#e7d5a7', radius: 0.24, orbit: 4.55, period: 3500, inclination: 0.44, ring: true},
  {name: 'Uranus', color: '#83cbd2', radius: 0.19, orbit: 5.2, period: 4200, inclination: 0.48},
  {name: 'Neptunus', color: '#4d75c7', radius: 0.18, orbit: 5.85, period: 5000, inclination: 0.52},
];

const STARS = Array.from({length: 72}, (_, index) => ({
  x: ((index * 73) % 211) / 20 - 5.25,
  y: ((index * 127) % 163) / 20 - 4.075,
  z: -1.5 - (index % 7) * 0.42,
  size: index % 9 === 0 ? 0.027 : 0.014,
  opacity: 0.35 + (index % 5) * 0.12,
}));

const Planet: React.FC<{planet: PlanetDefinition; frame: number}> = ({planet, frame}) => {
  const position = getOrbitPosition(frame, planet.orbit, planet.period, planet.inclination);
  const spin = frame * 0.012;

  return (
    <>
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[planet.orbit, 0.006, 4, 128]} />
        <meshBasicMaterial color="#9bb8df" transparent opacity={0.2} />
      </mesh>
      <group position={position}>
        <mesh rotation={[0.18, spin, 0.08]}>
          <sphereGeometry args={[planet.radius, 32, 24]} />
          <meshStandardMaterial color={planet.color} roughness={0.78} metalness={0.04} />
        </mesh>
        {planet.ring && (
          <mesh rotation={[0.58, 0.22, 0.18]}>
            <torusGeometry args={[planet.radius * 1.52, planet.radius * 0.22, 8, 64]} />
            <meshStandardMaterial color="#e8d7b5" roughness={0.82} metalness={0.12} />
          </mesh>
        )}
      </group>
    </>
  );
};

const SolarSystemScene: React.FC<{frame: number}> = ({frame}) => (
  <>
    <ambientLight intensity={0.52} />
    <pointLight position={[0, 0, 1.5]} intensity={85} distance={18} decay={2} color="#ffd89a" />
    <mesh>
      <sphereGeometry args={[0.72, 48, 48]} />
      <meshStandardMaterial
        color="#ff9c32"
        emissive="#ff7417"
        emissiveIntensity={1.8}
        roughness={0.34}
      />
    </mesh>
    <mesh scale={[1.12, 1.12, 1.12]}>
      <sphereGeometry args={[0.72, 40, 40]} />
      <meshBasicMaterial color="#ffb347" transparent opacity={0.11} side={BackSide} />
    </mesh>
    {PLANETS.map((planet) => (
      <Planet key={planet.name} planet={planet} frame={frame} />
    ))}
    {STARS.map((star, index) => (
      <mesh key={index} position={[star.x, star.y, star.z]}>
        <sphereGeometry args={[star.size, 6, 6]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={star.opacity} />
      </mesh>
    ))}
  </>
);

class SolarSystemErrorBoundary extends React.Component<
  {children: React.ReactNode},
  {hasError: boolean}
> {
  state = {hasError: false};

  static getDerivedStateFromError() {
    return {hasError: true};
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <CelestialBody id="solar-system-render-fallback" kind="sun" size={390} atmosphere />
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * A real Three.js scene whose animation is driven exclusively by Remotion frames.
 * The fallback keeps the composition renderable if a host cannot initialize WebGL.
 */
export const SolarSystem3D: React.FC = () => {
  const frame = useCurrentFrame();
  const {width} = useVideoConfig();
  const canvasHeight = 860;

  return (
    <SolarSystemErrorBoundary>
      <ThreeCanvas
        width={width}
        height={canvasHeight}
        camera={{position: [0, 0, 12], fov: 42}}
        gl={{alpha: true, antialias: true}}
        style={{width: '100%', height: '100%', background: 'transparent'}}
      >
        <SolarSystemScene frame={frame} />
      </ThreeCanvas>
    </SolarSystemErrorBoundary>
  );
};
