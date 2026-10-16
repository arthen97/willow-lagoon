import * as THREE from 'three';
export const LAND_BOUNDS={x0:-60,x1:60,z0:-24,z1:80};
export function expandedHeight(x,z,original){
  const edge=Math.max(THREE.MathUtils.smoothstep(Math.abs(x),12,23),THREE.MathUtils.smoothstep(z,10,18));
  const shore=-4-8*Math.pow(Math.sin(x*.065),2)+2*Math.sin(x*.19);
  const inland=z-shore;
  const rolling=.8+.35*Math.sin(x*.12+z*.08)+.22*Math.sin(z*.27-x*.05);
  const height=THREE.MathUtils.lerp(-1.8,rolling,THREE.MathUtils.smoothstep(inland,-4,6));
  const basin=THREE.MathUtils.lerp(original(x,z),height,edge);
  // Keep only the walking surface. Mountains are imported CC0 meshes.
  const caveBlend=(1-THREE.MathUtils.smoothstep(Math.abs(x+18),4.8,7))*(1-THREE.MathUtils.smoothstep(Math.abs(z-43),8.5,11));
  return THREE.MathUtils.lerp(basin,.85,caveBlend);
}
export function expandGround(ground,heightAt){
  const b=LAND_BOUNDS,geo=new THREE.PlaneGeometry(b.x1-b.x0,b.z1-b.z0,480,416);
  geo.rotateX(-Math.PI/2);geo.translate(0,0,(b.z1+b.z0)/2);
  const p=geo.attributes.position,uv=geo.attributes.uv;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),z=p.getZ(i);p.setY(i,heightAt(x,z));uv.setXY(i,(x+22)/44,(14-z)/32);
  }
  geo.computeVertexNormals();ground.geometry=geo;ground.name='GROUND';
}
