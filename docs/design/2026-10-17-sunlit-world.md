# Sunlit ecological world

## Art direction
Cool blue-green skylight, pale warm directional sun, grounded soil hues, painted diffuse planes and fine silhouettes. A single shared sun direction drives the visible solar disc, directional shadows, water glints, cloud projection and volumetric scattering. Bloom is limited to HDR highlights.

## Implementation
- Shared lighting profile; sky baked into a PMREM environment at load time. Existing HDRI contributes subtle sky variation.
- Sun intensity 2.65, exposure 0.88, bloom 0.28, ink 0.68.
- Directional shadow coverage follows the camera target. Trees and repaired cave cast shadows.
- Depth-aware air scattering rendered at one third resolution per dimension, bilaterally reconstructed in the contour pass before bloom/output. 16 ray samples on desktop / 10 on touch; samples stop at scene depth and use the actual packed directional shadow map. Cloud transmission modulates sunlight and scattering.
- Restored terrain normal strength, damp shore roughness, modest clearcoat; material reflection retained separately from cel diffuse. Restored authored astronaut roughness range.
- Existing terrain UVs continue over a submerged apron; original walking terrain remains unchanged.
- Repaired existing CC0 assets rather than new mountain geometry. Scan ends taper and bases are embedded using footprint height samples. Original cave collision source retained; movement, bone weights and animation clips unchanged.

## Delivery scope
Blender asset export and Pages compilation completed. No gameplay, visual runtime or GPU performance tests run in this update. The scattering pass adds GPU work; representative device performance and all viewpoints remain unverified.
