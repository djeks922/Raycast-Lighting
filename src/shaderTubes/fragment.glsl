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

    return pow(max(0.0,l/3.),0.9);
}
void main () {
    if(cos(vUv.x*50.*uTime) < sin(uTime*0.3)) discard;
 


    vec3 cameraToWorld = vWorldPosition - cameraPosition;
    vec3 cameraToWorldDir = normalize(cameraToWorld);
    float cameraToWorldDistance = length(cameraToWorld);

    vec3 lightToWorldDir = normalize(uLight-vWorldPosition);
    float dis = length(uLight - vPosition);
    float diff = max(0.0,dot(vNormal,lightToWorldDir));

    float scatter = getScatter(cameraPosition,cameraToWorldDir,uLight,cameraToWorldDistance);

    gl_FragColor= vec4 (scatter*(66./255.)+10./255.,scatter*(1./255.)+(0./255.),scatter*(102./255.)+(10./255.),1.0);


}