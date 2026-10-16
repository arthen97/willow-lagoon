# Asset credits / 资产署名

All four Sketchfab models: Creative Commons Attribution 4.0 — https://creativecommons.org/licenses/by/4.0/

- Rocky coast of the Sea of Japan N5 — sepet
  https://sketchfab.com/3d-models/rocky-coast-of-the-sea-of-japan-n5-30ee01d97602460b8c951c34a0e0c74f
- Volcano terrain / environment — teej_FBX
  https://sketchfab.com/3d-models/volcano-terrain-environment-5bd0fcb7455141dfb06ff33b0ea4e79a
- Old Rowboat — TooManyDemons
  https://sketchfab.com/3d-models/old-rowboat-9922d5678af84adeb1c9b479856446ca
- Scanned Tree Trunk — NNihad
  https://sketchfab.com/3d-models/scanned-tree-trunk-f26e87592c724abd92fffa6e3615ba9e

Adaptations: scale, orientation, cropping/cap removal, bank deformation, material wetness and scene assembly by this project.

Poly Haven CC0: overcast_soil_puresky, aerial_rocks_01, bark_willow.
https://polyhaven.com/a/overcast_soil_puresky
https://polyhaven.com/a/aerial_rocks_01
https://polyhaven.com/a/bark_willow

Additional cloud HDRI: Kloofendal 48d Partly Cloudy (Pure Sky), Greg Zaal / Jarod Guest, CC0. Desaturated for the rainy shot.
https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky

## S07 added CC0 inputs

- Willow bark: https://polyhaven.com/a/bark_willow
- Forest ground: https://polyhaven.com/a/forrest_ground_01
- Moss rock scans: https://polyhaven.com/a/rock_moss_set_01

Adaptations: physical texture scale, darker wet albedo, normal/height treatment, normalized rock origins, Geometry Nodes scattering. Sources and file checksums: assets/S07/manifest.json.

## S08 modeled willow

Willow geometry was remodeled procedurally in Blender for this project; it is not a Sketchfab tree scan. Reuses the CC0 Poly Haven Willow Bark textures credited above. The previously downloaded Sketchfab cut stump is retained hidden, with its original credit. No additional paid generation.

## S09 environment

- Kloofendal Overcast (Pure Sky), Poly Haven, CC0: https://polyhaven.com/a/kloofendal_overcast_puresky . Current S09 illumination, reflections and background.
- Quarry Cloudy, Poly Haven, CC0: https://polyhaven.com/a/quarry_cloudy . Reviewed but not used in current S09 world.
- Existing licensed moss stone scans, willow bark, forest litter, Gaea volcano, old rowboat and Meshy astronaut reused. Slender willow and understory modeled in Blender. Official/local checksums: assets/S09/manifest.json. No new paid generation.

## 2026-10-15 opening poster

- Superseded opening key art generated with OpenAI GPT Image 2.5 via Higgsfield on October 15. Replaced by the Midjourney artwork below.
- Generation estimate: 4.5 credits. The poster is original generated artwork; the title is typeset by the page, not baked into the image.
- The Merouter sound prompt is saved at `assets/willow-lagoon-ambient.prompt.md`. The generated 90-second ElevenLabs Music v1 track is bundled as `assets/willow-lagoon-ambient.mp3` and loops in-game. Local synthesized rain remains a fallback.

## 2026-10-16 survival chapter

- Kenney Graveyard Kit, CC0: https://kenney.nl/assets/graveyard-kit . Used column-large, stone-wall-damaged, debris, altar-stone and their colormap. Scaled, rearranged and assigned weathered materials. License copied to `assets/story/cc0/LICENSE-Kenney.txt`.
- Kenney Nature Kit, CC0: https://kenney.nl/assets/nature-kit . Used plant_bushDetailed and grass_leafsLarge. Recolored and combined with original oxygen-plant geometry. License copied to `assets/story/cc0/LICENSE-Nature-Kenney.txt`.
- Four satirical portrait busts generated with Meshy 7.1: Trump, Cristiano Ronaldo, LeBron James, Elon Musk. 20 credits each / 80 credits total. Static meshes, no rig. Original task records and complete source downloads are preserved under `work/story/`. Editable Blender collection and source metadata under `assets/story/portraits/`. AI-generated assets are not represented as CC0 third-party models.
- 15 Chinese protagonist voice clips generated through Merouter `eleven_v4`, stock actor voice JBFqnCBsd6RMkjVDRZzb. No public-figure voice cloning. Audio under `assets/story/voice/`; script in `story-data.js`, request records under `work/story/voice-manifest.json`.
- Planet reference: NASA, https://science.nasa.gov/missions/webb/nasa-webb-looks-at-earth-sized-habitable-zone-exoplanet-trappist-1-e/ . Planet identity is factual; ecology, atmosphere depiction, ruins, future history and celebrity statements are invented satire.

## 2026-10-16 camp and ecology revision

