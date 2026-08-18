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
uniform vec3 uTargetEast;
uniform vec3 uSun;
uniform vec3 uCamera;
uniform float uCrater;
uniform float uCraterRadius;
uniform float uRimHeat;
uniform float uFlash;
uniform float uFireball;
uniform float uThermal;
uniform float uDarkness;
uniform float uDust;
uniform float uTsunamiMix;
out vec4 outColor;

void main(){
 vec4 tex=texture(uSurface,vUv);
 vec3 n=normalize(vNormal);
 vec3 l=normalize(uSun);
 vec3 viewDir=normalize(uCamera-vWorld);
 float ndl=dot(n,l);
 float ocean=tex.a;

 // --- day / night with a narrow scattering terminator -------------------
 float day=smoothstep(-0.05,0.13,ndl);
 float twilight=(1.0-abs(smoothstep(-0.16,0.20,ndl)*2.0-1.0));
 vec3 albedo=tex.rgb;

 vec3 lit=albedo*(0.16+1.55*pow(max(ndl,0.0),0.78));
 float spec=pow(max(dot(reflect(-l,n),viewDir),0.0),96.0)*ocean*day*0.42;
 lit+=vec3(0.62,0.78,0.88)*spec;
 lit+=vec3(1.0,0.50,0.20)*twilight*0.26;                 // sunrise/sunset band

 vec3 night=albedo*vec3(0.022,0.036,0.062);               // earthshine, cool
 night+=vec3(0.010,0.030,0.062)*ocean;
 vec3 base=mix(night,lit,day);

 // --- crater: dark floor, molten rim, radial ejecta rays ----------------
 vec3 dir=normalize(vWorld);
 float d=acos(clamp(dot(dir,normalize(uTarget)),-1.0,1.0));
 float r=max(0.004,uCraterRadius);
 float floorMask=(1.0-smoothstep(r*0.55,r*1.0,d))*uCrater;
 float rimMask=(smoothstep(r*0.72,r*0.98,d)*(1.0-smoothstep(r*1.02,r*1.5,d)))*uCrater;

 vec3 east=normalize(uTargetEast);
 vec3 north=normalize(cross(normalize(uTarget),east));
 float ang=atan(dot(dir,north),dot(dir,east));
 float rays=pow(abs(sin(ang*9.0)),6.0)*(1.0-smoothstep(r*1.1,r*7.0,d))*uCrater;

 base=mix(base,vec3(0.016,0.012,0.010),floorMask);
 base=mix(base,vec3(0.055,0.042,0.036),(1.0-smoothstep(r*1.2,r*4.5,d))*uCrater*0.55); // ejecta blanket
 base+=vec3(1.0,0.30,0.05)*rimMask*(0.7+2.6*uRimHeat);
 base+=vec3(0.62,0.50,0.42)*rays*0.13;

 // --- tsunami front ----------------------------------------------------
 vec4 wave=texture(uTsunami,vUv);
 // The travelling front should read even where the modelled amplitude is low.
 float front=wave.r;
 base+=vec3(0.24,0.66,0.98)*front*(0.40+0.60*wave.g)*uTsunamiMix*ocean*2.4;
 base+=vec3(0.72,0.92,1.0)*pow(front,6.0)*uTsunamiMix*ocean*0.5;

 // --- global ejecta re-entry: night side glows dull red -----------------
 base+=vec3(0.78,0.19,0.05)*uThermal*(0.10+0.28*(1.0-day));

 // --- impact winter: dim, desaturate, load a grey-brown haze ------------
 float grey=dot(base,vec3(0.299,0.587,0.114));
 base=mix(base,vec3(grey),uDarkness*0.62);
 base*=1.0-uDarkness*0.80;
 base=mix(base,vec3(0.085,0.075,0.068),uDust*0.42);

 // --- contact flash: seared at the point, only lifted globally ----------
 float local=exp(-d*d*38.0);
 base+=vec3(1.0,0.58,0.20)*uFireball*exp(-d*d/(r*r*0.9))*1.7;
 base+=vec3(1.0,0.88,0.66)*uFlash*(0.09+2.0*local);
 float limb=pow(1.0-max(dot(n,viewDir),0.0),3.0);
 base+=vec3(0.10,0.20,0.34)*limb*day*0.55;

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
in vec3 vWorld;in vec3 vNormal;
uniform vec3 uCamera;uniform vec3 uSun;
uniform float uDarkness;uniform float uDust;uniform float uFlash;
uniform float uFireball;uniform float uThermal;
out vec4 outColor;
void main(){
 vec3 n=normalize(vNormal);
 vec3 viewDir=normalize(uCamera-vWorld);
 vec3 l=normalize(uSun);
 float f=pow(1.0-abs(dot(n,viewDir)),3.1);
 float ndl=dot(n,l);
 float lightSide=smoothstep(-0.35,0.32,ndl);
 // Rayleigh-ish: deep blue high, pale cyan at the horizon, warm at the terminator
 vec3 sky=mix(vec3(0.06,0.24,0.62),vec3(0.58,0.80,1.0),f);
 float warm=(1.0-abs(smoothstep(-0.40,0.36,ndl)*2.0-1.0));
 sky=mix(sky,vec3(1.0,0.46,0.18),warm*0.55);
 sky*=1.0-uDarkness*0.55;
 sky=mix(sky,vec3(0.36,0.30,0.26),uDust*0.6);
 sky+=uFlash*vec3(1.0,0.70,0.30);
 sky+=uThermal*vec3(0.60,0.16,0.05);
 float alpha=f*(0.10+0.72*lightSide)*(1.0-uDarkness*0.30);
 outColor=vec4(sky,alpha);
}`;

export const POINT_VS = `#version 300 es
precision highp float;
layout(location=0) in vec4 aPoint;
uniform mat4 uViewProj;uniform float uSize;uniform float uIntensity;
out float vAlpha;out float vSeed;
void main(){gl_Position=uViewProj*vec4(aPoint.xyz,1.0);gl_PointSize=clamp(aPoint.w*uSize,1.0,34.0);vAlpha=uIntensity*(0.55+0.65*aPoint.w);vSeed=aPoint.w;}`;

export const POINT_FS = `#version 300 es
precision highp float;
uniform vec3 uColor;uniform float uSoft;in float vAlpha;in float vSeed;out vec4 outColor;
void main(){
 vec2 q=gl_PointCoord-0.5;
 float r=length(q);
 float core=smoothstep(0.5,0.0,r);
 float halo=exp(-r*r*7.0);
 float a=mix(core,core*0.45+halo*0.55,uSoft)*vAlpha;
 if(a<0.008)discard;
 outColor=vec4(uColor,a);
}`;

export const IMPACTOR_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition;layout(location=1) in vec3 aNormal;
uniform mat4 uViewProj;uniform vec3 uCenter;uniform float uScale;uniform float uDeform;
out vec3 vNormal;out vec3 vLocal;
void main(){float noise=sin(aPosition.x*17.0+aPosition.y*11.0)*sin(aPosition.z*13.0-aPosition.y*7.0);float r=1.0+noise*uDeform;vec3 p=aPosition*r;vLocal=p;vNormal=normalize(aNormal+noise*0.15);gl_Position=uViewProj*vec4(uCenter+p*uScale,1.0);}`;

export const IMPACTOR_FS = `#version 300 es
precision highp float;
in vec3 vNormal;in vec3 vLocal;uniform vec3 uColor;uniform float uHeating;out vec4 outColor;
void main(){vec3 n=normalize(vNormal);float light=0.18+0.82*max(dot(n,normalize(vec3(-0.7,0.4,0.5))),0.0);float fractures=pow(abs(sin(vLocal.x*31.0+vLocal.y*17.0+vLocal.z*23.0)),18.0);vec3 c=uColor*light+fractures*vec3(0.35,0.08,0.02);float h=clamp(uHeating,0.0,1.0);c=mix(c,vec3(1.0,0.30,0.05),h*0.78);c+=vec3(1.0,0.72,0.34)*h*h*0.55;outColor=vec4(c,1.0);}`;

export const LINE_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition;uniform mat4 uViewProj;uniform mat4 uModel;void main(){gl_Position=uViewProj*uModel*vec4(aPosition,1.0);}`;
export const LINE_FS = `#version 300 es
precision highp float;uniform vec4 uColor;out vec4 outColor;void main(){outColor=uColor;}`;
