

define([], function()
{
	function strToBuffer(input)
	{
		if( TextEncoder ){
			var encoder = new TextEncoder('utf-8');
		}
		else {
			var encoder = {encode: function(sDOMStr)
			{
				/*\
				|*|
				|*|  Base64 / binary data / UTF-8 strings utilities
				|*|
				|*|  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Base64_encoding_and_decoding
				|*|
				\*/

				var aBytes, nChr, nStrLen = sDOMStr.length, nArrLen = 0;

				/* mapping... */

				for (var nMapIdx = 0; nMapIdx < nStrLen; nMapIdx++) {
					nChr = sDOMStr.charCodeAt(nMapIdx);
					nArrLen += nChr < 0x80 ? 1 : nChr < 0x800 ? 2 : nChr < 0x10000 ? 3 : nChr < 0x200000 ? 4 : nChr < 0x4000000 ? 5 : 6;
				}

				aBytes = new Uint8Array(nArrLen);

				/* transcription... */

				for (var nIdx = 0, nChrIdx = 0; nIdx < nArrLen; nChrIdx++) {
					nChr = sDOMStr.charCodeAt(nChrIdx);
					if (nChr < 128) {
						/* one byte */
						aBytes[nIdx++] = nChr;
					} else if (nChr < 0x800) {
						/* two bytes */
						aBytes[nIdx++] = 192 + (nChr >>> 6);
						aBytes[nIdx++] = 128 + (nChr & 63);
					} else if (nChr < 0x10000) {
						/* three bytes */
						aBytes[nIdx++] = 224 + (nChr >>> 12);
						aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
						aBytes[nIdx++] = 128 + (nChr & 63);
					} else if (nChr < 0x200000) {
						/* four bytes */
						aBytes[nIdx++] = 240 + (nChr >>> 18);
						aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
						aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
						aBytes[nIdx++] = 128 + (nChr & 63);
					} else if (nChr < 0x4000000) {
						/* five bytes */
						aBytes[nIdx++] = 248 + (nChr >>> 24);
						aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
						aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
						aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
						aBytes[nIdx++] = 128 + (nChr & 63);
					} else /* if (nChr <= 0x7fffffff) */ {
						/* six bytes */
						aBytes[nIdx++] = 252 + (nChr >>> 30);
						aBytes[nIdx++] = 128 + (nChr >>> 24 & 63);
						aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
						aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
						aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
						aBytes[nIdx++] = 128 + (nChr & 63);
					}
				}

				return aBytes;
			}}
		}

		return encoder.encode(input);
	}

	return strToBuffer;
});
