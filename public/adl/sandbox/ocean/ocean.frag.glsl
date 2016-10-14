

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


varying vec3 vFogPosition;
varying vec3 vNormal;
varying vec3 vCamDir;
varying vec3 texcoord0;
varying mat3 TBN;
varying float vCamLength;
varying float h;
varying vec2 sspos;


float nSnell = 1.34;
float kD = .91;
vec3 upwelling = vec3(0.2, 0.4, 0.6);
vec3 sky = vec3(0.69, 0.84, 1.0);
vec3 air = vec3(0.1, 0.1, 0.1);

uniform float L[numWaves];
uniform float A[numWaves];
uniform float S[numWaves];
uniform vec2 D[numWaves];
uniform float gB[numWaves];

uniform float uMag;
uniform float t;
uniform samplerCube texture;
uniform sampler2D oNormal;
uniform sampler2D diffuse;
uniform sampler2D refractionColorRtt;
uniform sampler2D reflectionColorRtt;

 
uniform mat4 projectionMatrix;


uniform sampler2D refractionDepthRtt;
uniform float uChop;
uniform float uReflectPow;
uniform float uFoam;
uniform float uHalfGrid;
uniform float uAmbientPower;
uniform float uSunPower;
uniform float uOceanDepth;
uniform float uNormalPower;
uniform float maxWaveDisplace;
uniform vec3 oCamPos;
//physical params
uniform vec3 c;
uniform vec3 bb;
uniform vec3 a;
uniform vec3 Kd;

uniform float waveEffectDepth;





#ifdef USE_FOG

uniform vec3 fogColor;

#ifdef FOG_EXP2

uniform vec3 vAtmosphereColor; //vec3(0.0, 0.02, 0.04);
uniform vec3 vHorizonColor; //vec3(0.88, 0.94, 0.999);
uniform vec3 vApexColor; //vec3(0.78, 0.82, 0.999)
uniform float vAtmosphereDensity; //.0005
uniform float vFalloff;
uniform float vFalloffStart;
      uniform float fogDensity;

#if MAX_DIR_LIGHTS > 0
 


vec3 atmosphereColor(vec3 rayDirection){
    float a = max(0.0, dot(rayDirection, vec3(0.0, 1.0, 0.0)));
    vec3 skyColor = mix(vHorizonColor, vApexColor, a);
    float sunTheta = max( dot(rayDirection, directionalLightDirection[0].xzy), 0.0 );
    return skyColor+directionalLightColor[0]*4.0*pow(sunTheta, 16.0)*0.5;
}

vec3 applyFog(vec3 albedo, float dist, vec3 rayOrigin, vec3 rayDirection){
    float fogDensityA = fogDensity ;
    float fog = exp((-rayOrigin.y*vFalloff)*fogDensityA) * (1.0-exp(-dist*rayDirection.y*vFalloff*fogDensityA))/(rayDirection.y*vFalloff);
    return mix(albedo, fogColor, clamp(fog, 0.0, 1.0));
}

vec3 aerialPerspective(vec3 albedo, float dist, vec3 rayOrigin, vec3 rayDirection){
 //rayOrigin.y = max(-vFalloffStart,rayOrigin.y);
 rayOrigin.y += vFalloffStart;
 rayOrigin.y = abs(rayOrigin.y);
     
    vec3 atmosphere = atmosphereColor(rayDirection)+vAtmosphereColor; 
    atmosphere = mix( atmosphere, atmosphere*.85, clamp(1.0-exp(-dist*vAtmosphereDensity), 0.0, 1.0));
    vec3 color = mix( applyFog(albedo, dist, rayOrigin, rayDirection), atmosphere, clamp(1.0-exp(-dist*vAtmosphereDensity)-log(rayOrigin.y)/10.0, 0.0, 1.0));
    return color;
}                      
#endif
  #else

       uniform float fogNear;
       uniform float fogFar;

   #endif

#endif


float unpackDepth( const in vec4 rgba_depth ) {

	const vec4 bit_shift = vec4( 1.0 / ( 256.0 * 256.0 * 256.0 ), 1.0 / ( 256.0 * 256.0 ), 1.0 / 256.0, 1.0 );
	float depth = dot( rgba_depth, bit_shift );
	return depth;

}

vec4 pack_depth( const in float depth ) {

	const vec4 bit_shift = vec4( 256.0 * 256.0 * 256.0, 256.0 * 256.0, 256.0, 1.0 );
	const vec4 bit_mask = vec4( 0.0, 1.0 / 256.0, 1.0 / 256.0, 1.0 / 256.0 );
	vec4 res = mod( depth * bit_shift * vec4( 255 ), vec4( 256 ) ) / vec4( 255 );

	res -= res.xxyz * bit_mask;
	return res;

}


