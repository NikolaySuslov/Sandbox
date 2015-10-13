

#define PI 3.1415926535897932384626433832795

varying vec3 vNormal;
varying vec3 vSundir;
varying vec3 vCamDir;
varying vec3 texcoord0;
varying float vCamLength;
varying mat3 TBN;
varying float h;



uniform vec3 oCamPos;
uniform vec3 wPosition;
uniform float uChop;
uniform mat4 mProj;
uniform float t;
uniform float uMag;
uniform float uHalfGrid;
uniform float uWaterHeight;

uniform vec4 waves[9];



vec3 sundir = vec3(.5, .5, .1);
float L[numWaves];
float A[numWaves];
float S[numWaves];
float W[numWaves];
float Q[numWaves];
vec2 D[numWaves];

highp mat3 transpose(in highp mat3 inMatrix) {
      highp vec3 i0 = inMatrix[0];
      highp vec3 i1 = inMatrix[1];
      highp vec3 i2 = inMatrix[2];


      highp mat3 outMatrix = mat3(
                                   vec3(i0.x, i1.x, i2.x),
                                   vec3(i0.y, i1.y, i2.y),
                                   vec3(i0.z, i1.z, i2.z)
                             );
      return outMatrix;
}


void setup() {
      float Qa = uChop / uMag;
      for (int i = 0; i < numWaves; i++)
      {
            L[i] = waves[i].x;
            //L[i] *= uMag / 2.0;
            D[i] = normalize(vec2(waves[i].y, waves[i].z));

            float w =  2.0 * PI / L[i];
            A[i] = 0.5 / (w * 2.718281828459045); //for ocean on Earth, A is ususally related to L
            
            //S[i] =     1.0 * uMag; //for ocean on Earth, S is ususally related to L
            S[i] = sqrt(.98 * (2.0*PI/w));
            W[i] = w;
            Q[i] = Qa / (w * A[i] * float(numWaves));
            
      }
}

void main() {

      setup();

      float gA = .5;

      vec3 N = vec3(0.0, 0.0, 0.0);
      vec3 B = vec3(0.0, 0.0, 0.0);

      vec3 tPos = position;

      vec4 tpos1 = mProj * vec4(tPos.xy, -1.0, 1.0);
      vec4 tpos2 = mProj * vec4(tPos.xy, 1.0, 1.0);

      float p_x = tpos1.x;
      float p_dx = tpos2.x - p_x;
      float p_y = tpos1.y;
      float p_dy = tpos2.y - p_y;
      float p_z = tpos1.z;
      float p_dz = tpos2.z - p_z;
      float p_w = tpos1.w;
      float p_dw = tpos2.w - p_w;
      float p_h = uWaterHeight;
      float i_t = (p_w * p_h - p_z) / (p_dz - p_dw * p_h);

      float tw = p_w + p_dw * i_t;
      tPos.x = (p_x + p_dx * i_t) / tw;
      tPos.y = (p_y + p_dy * i_t) / tw;
      tPos.z = uWaterHeight;//(p_z + p_dz*i_t)/tw;

      

      texcoord0 = tPos;

      

      float camDist = length(oCamPos.xyz - tPos.xyz);
      for (int i = 0; i < numWaves; i++)
      {
           
           float x = tPos.x + D[i].x * waves[i].w;
      float y = tPos.y + D[i].y * waves[i].w;
            //if (L[i] > edgeLen2*4.0)
            {
                  float st = t;
                  
                  float w = W[i];
                  float q = S[i] * w;
                  A[i] *= smoothstep(1.0, 0.0, pow(camDist, 1.3) / (uHalfGrid * L[i]));
                 if(A[i] < .001) continue;
                  vec2 xy = vec2(x , y);
                  
                  float Qi = Q[i]; // *numWaves?
                  float xi = Qi * A[i] * D[i].x * cos( dot(w * D[i], xy) + q * st);
                  float yi = Qi * A[i] * D[i].y * cos( dot(w * D[i], xy) + q * st);
                  float hi =  A[i] * sin( dot(w * D[i], xy) + q * st );

                  tPos.x += xi * gA;
                  tPos.y += yi * gA;
                  tPos.z += hi * gA;

                  float WA = w * A[i] * gA;
                  float S0 = sin(w * dot(D[i], tPos.xy) + q * st);
                  float C0 = cos(w * dot(D[i], tPos.xy) + q * st);


                  N.x +=  D[i].x * WA * C0;
                  N.y +=  D[i].y * WA * C0;
                  N.z +=  Qi * WA * S0;

                  B.x += Qi * (D[i].x * D[i].x) * WA * S0;
                  B.y += Qi * D[i].y * D[i].y * WA * S0;
                  B.z += D[i].x * WA * C0;
            }
      }

      

      vec3 tNormal = normalize(vec3(-N.x, -N.y, 1.0 - N.z));
      vec3 tBinormal = normalize(vec3(1.0 - B.x, -B.y, N.z));
      vec3 tTangent = cross(tBinormal, tNormal);

      h = tPos.z - uWaterHeight;
      TBN = mat3(tBinormal.x, tBinormal.y, tBinormal.z,
                 tTangent.x, tTangent.y, tTangent.z,
                 tNormal.x, tNormal.y, tNormal.z);

      vNormal = normalize(tNormal);
      vSundir = normalize(sundir);

      gl_Position = projectionMatrix * modelViewMatrix * vec4(tPos , 1);

      vCamLength = distance(oCamPos , tPos );
      vCamDir =  normalize(oCamPos - (tPos ));

}