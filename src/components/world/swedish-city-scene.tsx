"use client";

import { Html } from "@react-three/drei";
import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import type { WorldVenue } from "@/lib/worlds/types";

type SwedishCitySceneProps = {
  venues: readonly WorldVenue[];
  recommendedVenueId: string | null;
  selectedVenueId: string | null;
  onSelectVenue: (venueId: string) => void;
};

const flatMaterial = { flatShading: true, roughness: 0.9 } as const;

export function SwedishCityScene(props: SwedishCitySceneProps) {
  return (
    <Canvas
      camera={{ far: 80, near: 0.1, position: [11, 12, 11], zoom: 50 }}
      dpr={[1, 1.5]}
      fallback={<div className="size-full bg-[#dce7d8]" />}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      orthographic
    >
      <color args={["#dce7d8"]} attach="background" />
      <ambientLight intensity={1.25} />
      <hemisphereLight color="#fff8e7" groundColor="#6f8871" intensity={1.3} />
      <directionalLight
        color="#fff1d0"
        intensity={2.35}
        position={[-7, 13, 9]}
      />
      <CameraRig
        selectedVenue={
          props.venues.find((venue) => venue.id === props.selectedVenueId) ?? null
        }
      />
      <Town {...props} />
    </Canvas>
  );
}

function CameraRig({ selectedVenue }: { selectedVenue: WorldVenue | null }) {
  const { camera, size } = useThree();
  const lookAt = useRef(new THREE.Vector3(0, 0.35, 0));
  const homePosition = useMemo(() => new THREE.Vector3(11, 12, 11), []);
  const desiredLookAt = useMemo(
    () =>
      selectedVenue
        ? new THREE.Vector3(
            selectedVenue.position[0],
            selectedVenue.kind === "learn" ? 0.9 : 0.65,
            selectedVenue.position[2],
          )
        : new THREE.Vector3(0, 0.35, 0),
    [selectedVenue],
  );
  const desiredPosition = useMemo(
    () =>
      selectedVenue
        ? desiredLookAt.clone().add(new THREE.Vector3(6.5, 7.2, 6.5))
        : homePosition,
    [desiredLookAt, homePosition, selectedVenue],
  );

  useEffect(() => {
    if (!(camera instanceof THREE.OrthographicCamera)) {
      return;
    }
    camera.zoom = size.width < 520 ? 27 : size.width < 850 ? 39 : 50;
    camera.updateProjectionMatrix();
  }, [camera, size.width]);

  useFrame((_, delta) => {
    const amount = 1 - Math.exp(-delta * 3.8);
    camera.position.lerp(desiredPosition, amount);
    lookAt.current.lerp(desiredLookAt, amount);
    camera.lookAt(lookAt.current);
  });

  return null;
}

function Town({
  venues,
  recommendedVenueId,
  selectedVenueId,
  onSelectVenue,
}: SwedishCitySceneProps) {
  return (
    <group>
      <mesh position={[0, -0.34, 0]} receiveShadow>
        <boxGeometry args={[13.8, 0.62, 11.7]} />
        <meshStandardMaterial color="#a9c39f" {...flatMaterial} />
      </mesh>

      <Road position={[0, -0.01, 0]} rotation={0} size={[12.8, 1.45]} />
      <Road position={[0, -0.005, 0]} rotation={Math.PI / 2} size={[10.7, 1.38]} />
      <Road position={[0, 0.005, -4.28]} rotation={0} size={[12.4, 0.72]} />

      <Canal />
      <TownDetails />

      {venues.map((venue) => (
        <Venue
          isRecommended={venue.id === recommendedVenueId}
          isSelected={venue.id === selectedVenueId}
          key={venue.id}
          onSelect={() => onSelectVenue(venue.id)}
          venue={venue}
        />
      ))}
    </group>
  );
}

