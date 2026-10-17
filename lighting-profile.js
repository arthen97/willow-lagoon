import * as THREE from 'three';
// Shared direction: sky disc, direct lighting, cloud shadows, water and scattering.
export const SUN_DIRECTION=new THREE.Vector3(-.58,.66,.48).normalize();
export const SUN_COLOR=0xffe5b6;
export const atmosphereTime={value:0};
export const cloudGLSL=`
float cloudHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float cloudNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(cloudHash(i),cloudHash(i+vec2(1.,0.)),f.x),mix(cloudHash(i+vec2(0.,1.)),cloudHash(i+1.),f.x),f.y);}
float cloudField(vec2 p){return .57*cloudNoise(p)+.28*cloudNoise(p*2.03+4.7)+.15*cloudNoise(p*4.11-2.1);}
float cloudTransmission(vec3 p,vec3 sun,float t){vec2 q=(p.xz+sun.xz*(75.-p.y)/max(sun.y,.1))*.023+vec2(t*.003,0.);return mix(.38,1.,smoothstep(.36,.63,cloudField(q)));}
`;
