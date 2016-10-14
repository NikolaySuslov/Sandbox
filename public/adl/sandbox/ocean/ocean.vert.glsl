

#define PI 3.1415926535897932384626433832795

varying vec3 vNormal;
varying vec3 vCamDir;
varying vec3 texcoord0;
varying float vCamLength;
varying mat3 TBN;
varying float h;
varying vec2 sspos;
varying vec3 vFogPosition;

uniform vec3 oCamPos;
uniform vec3 wPosition; 
uniform float uChop;
uniform mat4 mProj;
uniform float t;
uniform float uMag;
uniform float uHalfGrid;

uniform float uWaterHeight;




uniform float L[numWaves];
uniform float A[numWaves];
uniform float S[numWaves];
uniform float W[numWaves];
uniform float Q[numWaves];
uniform float gB[numWaves];
uniform vec2 D[numWaves];
uniform float gA;

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


highp mat4 transpose(in highp mat4 inMatrix) {
      highp vec4 i0 = inMatrix[0];
      highp vec4 i1 = inMatrix[1];
      highp vec4 i2 = inMatrix[2];
      highp vec4 i3 = inMatrix[3];


      highp mat4 outMatrix = mat4(
                                   vec4(i0.x, i1.x, i2.x, i3.x),
                                   vec4(i0.y, i1.y, i2.y, i3.y),
                                   vec4(i0.z, i1.z, i2.z, i3.z),
                                   vec4(i0.w, i1.w, i2.w, i3.w)
                             );
      return outMatrix;
}


void main() {




      vec3 N = vec3(0.0, 0.0, 0.0);
      vec3 B = vec3(0.0, 0.0, 0.0);

      vec3 tPos = position;

      vec4 tpos1 = mProj * vec4(tPos.xy, -0.0, 1.0);
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
      float i_t = (p_w * p_h - p_z) / ((p_dz - p_dw * p_h));
     
      if (i_t > 1.0000)
      {
            vCamLength = -1.0;
            return;
      }

      float tw = p_w + p_dw * i_t;
      tPos.x = (p_x + p_dx * i_t) / tw;
      tPos.y = (p_y + p_dy * i_t) / tw;
      tPos.z = uWaterHeight;//(p_z + p_dz*i_t)/tw;

      tPos.x += oCamPos.x;
      tPos.y += oCamPos.y;



      texcoord0 = tPos;



      float camDist = length(oCamPos.xyz - tPos.xyz);
      for (int i = 0; i < numWaves; i++)
      {

            float x = tPos.x + D[i].x * W[i];
            float y = tPos.y + D[i].y * W[i];
            //if (L[i] > edgeLen2*4.0)
            {
                  float st = t;

                  float w = W[i];
                  float q = 3.0 ;
                  float Ai = A[i] * smoothstep(1.0, 0.0, pow(camDist, 1.3) / (uHalfGrid * L[i]));

                  if (Ai < .001) continue;
                  vec2 xy = vec2(x , y/2.0);

                  float Qi = Q[i]; // *numWaves?
                  float xi = Qi * Ai * D[i].x * cos( dot(w * D[i], xy) + q * st);
                  float yi = Qi * Ai * D[i].y * cos( dot(w * D[i], xy) + q * st);
                  float hi =  Ai * sin( dot(w * D[i], xy) + q * st );

                  tPos.x += xi;// * gA;//gB[i];
                  tPos.y += yi;// * gA;//*gB[i];
                  tPos.z += hi * gA *gB[i];

                  float WA = w * Ai * gA ;//*gB[i];
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
      



      vec3 w_eye_pos = -transpose(mat3(modelViewMatrix)) * vec3(modelViewMatrix[2]);


      vCamDir = (viewMatrix  * vec4(tPos, 1.0)).xyz;
      vCamDir = normalize(vCamDir);


      vCamDir = normalize( vec4(vCamDir, 0.0) * viewMatrix ).xyz;


      vCamLength = distance(oCamPos , tPos );
      tPos.x -= oCamPos.x;
      tPos.y -= oCamPos.y;


      vFogPosition = (modelMatrix * vec4(tPos.xyz,1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(tPos , 1);
      sspos = gl_Position.xy / gl_Position.w;
      sspos = sspos * .5 + 0.5 ;


}