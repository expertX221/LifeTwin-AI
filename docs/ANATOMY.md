# Lifetime AI • Anatomy production handbook

The three deployed organs are anatomical reference meshes. A reference mesh establishes gross anatomy. Tissue detail, measured performance and clinical review are separate milestones. Keep original meshes and credits beside every derived asset. No asset needs to leave the production machine.

## Install the free toolchain

| Task | Install or obtain | License and use |
|---|---|---|
| Reference organs | Download the desired sex/version GLB and metadata from [Human Reference Atlas](https://humanatlas.io/3d-reference-library). Track metadata and attribution per asset. | Project reference organs are attributed CC BY 4.0. Preserve contributor and source names. |
| Segmentation from volumes | Download the stable installer for your OS from [3D Slicer](https://download.slicer.org/). Use Segment Editor on public, licensed reference volumes. | Open-source, BSD-style license. |
| Local AI reconstruction | Clone [TripoSR](https://github.com/VAST-AI-Research/TripoSR), create its Python environment, install requirements and follow its PyTorch/CUDA instructions. Download the linked checkpoint once, then use local inference. | MIT code and weights. Image-conditioned reconstruction, no text endpoint. GPU strongly preferred. |
| Modeling, sculpting, UVs, baking, rigging, animation, preview | Install the LTS build from [Blender](https://www.blender.org/download/). Use Cycles for reference renders and glTF export for the runtime. | GPL, fully local. |
| Mesh repair and QA | Install [MeshLab](https://www.meshlab.net/). Inspect nonmanifold edges, normals, disconnected components and dimensions. | GPL. Keep a master before repair. |
| Painting and masks | Install [Krita](https://krita.org/en/download/). Paint roughness, fiber direction and vessel masks on exported UVs. | GPL. |
| Surface maps and lighting | Download individual CC0 maps from [ambientCG](https://ambientcg.com/) and a neutral studio HDRI from [Poly Haven](https://polyhaven.com/hdris/studio). Use abstract microdetail only. | CC0 assets. Contribution and paid convenience options are optional. |
| Engine and loaders | Install [Node.js LTS](https://nodejs.org/en/download), [Python](https://www.python.org/downloads/) and [Git](https://git-scm.com/downloads). Run npm install in the repository. | Open-source runtimes and compiler. Use Node 22.x for this build. |
| Mesh optimization | npm install -D @gltf-transform/cli from [glTF Transform](https://gltf-transform.dev/cli). Install [KTX-Software](https://github.com/KhronosGroup/KTX-Software/releases) for Basis Universal texture encoding. | Open-source CLI and encoders. |
| Validation | Download a binary from [Khronos glTF Validator](https://github.com/KhronosGroup/glTF-Validator/releases). Validate each LOD and retain its report. | Apache-2.0. |

## Production sequence

1. Lock an atlas version. Record DOI, subject, tissue names, license, orientation and scale. Prepare anterior, posterior and lateral references. Have a reviewer identify chamber boundaries, the aortic arch, pulmonary trunk and coronary course on the master.
2. Duplicate the mesh in Blender. Keep a reference collection and a separate render collection. Repair normals, remove accidental duplicates, preserve vessel lumens and thin folds. Inspect in section. If coarse AI reconstruction is useful, use it only as a sculpt study alongside the atlas.
3. Sculpt at high resolution. Heart detail follows fiber direction. Give the lungs separate lobes and preserve fissures. Preserve the brain hemisphere gap, cerebellum and major sulci. Paint regional thickness and tissue masks. Keep all overlays separate.
4. Retopologize along deformation lines. Give valve/vessel junctions sufficient rings. Retain matching vertex counts and indices across shape keys. Use UV seams on hidden surfaces. Bake tangent-space normals, ambient occlusion and roughness from the high mesh. Export albedo without baked highlights.
5. Author pose keys. Heart: relaxed baseline, atrial squeeze, ventricular shortening, apical twist and return. Pin the great-vessel roots with a weight mask. Lungs: asymmetric inferior/lateral expansion with the hilum anchored. Brain: a very low-amplitude illustrative pulsation and separate masked activity overlay. Scrub each pose individually for intersections.
6. Export GLB 2.0, +Y up, meters, applied transforms, UVs, normals, tangents and morph targets. Export named meshes and preserve attachments. Avoid topology modifiers after creating shape keys. Keep the .blend master outside the client bundle.
7. Start with a mobile target of 20k visible triangles for the heart, 1–4 material draws per organ, a 2K atlas and one loaded organ per view. Build a separate desktop LOD with 4K textures if profiling justifies it. Treat 8K as a master texture or offline render target. A single uncompressed 8K RGBA image is 256 MiB before mipmaps.
8. Inspect with npx gltf-transform inspect heart.glb. Apply deduplication and meshopt compression on a derived copy. Verify named meshes, morph targets and extrema before and after compression. Use KTX2/ETC1S for color maps and UASTC for tangent normals when a local KTX2 loader/transcoder is configured. Ordinary PNG/JPEG maps work with the current loader.
9. Verify load, orbit, zoom, reconnect, missing data and animation rest in desktop browsers and on a mid-range Android device. Measure first visible mesh time, frame time and peak texture memory. Target 33 ms/frame on the test phone. Compare matched-angle images against the reference before claiming realism.

## Reference-image prompts for optional local reconstruction

Render the following briefs from authorized reference views in Blender or use them to guide a sculpt. Feed the resulting single image to local TripoSR. A prompt cannot validate the resulting topology or anatomical accuracy.

**Heart.** Isolated adult human heart, anterior three-quarter orientation, relaxed ventricles, distinct atrial appendages, naturally asymmetric apex, visible proximal aorta and pulmonary trunk, coronary vessels seated in the surface grooves, subtle epicardial fat, restrained wet reflections and mid-scale fiber variation. Neutral orthographic studio light, gray background, sharp silhouette. Avoid lettering, fake ECG traces, severed decorative tubes and baked hard shadows.

**Lungs.** Paired adult lungs in anatomical orientation, right and left lobes, readable oblique fissures, left cardiac notch, short trachea and correctly placed bronchi, soft pleural sheen, fine mottled surface, relaxed inspiration. Show the full bases, avoid mirrored lobes and avoid translucent cutaways.

**Brain.** Isolated adult brain, three-quarter superior view, separated hemispheres, recognizable cortical folds at multiple scales, cerebellum and brainstem retained, pale pink-gray tissue with delicate vascular detail, diffuse neutral light. Avoid duplicated gyri, procedural maze ridges, luminous veins or implied functional activation.

## Materials and real-time integration

Current runtime uses Three 0.170, Fiber 8.18 and Drei 9.122 with React 18. The dashboard dynamically loads the WebGL client. The heart integrates beat phase from valid BPM every frame. A spatially weighted morph target shortens and twists the apex. Loss of BPM returns it to rest. Lungs and brain currently have illustrative controls. Only connect breathing to a validated respiratory-rate channel, and only label an overlay as measured brain activity with an appropriate sensor and validated feature pipeline.

For the final art pass, author four channels: linear roughness, tangent normal, thickness and a vascular mask. Keep albedo in sRGB. Use MeshPhysicalMaterial for broad specular response and a restrained clearcoat lobe. Add thickness-weighted wrap lighting for an inexpensive approximation of subsurface scattering. Use an environment map prefiltered by PMREM. Compare thin and thick areas under a backlight. Avoid uniform red emission. Pass beat phase to the vessel mask for tiny, illustrative changes in color. Oxygen is a scalar readout and cannot locate tissue perfusion.

Use masked local emissive animation on the brain. Label it illustrative unless a real signal supports it. Optional post-processing: [postprocessing](https://github.com/pmndrs/postprocessing) and [React Three Postprocessing](https://github.com/pmndrs/react-postprocessing). For the React 18 stack use the compatible v2 React binding. Apply low-intensity selective bloom only to overlays. Disable bloom, cap device pixel ratio and load the lower LOD first on phones. Keep brand lime on controls and signals. Natural tissue hues preserve surface readability.
