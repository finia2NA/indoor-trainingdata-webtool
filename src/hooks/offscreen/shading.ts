import * as THREE from 'three';
import { Image360 } from '../../util/get360s';

export const setShader = (object: THREE.Object3D, shaderName: string, doubleSided: boolean = false) => {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      switch (shaderName) {
        case 'lambert':
          child.material = new THREE.MeshLambertMaterial({
            color: 0xffffff,
            side: doubleSided ? THREE.DoubleSide : THREE.FrontSide,
          });
          break;
        case 'composite':
          const compMat = new THREE.ShadowMaterial({
            color: 0xffffff,
            side: doubleSided ? THREE.DoubleSide : THREE.FrontSide
          }) as any; // Type assertion to bypass TypeScript restrictions


          // Initialize uniforms with null values - will be set later
          compMat.uniforms = {
            sphereMap: { value: null },
            lightPos: { value: null } // x, y, z, course
          };

          compMat.onBeforeCompile = (shader: any) => {
            // link custom uniforms
            shader.uniforms.sphereMap = compMat.uniforms.sphereMap;
            shader.uniforms.lightPos = compMat.uniforms.lightPos;
            // inject world position varying for sphere mapping
            shader.vertexShader = shader.vertexShader.replace(
              '#include <common>',
              `#include <common>
uniform vec4 lightPos;
varying vec3 vWorldPosition;`
            );
            shader.vertexShader = shader.vertexShader.replace(
              '#include <project_vertex>',
              `#include <project_vertex>
  vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;`
            );
            // inject uniforms and varying in fragment shader
            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <common>',
              `#include <common>
varying vec3 vWorldPosition;
uniform vec4 lightPos;
uniform sampler2D sphereMap;`
            );
            // replace fog fragment to sample sphere map on unshadowed fragments
            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <fog_fragment>',
              `if ( gl_FragColor.a < 0.1 ) {
  vec3 lightToFrag = vWorldPosition - lightPos.xyz;
  float course = lightPos.w; // Extract course from 4th component
  vec3 direction = normalize(lightToFrag);
  float x = -direction.x;
  float y = direction.z;
  float z = -direction.y;
  float u = atan(y, x);
  float v = acos(z);
  u = (u + 3.14159265) / (2.0 * 3.14159265);
  v = v / 3.14159265;
  vec4 sphereColor = texture2D(sphereMap, vec2(u, v));

  float distanceToLight = length(lightToFrag);
  float opacity = clamp(1.0 - (distanceToLight - 2.0) / 20.0, 0.0, 1.0);

  gl_FragColor = vec4(sphereColor.rgb, opacity);
} else{
  gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
}
#include <fog_fragment>`
            );
          };
          child.material = compMat;
          break;
        default:
          console.warn('Unknown shader name:', shaderName);
      }
    }
  });
};
export const setUniforms = (object: THREE.Object3D, image360: Image360) => {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh &&
      child.name.startsWith('sceneOBJ') &&
      child.material &&
      (child.material as any).uniforms) {
      const material = child.material as any;

      // Set sphereMap uniform if we have images
      material.uniforms.sphereMap.value = image360.image;

      // Set light position and course from the first 360 image coordinates
      material.uniforms.lightPos.value = new THREE.Vector4(
        image360.x,
        image360.y,
        image360.z,
        image360.course
      );
    }
  });
};

export const createPostMaterial = (targets: THREE.WebGLRenderTarget[]) => {

  // Build the fragment shader with dynamic texture sampling
  const fragmentShader = `
    varying vec2 vUv;
    ${targets.map((_, i) => `uniform sampler2D uTexture${i};`).join('\n    ')}
    
    void main() {
      vec3 sum = vec3(0.0);
      float totalAlpha = 0.0;
      
      ${targets.map((_, i) => `
      vec4 sample${i} = texture2D(uTexture${i}, vUv);
      sum += sample${i}.rgb;
      totalAlpha += sample${i}.a;`).join('')}
      
      vec3 finalColor = totalAlpha > 0.0 ? sum / totalAlpha : vec3(0.0);
      float finalAlpha = totalAlpha > 0.0 ? 1.0 : 0.0;
      
      gl_FragColor = vec4(finalColor, finalAlpha);
    }
  `;

  const vertexShader = `
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;

  // Create uniforms for each texture
  const uniforms: Record<string, any> = {};
  targets.forEach((rt, i) => {
    uniforms[`uTexture${i}`] = { value: rt.texture };
  });

  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true
  });
}