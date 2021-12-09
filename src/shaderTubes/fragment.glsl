uniform vec3 uLight;
uniform float uTime;
uniform vec3 uColor;
uniform vec2 uIntensity; 

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vWorldPosition;
float PI = 3.14159265359;
float getScatter(vec3 cameraPos, vec3 dir, vec3 lightPos, float d) {

    vec3 q = cameraPos - lightPos;


    float b = dot(dir,q);
    float c = dot(q,q);

    float t = c-b*b;
    float s = 1.0/ sqrt(max(0.0001,t));
    float l = s * (atan( (d+b)*s) - atan(b*s));

    return pow(max(0.0,l/uIntensity.y),uIntensity.x);
}
void main () {
    // if(sin(vUv.x*(sin(uTime*0.1)*50.0 +10.0) +uTime) < 0.99) discard;
    if(sin(vUv.x*80. + uTime*2.) < 0.99) discard;

 


    vec3 cameraToWorld = vWorldPosition - cameraPosition;
    vec3 cameraToWorldDir = normalize(cameraToWorld);
    float cameraToWorldDistance = length(cameraToWorld);

    vec3 lightToWorldDir = normalize(uLight-vWorldPosition);
    float dis = length(uLight - vPosition);
    float diff = max(0.0,dot(vNormal,lightToWorldDir));

    float scatter = getScatter(cameraPosition,cameraToWorldDir,uLight,cameraToWorldDistance);

    gl_FragColor= vec4 (scatter*(uColor.r/255.),scatter*(uColor.g/255.),scatter*(uColor.b/255.),1.0);

}