float LinearizeDepth(float depth)
{
	float m22  = projectionMatrix[2][2];
	float m32  = projectionMatrix[3][2];

	float near = (2.0*m32)/(2.0*m22-2.0);
	float far = ((m22-1.0)*near)/(m22+1.0);
	float z = depth * 2.0 - 1.0; // Back to NDC
	return (2.0 * near * far) / (far + near - z * (far - near));
}

void main() {

	if (vCamLength < 0.5)
	{
		discard;
	//	return;
	}
	vec3 tc = texcoord0;
	vec3 pNormal;
	vec3 nnvCamDir = normalize(-vCamDir);
	float powerSum = 0.0;
	//for (int i = 0; i < 2; i++)
	{
		
			float wavesInTexture = 10.0;
			vec2 texToWorld = tc.xy / wavesInTexture;
			vec2 texToWaveLen =  texToWorld / L[0];
			vec2 directionAndSpeed = D[0] * S[0] / ( wavesInTexture * 15.0);
			pNormal +=  A[0] *  texture2D(oNormal, texToWaveLen  + directionAndSpeed * t ).xyz;
			powerSum +=  A[0];
		
			texToWaveLen =  texToWorld / L[1];
			directionAndSpeed = D[1] * S[1] / ( wavesInTexture * 15.0);
			pNormal +=  A[1] *  texture2D(oNormal, texToWaveLen  + directionAndSpeed * t ).xyz;
			powerSum +=  A[1];
	}

	pNormal /= powerSum ;
	pNormal = 2.0 * pNormal.xyz - 1.0;
	pNormal.xy *= uNormalPower;
	pNormal = normalize(pNormal);

	float t1 = 0.02 * -t;
	float t2 = 0.015 * t;
	float t3 = 0.05 * t;

	float wave0Amp = maxWaveDisplace;
	vec2 uv1 = (tc.xy / wave0Amp) + t1;
	vec2 uv2 = (tc.xy / (wave0Amp * 2.0)) + t2;
	vec2 uv3 = (tc.xy / wave0Amp) + t3;


	vec3 mapNormal = texture2D(oNormal, uv1).rgb + texture2D(oNormal, uv2).rgb;//+ texture2D(oNormal, uv3).rgb;
	vec3 diffuseTex = texture2D(diffuse, uv1).rgb + texture2D(diffuse, uv2).rgb;// + texture2D(diffuse, uv4).rgb;

	mapNormal /= 2.0;
	mapNormal = 2.0 * mapNormal.xyz - 1.0;
	mapNormal.xy *= max(0.0, (uChop / 0.6 *  A[0]));
	mapNormal.xy *= uNormalPower;
	mapNormal = normalize(mapNormal);
	pNormal.xy *= max(0.0, uChop / 4.0);


	vec3 texNormal =  normalize(TBN * mapNormal);
	vec3 texNormal1 =  normalize(TBN * pNormal);;

	float falloffmix = clamp(vCamLength / uHalfGrid,0.0, 1.0);
	texNormal = mix(texNormal, texNormal1, falloffmix+.00000001);

	texNormal.xy /= max(1.0,vCamLength/1000.0);
	texNormal = normalize(texNormal);
	//texNormal = pNormal;


	float ref = 0.0;



	float ndotl = max(0.00, dot(directionalLightDirection[ 0], texNormal));
	vec3 sunReflectVec = reflect(-directionalLightDirection[ 0], vec3(texNormal.x, texNormal.y, texNormal.z));
	sunReflectVec = normalize(sunReflectVec);
	float spec = pow(max(0.0, dot(nnvCamDir, sunReflectVec)), 32.0);


	float fresnel = max(0.0, min(1.0, .00 + 1.0 * pow(1.0 - dot(texNormal, nnvCamDir), 9.0)));


	float scatter = 1.0 - dot( texNormal, nnvCamDir);



	ref = fresnel;
	vec3 camdir = vCamDir;

	//ref = min(1.0, ref);

	float dist = 0.3;
	vec3 ref_vec = -reflect(-camdir, texNormal);
	ref_vec.z = abs(ref_vec.z);
	sky = uReflectPow * .333 * pow(textureCube(texture, ref_vec).xyz,vec3(2.2));
	
	#ifdef useReflections
		vec4 skyPlaner = pow(texture2D(reflectionColorRtt,sspos.xy+ (texNormal.xy+vec2(0.0007,0.0))/vec2(50.0,500.0) * (vCamLength)).xyzw,vec4(2.2));
		float planerMix = dot(normalize(ref_vec),normalize(vCamDir));
		planerMix = clamp((planerMix) * (skyPlaner.a),0.0,1.0);
		sky = mix(sky,skyPlaner.xyz,planerMix);
	#else
		vec4 skyPlaner = vec4(0.0,0.0,0.0,0.0);	
	#endif



	//float ndotl = max(0.00, dot(directionalLightDirection[ 0], texNormal));


	float cosT  = -dot(vNormal, refract(nnvCamDir, normalize(vNormal), .66));
	
	//cosT = max(.001,cosT);
	cosT = -cosT;

	
	#ifdef useRefractions
		vec4 rawDepth0 = texture2D(refractionDepthRtt , sspos.xy);

		float D01 = unpackDepth(rawDepth0);
		float D1 = gl_FragCoord.z;
		D1 = LinearizeDepth(D1);
		D01 = LinearizeDepth(D01);

			
		float rd = min(0.05,abs(D1-D01)/30.0);
		vec4 rawDepth = texture2D(refractionDepthRtt , sspos.xy + texNormal.xy *rd);
		float D0 = unpackDepth(rawDepth);

		D0 = LinearizeDepth(D0);
		
		vec3 ocean_bottom_color = pow(texture2D(refractionColorRtt , sspos.xy + texNormal.xy * rd).xyz,vec3(2.2));

		float depth = D1 - D0;
	#else
		float depth = 1000.0;
		vec3 ocean_bottom_color = vec3(0.0,0.0,0.0);
	#endif
		
	if(depth > -0.001)
	{
		depth =  -1000.0;
		ocean_bottom_color = vec3(0.0,0.0,0.0);
	}

	
	vec3 LZTP = ocean_bottom_color;


	float Z = max(0.00, abs(depth) * uOceanDepth ); //);//depth
	float R = -Z * cosT;


	vec3 Ldf0_sum = vec3(0.0, 0.0, 0.0);
	vec3 Ldf0 = vec3(0.0, 0.0, 0.0);

	vec3 ed0 =  vec3(ndotl) * directionalLightColor[0] * uSunPower + (ambientLightColor) * uAmbientPower; //sun plus sky lighting on water surface

	Ldf0.r = ((0.33 * bb[0]) / a[0]) * (ed0.r / PI);
	Ldf0.g = ((0.33 * bb[1]) / a[1]) * (ed0.g / PI);
	Ldf0.b = ((0.33 * bb[2]) / a[2]) * (ed0.b / PI);


	Ldf0_sum.r = Ldf0.r * (1.0 - exp((-c[0] + Kd[0] * cosT) * R));
	Ldf0_sum.g = Ldf0.g * (1.0 - exp((-c[1] + Kd[1] * cosT) * R));
	Ldf0_sum.b = Ldf0.b * (1.0 - exp((-c[2] + Kd[2] * cosT) * R));

	vec3 LZTP_sum = vec3(0.0, 0.0, 0.0);

	LZTP_sum.r = LZTP.r * exp(-c[0] * R);
	LZTP_sum.g = LZTP.g * exp(-c[1] * R);
	LZTP_sum.b = LZTP.b * exp(-c[2] * R);

	vec3 L0TP = LZTP_sum +   Ldf0_sum;


	vec4 water  =  vec4(mix(pow(L0TP,vec3(2.2)), sky, ref), 1.0);
	water += vec4(directionalLightColor[ 0 ], 1.0) * spec * max(0.0,1.0-skyPlaner.a);

	vec4 foam = vec4(1.0, 1.0, 1.0, 1.0) * ndotl + vec4(ambientLightColor, 1.0);;
	foam.a = 1.0;

	float foamMix = max(0.0,  h * diffuseTex.r ) ;
	foamMix += clamp(1.0+depth/0.3,0.0,1.0) * texture2D(diffuse,uv1 ).r;
	
	gl_FragColor = mix(water, foam, clamp(foamMix * uFoam, 0.0, 1.0));

	gl_FragColor.xyz = pow(gl_FragColor.xyz,vec3(1.0/2.2));
	#ifdef USE_FOG
		#ifdef FOG_EXP2
			#if MAX_DIR_LIGHTS > 0
          		gl_FragColor.xyz = aerialPerspective(gl_FragColor.xyz, distance(vFogPosition.xyz,oCamPos),oCamPos.xzy, normalize(vFogPosition.xyz-oCamPos).xzy);
        	#endif
		#endif
	#endif	
	//gl_FragColor.xyz = normalize(ref_vec);
          		
}