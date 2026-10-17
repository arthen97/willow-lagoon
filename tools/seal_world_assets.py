"""Repair existing CC0 assets; preserve authored UVs, textures and cave openings."""
import bpy,bmesh,json,pathlib
R=pathlib.Path(__file__).resolve().parents[1]
report=[]
for name,thickness,small_hole in [('coastal-cliff',.32,.35),('cave-chamber',.09,.24)]:
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 bpy.ops.import_scene.gltf(filepath=str(R/'assets/world'/f'{name}.glb'))
 entry={'source':name,'meshes':[]}
 for obj in list(bpy.context.scene.objects):
  if obj.type!='MESH':continue
  bpy.context.view_layer.objects.active=obj;obj.select_set(True)
  bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
  bm=bmesh.new();bm.from_mesh(obj.data)
  bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00005)
  edges={e for e in bm.edges if e.is_boundary};before=len(edges);filled=0
  # Only close tiny isolated holes. Large cave entrances remain open.
  while edges:
   seed=edges.pop();component={seed};todo=[seed]
   while todo:
    e=todo.pop()
    for v in e.verts:
     for neighbor in v.link_edges:
      if neighbor in edges:edges.remove(neighbor);component.add(neighbor);todo.append(neighbor)
   verts={v for e in component for v in e.verts}
   size=max((max(v.co[k] for v in verts)-min(v.co[k] for v in verts)) for k in range(3))
   closed=all(sum(e in component for e in v.link_edges)==2 for v in verts)
   if closed and size<small_hole:
    bmesh.ops.holes_fill(bm,edges=list(component),sides=0);filled+=1
  if name=='coastal-cliff':
   # Fade the scan's straight end cuts below its existing buried base.
   lo=min(v.co.x for v in bm.verts);hi=max(v.co.x for v in bm.verts);base=min(v.co.z for v in bm.verts);margin=(hi-lo)*.085
   for v in bm.verts:
    t=max(0,min(1,min(v.co.x-lo,hi-v.co.x)/margin));v.co.z=base+(v.co.z-base)*(t*t*(3-2*t))
   entry['end_taper_fraction']=.085
  bm.to_mesh(obj.data);bm.free();obj.data.update()
  for poly in obj.data.polygons:poly.use_smooth=True
  # A real shell closes exposed scan rims and prevents backface light leaks.
  shell=obj.modifiers.new('Sealed scan rim','SOLIDIFY');shell.thickness=thickness;shell.offset=1; shell.use_even_offset=True
  bpy.ops.object.modifier_apply(modifier=shell.name)
  for mat in obj.data.materials:
   if mat:mat.use_backface_culling=False
  entry['meshes'].append({'name':obj.name,'boundary_edges_before':before,'small_holes_closed':filled,'shell_thickness_m':thickness})
 bpy.ops.export_scene.gltf(filepath=str(R/'assets/world'/f'{name}-sealed.glb'),export_format='GLB',export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6,export_image_format='AUTO')
 report.append(entry)
(R/'docs/design/2026-10-17-asset-sealing.json').write_text(json.dumps(report,indent=2))