function Road({
  position,
  rotation,
  size,
}: {
  position: [number, number, number];
  rotation: number;
  size: [number, number];
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh receiveShadow>
        <boxGeometry args={[size[0], 0.06, size[1]]} />
        <meshStandardMaterial color="#d7d0bd" {...flatMaterial} />
      </mesh>
      {[-4.5, -1.5, 1.5, 4.5].map((x) => (
        <mesh key={x} position={[x, 0.04, 0]}>
          <boxGeometry args={[0.7, 0.018, 0.055]} />
          <meshStandardMaterial color="#f6eedc" {...flatMaterial} />
        </mesh>
      ))}
    </group>
  );
}

function Canal() {
  return (
    <group position={[0, -0.04, -5.1]}>
      <mesh receiveShadow>
        <boxGeometry args={[13.2, 0.22, 1.15]} />
        <meshStandardMaterial color="#88b7b2" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[1.45, 0.14, 1.36]} />
        <meshStandardMaterial color="#c39a70" {...flatMaterial} />
      </mesh>
      {[-0.56, 0.56].map((x) => (
        <mesh key={x} position={[x, 0.38, 0]}>
          <boxGeometry args={[0.09, 0.45, 1.36]} />
          <meshStandardMaterial color="#8a674d" {...flatMaterial} />
        </mesh>
      ))}
    </group>
  );
}

function TownDetails() {
  const trees: Array<[number, number, number, number]> = [
    [-6.1, 0, -3.2, 0.8],
    [-5.8, 0, 1.1, 0.95],
    [5.9, 0, -3.25, 0.9],
    [6.05, 0, 1.1, 0.8],
    [-5.7, 0, 4.7, 0.75],
    [5.9, 0, 4.65, 0.9],
  ];

  return (
    <group>
      {trees.map(([x, y, z, scale]) => (
        <Tree key={`${x}:${z}`} position={[x, y, z]} scale={scale} />
      ))}
      <StreetLamp position={[-1.25, 0, -1.05]} />
      <StreetLamp position={[1.25, 0, 1.05]} />
      <StreetLamp position={[-1.25, 0, 1.05]} />
      <StreetLamp position={[1.25, 0, -1.05]} />
    </group>
  );
}

function Venue({
  venue,
  isRecommended,
  isSelected,
  onSelect,
}: {
  venue: WorldVenue;
  isRecommended: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const group = useRef<THREE.Group>(null);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  useFrame((state, delta) => {
    if (!group.current) {
      return;
    }
    const targetScale = isSelected ? 1.055 : hovered ? 1.025 : 1;
    const nextScale = THREE.MathUtils.damp(
      group.current.scale.x,
      targetScale,
      9,
      delta,
    );
    group.current.scale.setScalar(nextScale);
    group.current.position.y = isRecommended
      ? Math.sin(state.clock.elapsedTime * 2.2) * 0.035
      : 0;
  });

  function stopAndSelect(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    onSelect();
  }

  return (
    <group
      onClick={stopAndSelect}
      onPointerOut={() => setHovered(false)}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      position={venue.position}
      ref={group}
    >
      {venue.id === "stadsparken" ? (
        <Park venue={venue} />
      ) : (
        <Building venue={venue} />
      )}
      {isRecommended ? <RecommendationMarker venue={venue} /> : null}
      <Html
        center
        position={[0, venue.id === "stadsparken" ? 2.15 : venue.size[1] + 1.05, 0]}
        style={{ pointerEvents: "none" }}
        zIndexRange={[20, 0]}
      >
        <div
          className={`pointer-events-none whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-extrabold shadow-lg backdrop-blur-md transition ${
            hovered || isRecommended
              ? "border-white/70 bg-forest-950 text-cream-50"
              : "border-white/65 bg-cream-50/88 text-forest-950"
          }`}
        >
          {venue.label}
        </div>
      </Html>
    </group>
  );
}

function Building({ venue }: { venue: WorldVenue }) {
  const [width, height, depth] = venue.size;
  const isStation = venue.id === "centralstationen";
  const isSchool = venue.id === "sprakskolan";
  const isCafe = venue.id === "kafe-linden";
  const frontZ = depth / 2 + 0.025;

  return (
    <group>
      <mesh castShadow position={[0, height / 2, 0]} receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={venue.wallColor} {...flatMaterial} />
      </mesh>
      <mesh castShadow position={[0, height + 0.47, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[Math.max(width, depth) * 0.78, 0.95, 4]} />
        <meshStandardMaterial color={venue.roofColor} {...flatMaterial} />
      </mesh>

      <mesh position={[0, 0.59, frontZ]}>
        <boxGeometry args={[0.55, 1.18, 0.08]} />
        <meshStandardMaterial color="#476153" {...flatMaterial} />
      </mesh>
      <mesh position={[0.16, 0.6, frontZ + 0.05]}>
        <sphereGeometry args={[0.035, 8, 6]} />
        <meshStandardMaterial color="#e8c56c" metalness={0.25} roughness={0.55} />
      </mesh>
      {[-width * 0.29, width * 0.29].map((x) => (
        <Window
          accentColor={venue.accentColor}
          key={x}
          position={[x, height * 0.61, frontZ + 0.02]}
        />
      ))}

      {isCafe ? <CafeDetails depth={depth} width={width} /> : null}
      {isSchool ? <SchoolDetails depth={depth} height={height} /> : null}
      {isStation ? <StationDetails depth={depth} width={width} /> : null}
    </group>
  );
}

function Window({
  position,
  accentColor,
}: {
  position: [number, number, number];
  accentColor: string;
}) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.58, 0.62, 0.07]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={0.16}
          roughness={0.62}
        />
      </mesh>
      <mesh position={[0, 0, 0.045]}>
        <boxGeometry args={[0.055, 0.62, 0.035]} />
        <meshStandardMaterial color="#f7f2df" {...flatMaterial} />
      </mesh>
      <mesh position={[0, 0, 0.045]}>
        <boxGeometry args={[0.58, 0.055, 0.035]} />
        <meshStandardMaterial color="#f7f2df" {...flatMaterial} />
      </mesh>
    </group>
  );
}

