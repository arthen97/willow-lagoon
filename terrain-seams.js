import * as THREE from 'three';
// Continue the existing terrain mesh and its UVs under the water; no gameplay surface changes.
export function closeTerrainBoundary(ground){
 const source=ground.geometry,p=source.attributes.position,uv=source.attributes.uv,n=source.attributes.normal;
 const nx=source.parameters.widthSegments,nz=source.parameters.heightSegments,stride=nx+1;
 const rim=[];for(let x=0;x<=nx;x++)rim.push(x);for(let z=1;z<=nz;z++)rim.push(z*stride+nx);for(let x=nx-1;x>=0;x--)rim.push(nz*stride+x);for(let z=nz-1;z>0;z--)rim.push(z*stride);
 const positions=[],texcoords=[],indices=[],bands=8,count=rim.length;
 for(let j=0;j<=bands;j++)for(const index of rim){
  const x=p.getX(index),z=p.getZ(index),height=p.getY(index),t=j/bands;
  const dx=x/60,dz=(z-28)/52,length=Math.hypot(dx,dz),spread=(21+3*Math.sin(x*.13+z*.11))*t;
  const xx=x+dx/length*spread,zz=z+dz/length*spread;
  const blend=t*t*(3-2*t),yy=THREE.MathUtils.lerp(height,-3.8,blend);
  positions.push(xx,yy,zz);texcoords.push((xx+22)/44,(14-zz)/32);
 }
 for(let j=0;j<bands;j++)for(let i=0;i<count;i++){const next=(i+1)%count,a=j*count+i,b=j*count+next,c=(j+1)*count+i,d=(j+1)*count+next;indices.push(a,b,c,b,d,c);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(texcoords,2));geo.setIndex(indices);geo.computeVertexNormals();
 // Match the inner seam exactly to the existing terrain normals.
 for(let i=0;i<count;i++)geo.attributes.normal.setXYZ(i,n.getX(rim[i]),n.getY(rim[i]),n.getZ(rim[i]));
 const mesh=new THREE.Mesh(geo,ground.material);mesh.name='GROUND_SUBMERGED_EDGE_REPAIR';mesh.receiveShadow=true;ground.add(mesh);return mesh;
}
