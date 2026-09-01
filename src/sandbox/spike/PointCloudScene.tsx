import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { SpatialEmbedding } from '../../analysis/geometry/SpatialEmbedding.ts';

interface PointCloudSceneProps {
  embeddings: SpatialEmbedding[];
}

const PointCloudScene = ({ embeddings }: PointCloudSceneProps) => {
  const positions = new Float32Array(embeddings.length * 3);
  embeddings.forEach((embedding, index) => {
    positions[index * 3] = embedding.coordinates.x;
    positions[index * 3 + 1] = embedding.coordinates.y;
    positions[index * 3 + 2] = embedding.coordinates.z;
  });

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Canvas camera={{ position: [0, 0, 15], fov: 50 }}>
        <color attach="background" args={['#050505']} />
        <ambientLight intensity={0.6} />
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          </bufferGeometry>
          <pointsMaterial color="#7dd3fc" size={0.08} sizeAttenuation />
        </points>
        <OrbitControls enableDamping />
      </Canvas>
    </div>
  );
};

export default PointCloudScene;
