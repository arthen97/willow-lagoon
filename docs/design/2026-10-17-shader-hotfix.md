# Missing PBR geometry hotfix

The existing deployed Chrome session reported `cloudWorld: redefinition` in MeshStandardMaterial fragment shaders. Three.js unrolls directional-light loops by concatenating their bodies in one scope. The injected local declaration was repeated for each light, preventing every stylized Standard/Physical material from compiling. Water and Basic labels used separate shader programs and remained visible.

Removed the redundant local declaration and pass the existing varying directly. Updated shader program cache key and module URL versions. No gameplay, assets or lighting values changed. Read the existing browser error log for diagnosis; Pages build performed, no gameplay test run.