- English voice replaces the active Mandarin track. 31 English lines generated through Merouter `eleven_v4`, stock actor voice JBFqnCBsd6RMkjVDRZzb, stored in `assets/story/voice-en/`. The old Mandarin files are archived and not requested by current gameplay.
- Astronaut source was uploaded to Meshy after explicit user authorization. Rigging task `01a14380-ecbe-70aa-a8b8-78bdf1c497fb`; animation task `01a14382-9338-74c4-b491-b5a46d829c32` (Idle, Casual Walk, Run 02, Regular Jump). Estimated rig + four motions: 17 credits. Source and task outputs retained. Local influence correction, false-contact separation and closed caps documented in `work/motion/weight-repair.json`.
- Oxygen cylinders, collection pump, camp, antenna, breathing organisms, membrane fans, enterable cave, mountain height field and shader sky are original procedural project geometry. No third-party Scavengers Reign models or frames are used.
- Ecological reference: [Scavengers Reign / WBD](https://press.wbd.com/us/property/scavengers-reign/contacts).
- Real-world Earth bulletin: [GDELT DOC 2](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/), [BBC World RSS](https://feeds.bbci.co.uk/news/world/rss.xml). Each displayed item links to its publisher and retains its source date. News titles belong to their publishers. English narration is generated with Merouter Eleven v4 and cached per bulletin.
- Earth overview facts: [NASA Facts About Earth](https://science.nasa.gov/earth/facts/). Factual present-day news and overview are distinguished from the fictional future expedition.


## 2026-10-16 textured public release (supersedes procedural camp revision)

- Mountain walls: **Coastal Cliff 01**, Rob Tuytel / Rico Cilliers, Poly Haven, CC0. https://polyhaven.com/a/coastal_cliff_01 . Downloaded scanned mesh, reduced to 50,000 triangles with original albedo, normal and ARM maps; transformed to frame the island.
- Enterable cave, weathered columns, stone bases and rubble: **3TD Cave Pack Pro v1.0**, Ron Kapaun / 3TD Studios, CC0. https://opengameart.org/content/3td-cave-pack-pro-v10 . Original DAE meshes and UVs retained; relocated original stone textures reconnected, collision duplicates removed, coordinates normalized and GLB exports compressed. CaveChamber_02, Stalagmite_01, Cliff_01, CubeRock_01 and RockPile_01 are used.
- Ground vegetation: **Grass Medium 01**, Poly Haven, CC0. https://polyhaven.com/a/grass_medium_01 . Original textured grass tuft instanced across the terrain. Replaces procedural blades and the temporary Kenney grass.
- Oxygen tank, collector, communications station, lung organism and fan organism: Meshy 7.1, five preview + PBR refine tasks. Four existing portrait busts also received PBR refine textures. Total new Meshy charge: 190 credits. Original 2K textures retained locally; runtime copies use 1K albedo, normal and metallic/roughness maps. These generated assets are not labelled CC0.
- New score and two environmental beds: Merouter / ElevenLabs Music v1. Runtime loops: approximately 85s score, 50s exterior atmosphere and 57s cave atmosphere, mastered with a 3-second seam crossfade and normalized loudness. Separate stems crossfade by player position and duck under English speech. They replace the old ambient loop and local noise synthesis.
- Runtime materials preserve imported PBR maps. No flat white material override is applied. Earlier procedural camp, cylinders, fan plants, cave and generated mountain geometry are retired. The earlier modeled willow and escape pod remain legacy assets in the original shore scene; they are not represented as downloaded CC0 models.
- Runtime source and SHA256 manifest: `assets/world/manifest.json`. Raw downloads, task records and editable Blender checkpoints are retained in the local production archive and excluded from the public game repository.


## 开场与交互 · 2026-10-16

- Tech Text：React Bits / David Haz，官方 JS-CSS 组件集成于游戏开场。来源：https://reactbits.dev/text-animations/tech-text 。许可证：`assets/ui/REACT-BITS-LICENSE.md`（MIT + Commons Clause）。React 运行时许可证保留于打包文件附带 notices。
- 剧情序章：Merouter / Seedance 2.5（服务返回模型 `dreamina-seedance-2-5-260628`），24 秒 CG。
- 序章英语旁白：Merouter / Eleven v4，沿用主角原创演员音色。
- 雕像打击碎屑复用既有 CC0 岩石资产；原有 Meshy 石膏像和幽默配音保留。

- 英文出品片头：React Bits / David Haz 的 [Stroke Text](https://reactbits.dev/text-animations/stroke-text) 与 [Laser Flow](https://reactbits.dev/animations/laser-flow)，采用同目录 React Bits 许可证。Laser Flow 在片头结束时释放 WebGL 上下文。

## 2026-10-16 · EARTH, DO YOU COPY? opening key art

- Generated through Merouter using `mj-fast-imagine-v8.1`; returned generation prompt confirms `--v 8.1 --ar 16:9` (stylize 350).
- Selected fourth individual image, 1456 × 816. Original: `assets/opening-poster.png`; optimized web JPEG: `assets/opening-poster.jpg`.
- Blue-green alien ecology, mineral ruins and an astronaut with oxygen cylinders. Game title is live HTML, not baked into the image.

## 2026-10-16 · Social introduction image

- `assets/social/earth-do-you-copy-intro.jpg`: promotional layout made with the built-in image-generation tool, using this project’s Merouter Midjourney 8.1 cover as reference. Chinese typography explains the gameplay loop. Marked as concept artwork, not a gameplay screenshot.
