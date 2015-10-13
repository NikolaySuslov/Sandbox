

#define PI 3.1415926535897932384626433832795

uniform vec3 ambientLightColor;
#if MAX_DIR_LIGHTS > 0
uniform vec3 directionalLightColor[ MAX_DIR_LIGHTS ];
uniform vec3 directionalLightDirection[ MAX_DIR_LIGHTS ];
#endif
#if MAX_HEMI_LIGHTS > 0
uniform vec3 hemisphereLightSkyColor[ MAX_HEMI_LIGHTS ];
uniform vec3 hemisphereLightGroundColor[ MAX_HEMI_LIGHTS ];
uniform vec3 hemisphereLightDirection[ MAX_HEMI_LIGHTS ];
#endif
#if MAX_POINT_LIGHTS > 0
uniform vec3 pointLightColor[ MAX_POINT_LIGHTS ];
uniform vec3 pointLightPosition[ MAX_POINT_LIGHTS ];
uniform float pointLightDistance[ MAX_POINT_LIGHTS ];
#endif
#if MAX_SPOT_LIGHTS > 0
uniform vec3 spotLightColor[ MAX_SPOT_LIGHTS ];
uniform vec3 spotLightPosition[ MAX_SPOT_LIGHTS ];
uniform vec3 spotLightDirection[ MAX_SPOT_LIGHTS ];
uniform float spotLightAngleCos[ MAX_SPOT_LIGHTS ];
uniform float spotLightExponent[ MAX_SPOT_LIGHTS ];
uniform float spotLightDistance[ MAX_SPOT_LIGHTS ];
#endif
#if MAX_SPOT_LIGHTS > 0 || defined( USE_BUMPMAP ) || defined( USE_ENVMAP )|| defined( USE_NORMALMAP )
varying vec3 vWorldPosition;
#endif
#ifdef WRAP_AROUND
uniform vec3 wrapRGB;
#endif



varying vec3 vSundir;
varying vec3 vNormal;
varying vec3 vCamDir;
varying vec3 texcoord0;
varying mat3 TBN;
varying float vCamLength;
varying float h;
varying vec3 vViewPosition;

float nSnell = 1.34;
float kD = .91;
vec3 upwelling = vec3(0.2, 0.4, 0.6);
vec3 sky = vec3(0.69, 0.84, 1.0);
vec3 air = vec3(0.1, 0.1, 0.1);

float L[numWaves];
float A[numWaves];
float S[numWaves];
vec2 D[numWaves];

uniform float uMag;
uniform float t;
uniform samplerCube texture;
uniform sampler2D oNormal;
uniform sampler2D diffuse;
uniform float uChop;
uniform float uReflectPow;
uniform float uFoam;
uniform vec4 waves[9];
uniform float uHalfGrid;

void setup() {

	for (int i = 0; i < numWaves; i++)
	{
		L[i] = waves[i].x;
		D[i] = normalize(vec2(waves[i].y, waves[i].z));
	}
}



void main() {

	setup();
	vec3 tc = texcoord0;
	vec3 pNormal;
	float powerSum = 0.0;
	for (int i = 0; i < 2; i++)
	{
		L[i] *= uMag / 2.0;
		{
			float w =  2.0 * PI / L[i];
			S[i] = sqrt(.98 * (2.0*PI/w));
			float wavesInTexture = 10.0;
			A[i] = 0.5 / (w * 2.718281828459045);
			vec2 texToWorld = tc.xy/wavesInTexture;
			vec2 texToWaveLen =  texToWorld / L[i];
			vec2 directionAndSpeed = D[i] * S[i]/( wavesInTexture*10.0 );
			pNormal +=  A[i]*  texture2D(oNormal, texToWaveLen  + directionAndSpeed * t ).xyz;
			powerSum += A[i];
		}
	}

	pNormal /= powerSum;
	pNormal = 2.0 * pNormal.xyz - 1.0;

	float t1 = 0.02 * -t;
	float t2 = 0.015 * t;
	float t3 = 0.05 * t;

	vec2 uv1 = (tc.xy / waves[0].x) + t1;
	vec2 uv2 = (tc.xy / (waves[0].x*2.0)) + t2;
	vec2 uv3 = (tc.xy / waves[0].x) + t3;


	vec3 mapNormal = texture2D(oNormal, uv1).rgb + texture2D(oNormal, uv2).rgb;//+ texture2D(oNormal, uv3).rgb;
	vec3 diffuseTex = texture2D(diffuse, uv1).rgb + texture2D(diffuse, uv2).rgb;// + texture2D(diffuse, uv4).rgb;

	mapNormal /= 2.0;
	mapNormal = 2.0 * mapNormal.xyz - 1.0;
	mapNormal.xy *= max(0.0, uChop/30.0 *  waves[0].x);

	pNormal.xy *= max(0.0, uChop / 4.0);
	pNormal = normalize(pNormal);

	vec3 texNormal =  normalize(TBN * mapNormal);
	vec3 texNormal1 =  pNormal;

	texNormal = mix(texNormal, texNormal1, clamp(0.0, 1.0, vCamLength / uHalfGrid));
	texNormal = normalize(texNormal); 

	


	float ref = 0.0;
	vec3 nI  = normalize(vCamDir);
	vec3 nN = normalize(texNormal);
	float cosT = (dot(nI, nN));
	float Ti = acos(cosT);
	float sinT = sin(Ti) / nSnell;
	float Tt = asin(sinT);


	float ndotl = max(0.00, dot(directionalLightDirection[ 0], texNormal));
	vec3 sunReflectVec = reflect(-directionalLightDirection[ 0], vec3(texNormal.x,texNormal.y,texNormal.z));
	sunReflectVec = normalize(sunReflectVec);
	float spec = pow(max(0.0,dot(vCamDir, sunReflectVec)), 32.0);


	float fresnel = max(0.0,min(1.0,.02 + 0.97 * pow(1.0 + dot(-vCamDir,texNormal),5.0)));


	float scatter = 1.0 - dot( texNormal, vCamDir);
	//upwelling +=  ambientLightColor/1.0;
	upwelling *=   scatter;

	
	ref = fresnel;
	vec3 camdir = vCamDir;

	//ref = min(1.0, ref);

	float dist = 0.3;
	vec3 ref_vec = reflect(-camdir, texNormal);
	ref_vec = mix(-ref_vec, ref_vec, sign(ref_vec.z));
	sky = uReflectPow * textureCube(texture, ref_vec).xyz;
	vec3 upwellingC =  upwelling/2.0;
	vec4 water  =  vec4(mix(upwellingC,sky,ref),1.0);
	water += vec4(directionalLightColor[ 0 ], 1.0) * spec;

	vec4 foam = vec4(1.0, 1.0, 1.0, 1.0) * ndotl + vec4(ambientLightColor, 1.0);;
	foam.a = 1.0;

	float foamMix = max(0.0, h * diffuseTex.r) ;
	gl_FragColor = mix(water, foam, clamp(foamMix * uFoam, 0.0, 1.0));
	//gl_FragColor.xyz = vec3(spec).xyz ;
}