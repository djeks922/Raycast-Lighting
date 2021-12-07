uniform vec3 uLight;
uniform float uTime;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vWorldPosition;

float getScatter(vec3 cameraPos, vec3 dir, vec3 lightPos, float d) {

    vec3 q = cameraPos - lightPos;


    float b = dot(dir,q);
    float c = dot(q,q);

    float t = c-b*b;
    float s = 1.0/ sqrt(max(0.0001,t));
    float l = s * (atan( (d+b)*s) - atan(b*s));

    return pow(max(0.0,l/100.),0.4);
}
void main () {
    float freq1 = sin(vUv.x * uTime*2.);
    if(freq1 < 0. ) discard;
 


    vec3 cameraToWorld = vWorldPosition - cameraPosition;
    vec3 cameraToWorldDir = normalize(cameraToWorld);
    float cameraToWorldDistance = length(cameraToWorld);

    vec3 lightToWorldDir = normalize(uLight-vWorldPosition);
    float dis = length(uLight - vPosition);
    float diff = max(0.0,dot(vNormal,lightToWorldDir));

    float scatter = getScatter(cameraPosition,cameraToWorldDir,uLight,cameraToWorldDistance);

    gl_FragColor= vec4 (scatter*0.3,scatter*0.1,scatter*0.2,1.0);


}