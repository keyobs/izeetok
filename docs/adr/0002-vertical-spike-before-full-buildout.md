# Vertical spike before full V1-V4 buildout

The V4 spec is written as a consumer contract against V3's `SpatialEmbedding`, but none of V1 through V4 is built yet. Rather than building each version fully in sequence (V1 → V2 → V3 → V4), we're building a thin end-to-end slice first: `Grid → FeatureExtractor → GeometryDescriptor → PCA → SpatialEmbedding-shaped coordinates → a bare three.js point cloud`, deferring clustering, the Ship/Autopilot/HUD navigation layer, and every other page (`/evaluation`, `/draws`, `/geometry`, `/laboratory`, `/discovery`) until the spike proves the contract out.

A mismatch discovered in the `SpatialEmbedding` shape only once real 3D rendering is attempted against it would be far more expensive to fix after V1-V3 were already fully built in isolation.