function CafeDetails({ width, depth }: { width: number; depth: number }) {
  return (
    <group>
      <mesh castShadow position={[0, 1.4, depth / 2 + 0.28]} rotation={[0.22, 0, 0]}>
        <boxGeometry args={[width * 0.82, 0.1, 0.62]} />
        <meshStandardMaterial color="#f0dfb7" {...flatMaterial} />
      </mesh>
      {[-0.8, 0.8].map((x) => (
        <group key={x} position={[x, 0, depth / 2 + 0.8]}>
          <mesh castShadow position={[0, 0.42, 0]}>
            <cylinderGeometry args={[0.34, 0.34, 0.08, 10]} />
            <meshStandardMaterial color="#d7b38a" {...flatMaterial} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.055, 0.055, 0.42, 8]} />
            <meshStandardMaterial color="#6f6558" {...flatMaterial} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function SchoolDetails({ depth, height }: { depth: number; height: number }) {
  return (
    <group>
      <mesh castShadow position={[0, height + 1.05, 0]}>
        <boxGeometry args={[0.25, 0.92, 0.25]} />
        <meshStandardMaterial color="#496856" {...flatMaterial} />
      </mesh>
      <mesh castShadow position={[0, height + 1.62, 0]}>
        <coneGeometry args={[0.34, 0.48, 4]} />
        <meshStandardMaterial color="#d6a85e" {...flatMaterial} />
      </mesh>
      <mesh position={[0, 1.7, depth / 2 + 0.08]}>
        <circleGeometry args={[0.29, 16]} />
        <meshStandardMaterial color="#f6efd9" {...flatMaterial} />
      </mesh>
    </group>
  );
}

function StationDetails({ width, depth }: { width: number; depth: number }) {
  return (
    <group>
      <mesh position={[0, 1.24, depth / 2 + 0.1]}>
        <boxGeometry args={[1.95, 0.42, 0.11]} />
        <meshStandardMaterial color="#425b58" {...flatMaterial} />
      </mesh>
      <mesh castShadow position={[0, 0.08, depth / 2 + 0.68]}>
        <boxGeometry args={[width + 0.85, 0.12, 0.8]} />
        <meshStandardMaterial color="#a49178" {...flatMaterial} />
      </mesh>
      <mesh position={[0, 1.62, depth / 2 + 0.08]}>
        <circleGeometry args={[0.23, 16]} />
        <meshStandardMaterial color="#f6efd9" {...flatMaterial} />
      </mesh>
    </group>
  );
}

function Park({ venue }: { venue: WorldVenue }) {
  const [width, , depth] = venue.size;
  return (
    <group>
      <mesh receiveShadow position={[0, 0.03, 0]}>
        <cylinderGeometry args={[Math.max(width, depth) * 0.58, Math.max(width, depth) * 0.66, 0.16, 8]} />
        <meshStandardMaterial color={venue.wallColor} {...flatMaterial} />
      </mesh>
      <Tree position={[-0.92, 0.05, -0.45]} scale={0.92} />
      <Tree position={[0.9, 0.05, 0.4]} scale={0.78} />
      <Tree position={[0.58, 0.05, -0.72]} scale={0.58} />
      <Bench position={[-0.1, 0.05, 0.82]} />
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.48, 0.68, 12]} />
        <meshStandardMaterial color="#ddcfaa" {...flatMaterial} />
      </mesh>
    </group>
  );
}

function Tree({
  position,
  scale,
}: {
  position: [number, number, number];
  scale: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 0.54, 0]}>
        <cylinderGeometry args={[0.1, 0.14, 1.08, 7]} />
        <meshStandardMaterial color="#80634d" {...flatMaterial} />
      </mesh>
      <mesh castShadow position={[0, 1.42, 0]}>
        <coneGeometry args={[0.72, 1.45, 7]} />
        <meshStandardMaterial color="#52785b" {...flatMaterial} />
      </mesh>
      <mesh castShadow position={[0, 2.05, 0]}>
        <coneGeometry args={[0.53, 1.12, 7]} />
        <meshStandardMaterial color="#6b9369" {...flatMaterial} />
      </mesh>
    </group>
  );
}

