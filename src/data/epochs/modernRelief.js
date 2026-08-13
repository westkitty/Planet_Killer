// Runtime visual derivative: ETOPO1 via basemap-data 2.0.0.
// 32x16 luminance field for visual shading only; never numerical bathymetry.
export const MODERN_RELIEF_WIDTH=32;
export const MODERN_RELIEF_HEIGHT=16;
const B64='hoSAgoeQnKGgprewsKqXhH+Jj5WXmaCfkYR8gZmgj42/sI+WrruxsrWst9/pxbGLjbjIyMG8q6SksLOyqavCwMK0m5aUxs+1ubypoZ+Vpqyxq66zt6B9mbnCs62cp6CRY25hc4uPvNDCxr2cbHV6raeotqiWwMerkJurq6maW1hERVFac4OGx8GUb2dtdlaSnJOSj4mrhI59iqGqeUlPUFxWUlZZfZSYmWk/T15UjMLBuK24p5KilmmCnINUSUlRVFlVVV1sc36MemVZTlWa2c/Izqymd6ufmJ2BRlhMTlZMV1thY2t6foaYo4piX2yQoMvCoHJbe3SRtopgYmptVlNaWWZjb3h1dK2mup5VY1ZnvLCPZnNiWlqJhYuTd3tfaFVgam16c2dibrPMlkxmXGSmrZ52cF5aS0ybybiRcHNRTldhbXZ3cGxpmqZ1XmliYqeZd2ZTZ2tiX8G/sqKDdWZWUlBcdHlubZWxYVdneG1aZmVsdF90gHZiZVyEb3WoXlpoaGp9c11glKhpb2RteWpcU2plaIxsbnFfYGtkcoxkaHJnXlpZV1x2kn5vWlJdYF1haHZ2iYyLi4iIiot4YJuLipips7S/wc7StJ2atMnP0NLc5eDf5enn5ubj3bus4N/j5+fp6ujk5uTo6ers6OXk5OHe4ODe3d3e3+Df1tw=';
let cache;
function data(){if(cache)return cache;const s=atob(B64);cache=Uint8Array.from(s,c=>c.charCodeAt(0));return cache;}
export function modernReliefAt(lat,lon){lat=Math.max(-89.999,Math.min(89.999,lat));lon=((lon+180)%360+360)%360-180;const x=Math.max(0,Math.min(31,Math.floor((lon+180)/360*32)));const y=Math.max(0,Math.min(15,Math.floor((90-lat)/180*16)));return data()[y*32+x]/255;}
