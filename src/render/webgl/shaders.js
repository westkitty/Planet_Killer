export const SURFACE_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec2 aUv;
uniform mat4 uModel;
uniform mat4 uViewProj;
out vec3 vNormal;
out vec3 vWorld;
out vec2 vUv;
void main(){vec4 w=uModel*vec4(aPosition,1.0);vWorld=w.xyz;vNormal=mat3(uModel)*aNormal;vUv=aUv;gl_Position=uViewProj*w;}`;

export const SURFACE_FS = `#version 300 es
precision highp float;
in vec3 vNormal;in vec3 vWorld;in vec2 vUv;
uniform sampler2D uSurface;
uniform sampler2D uTsunami;
uniform vec3 uTarget;
uniform vec3 uSun;
uniform vec3 uCamera;
uniform float uCrater;
uniform float uFlash;
uniform float uDarkness;
uniform float uTsunamiMix;
out vec4 outColor;
void main(){
 vec4 tex=texture(uSurface,vUv);vec3 n=normalize(vNormal);vec3 l=normalize(uSun);vec3 viewDir=normalize(uCamera-vWorld);float ndl=max(dot(n,l),0.0);
 float limb=pow(1.0-max(dot(n,viewDir),0.0),2.2);float ocean=tex.a;
 vec3 base=tex.rgb*(0.17+0.88*ndl);float spec=pow(max(dot(reflect(-l,n),viewDir),0.0),56.0)*ocean*0.7;base+=vec3(0.55,0.72,0.82)*spec;
 float d=acos(clamp(dot(normalize(vWorld),normalize(uTarget)),-1.0,1.0));float crater=1.0-smoothstep(0.015,0.075+uCrater*0.06,d);float rim=smoothstep(0.025,0.055,d)*(1.0-smoothstep(0.055,0.095,d))*uCrater;
 base=mix(base,vec3(0.025,0.018,0.012),crater*uCrater);base+=vec3(1.0,0.27,0.035)*rim*1.8;
 vec4 wave=texture(uTsunami,vUv);base+=vec3(0.18,0.58,0.92)*wave.r*wave.g*uTsunamiMix*ocean;
 base*=1.0-uDarkness*0.72;base+=vec3(1.0,0.84,0.58)*uFlash;base+=vec3(0.07,0.12,0.18)*limb*(0.3+0.5*ocean);
 outColor=vec4(base,1.0);
}`;

export const ATMOSPHERE_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition;
uniform mat4 uModel;uniform mat4 uViewProj;
out vec3 vWorld;out vec3 vNormal;
void main(){vec4 w=uModel*vec4(aPosition,1.0);vWorld=w.xyz;vNormal=mat3(uModel)*aPosition;gl_Position=uViewProj*w;}`;

export const ATMOSPHERE_FS = `#version 300 es
precision highp float;
in vec3 vWorld;in vec3 vNormal;uniform vec3 uCamera;uniform float uDarkness;uniform float uFlash;out vec4 outColor;
void main(){vec3 n=normalize(vNormal);vec3 viewDir=normalize(uCamera-vWorld);float f=pow(1.0-abs(dot(n,viewDir)),2.8);vec3 c=mix(vec3(0.10,0.34,0.72),vec3(0.54,0.77,1.0),f);c*=1.0-uDarkness*0.6;c+=uFlash*vec3(1.0,0.65,0.25);outColor=vec4(c,f*0.52);}`;

export const POINT_VS = `#version 300 es
precision highp float;
layout(location=0) in vec4 aPoint;
uniform mat4 uViewProj;uniform float uSize;uniform float uIntensity;
out float vAlpha;
void main(){gl_Position=uViewProj*vec4(aPoint.xyz,1.0);gl_PointSize=clamp(aPoint.w*uSize,1.0,30.0);vAlpha=uIntensity;}`;

export const POINT_FS = `#version 300 es
precision highp float;
uniform vec3 uColor;in float vAlpha;out vec4 outColor;
void main(){vec2 q=gl_PointCoord-0.5;float a=smoothstep(0.5,0.05,length(q))*vAlpha;if(a<0.01)discard;outColor=vec4(uColor,a);}`;

export const IMPACTOR_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition;layout(location=1) in vec3 aNormal;
uniform mat4 uViewProj;uniform vec3 uCenter;uniform float uScale;uniform float uDeform;
out vec3 vNormal;out vec3 vLocal;
void main(){float noise=sin(aPosition.x*17.0+aPosition.y*11.0)*sin(aPosition.z*13.0-aPosition.y*7.0);float r=1.0+noise*uDeform;vec3 p=aPosition*r;vLocal=p;vNormal=normalize(aNormal+noise*0.15);gl_Position=uViewProj*vec4(uCenter+p*uScale,1.0);}`;

export const IMPACTOR_FS = `#version 300 es
precision highp float;
in vec3 vNormal;in vec3 vLocal;uniform vec3 uColor;uniform float uHeating;out vec4 outColor;
void main(){vec3 n=normalize(vNormal);float light=0.25+0.75*max(dot(n,normalize(vec3(-0.7,0.4,0.5))),0.0);float fractures=pow(abs(sin(vLocal.x*31.0+vLocal.y*17.0+vLocal.z*23.0)),18.0);vec3 c=uColor*light+fractures*vec3(0.35,0.08,0.02);c=mix(c,vec3(1.0,0.25,0.035),clamp(uHeating,0.0,1.0)*0.72);outColor=vec4(c,1.0);}`;

export const LINE_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition;uniform mat4 uViewProj;uniform mat4 uModel;void main(){gl_Position=uViewProj*uModel*vec4(aPosition,1.0);}`;
export const LINE_FS = `#version 300 es
precision highp float;uniform vec4 uColor;out vec4 outColor;void main(){outColor=uColor;}`;