function Bench({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[0, -0.45, 0]}>
      <mesh castShadow position={[0, 0.34, 0]}>
        <boxGeometry args={[1.05, 0.12, 0.38]} />
        <meshStandardMaterial color="#9b6b4d" {...flatMaterial} />
      </mesh>
      {[-0.38, 0.38].map((x) => (
        <mesh key={x} position={[x, 0.16, 0]}>
          <boxGeometry args={[0.09, 0.34, 0.28]} />
          <meshStandardMaterial color="#4d5a50" {...flatMaterial} />
        </mesh>
      ))}
    </group>
  );
}

function StreetLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.65, 0]}>
        <cylinderGeometry args={[0.035, 0.055, 1.3, 8]} />
        <meshStandardMaterial color="#43544b" {...flatMaterial} />
      </mesh>
      <mesh position={[0, 1.35, 0]}>
        <octahedronGeometry args={[0.16, 0]} />
        <meshStandardMaterial
          color="#ffe7a3"
          emissive="#f7c96b"
          emissiveIntensity={0.45}
          roughness={0.6}
        />
      </mesh>
    </group>
  );
}

function RecommendationMarker({ venue }: { venue: WorldVenue }) {
  const marker = useRef<THREE.Group>(null);
  const height = venue.id === "stadsparken" ? 2.35 : venue.size[1] + 1.3;

  useFrame((state) => {
    if (marker.current) {
      marker.current.position.y = height + Math.sin(state.clock.elapsedTime * 2.4) * 0.14;
      marker.current.rotation.y = state.clock.elapsedTime * 0.65;
    }
  });

  return (
    <group position={[0, height, 0]} ref={marker}>
      <mesh castShadow>
        <octahedronGeometry args={[0.25, 0]} />
        <meshStandardMaterial
          color="#f2c66d"
          emissive="#e9a84d"
          emissiveIntensity={0.24}
          {...flatMaterial}
        />
      </mesh>
    </group>
  );
}
