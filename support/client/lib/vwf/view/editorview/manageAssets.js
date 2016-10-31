define(['vwf/view/editorview/angular-app', 'vwf/view/editorview/strToBytes', 'vwf/view/editorview/UserManager'], function(app, strToBytes) {
	var appHeaderName = '';
	var uploadVWFObject, setSelection;
	app.service('AssetDataManager', ['$http', '$rootScope', function($http, $rootScope) {
		var data = {};
		Object.defineProperty(data, 'refresh', {
			enumerable: false,
			writable: false,
			value: function(id, cb)
			{
				var self = this;

				function updateAsset(id, cb) {
					$http.get(data.appPath + '/assets/' + id + '/meta?permFormat=json')
					.success(function(data, status) {
						if (status !== 304) {
							self[id] = data;
							self[id].id = id;
						}
						cb && cb(self[id]);
					})
					.error(function(data, status) {
						if (status === 404) {
							delete self[id];
						}
						//cb && cb(null);
					});
				}

				if (id && typeof(id) === 'string'){
					updateAsset(id, cb);
				}
				else
				{
					$http.get(
						self.appPath + '/assets/by-meta/all-of' +
						'?user_name=' + encodeURIComponent(_UserManager.GetCurrentUserName()) +
						'&returns=id,name,description,type,size,license,thumbnail,permissions,group_name,isTexture' +
						'&permFormat=json')
					.success(function(list, status)
					{
						if( status === 200 ){
							for(var i in list.matches){
								self[i] = list.matches[i];
							}
							for(var i in self){
								if(!list.matches[i])
									delete self[i];
							}
						}
					});
					/*$http.get(self.appPath + '/assets/by-user/' + _UserManager.GetCurrentUserName()).success(
						function(list, status) {
							if (status !== 304) {
								var ids = Object.keys(list.assets);
								toComplete = ids.length;
								for (var i = 0; i < ids.length; i++) {
									updateAsset(ids[i], cb);
								}
							}
						}
					);*/
				}
			}.bind(data)
		});
		$http.get('vwfDataManager.svc/saspath').success(function(appPath) {
			Object.defineProperty(data, 'appPath', {
				enumerable: false,
				writable: false,
				value: appPath
			});
			// check if same origin
			var loc = window.location;
			var a = document.createElement('a');
			a.href = appPath;
			if (!(a.hostname == loc.hostname && a.port == loc.port && a.protocol == loc.protocol)) {
				$.get(appPath + '/session-header-name', function(data) {
					appHeaderName = data;
					var cookie = /session=([A-Za-z0-9_.-]+)/.exec(document.cookie);
					if (cookie) {
						$http.defaults.headers.post[appHeaderName] = cookie[1];
						$http.defaults.headers.delete = $http.defaults.headers.delete ||
						{};
						$http.defaults.headers.delete[appHeaderName] = cookie[1];
					}
				});
			}
		});
		$rootScope.$watch('fields.worldIsReady', function(newval) {
			if(newval) data.refresh();
		});
		window._AssetLibrary = data;
		return data;
	}]);
	app.filter('sortByProp', function() {
		return function(input, field, reverse) {
			input = input || {};
			field = field || 'last_modified';
			reverse = reverse === undefined ? true : false;
			var out = [];
			for (var i in input) {
				out.push(input[i]);
			}
			out.sort(function(a, b) {
				var ret = 0;
				var aField = a[field].toLowerCase(), bField = b[field].toLowerCase();
				if (aField < bField) ret = -1;
				else if (aField == bField) ret = 0;
				else ret = 1;
				return reverse ? -ret : ret;
			});
			return out;
		};
	});
	app.filter('filterAssetThumbs', function() {
		return function(input, enabled) {
			if (enabled) {
				var thumbs = [];
				// gather list of thumbnails
				for (var i = 0; i < input.length; i++) {
					if (input[i].thumbnail && input[i].thumbnail !== 'asset:' + input[i].id) {
						thumbs.push(input[i].thumbnail.slice(6));
					}
				}
				return input.filter(function(val) {
					return thumbs.indexOf(val.id) === -1;
				});
			} else return input;
		};
	});
	app.filter('searchForAsset', function() {
		return function(input, term) {
			var re = new RegExp(term, 'i');
			return input.filter(function(item) {
				return re.test(item.id) || re.test(item.type) || re.test(item.name) || re.test(item.description)
			});
		};
	});
	app.filter('humanSize', function() {
		return function(input) {
			if (input > 1e9)
				return (input / 1e9).toPrecision(3) + 'G';
			else if (input > 1e6)
				return (input / 1e6).toPrecision(3) + 'M';
			else if (input > 1e3)
				return (input / 1e3).toPrecision(3) + 'K';
			else
				return input + 'B';
		}
	});
	app.directive('adlScrollTo', ['$timeout', function($timeout) {
		return {
			restrict: 'A',
			scope:
			{
				scrollTo: '=adlScrollTo'
			},
			link: function(scope, element, attr) {
				var elem = element[0],
					parent = element.scrollParent()[0];
				scope.$watch('scrollTo', function(newval) {
					if (newval) {
						// delay until next cycle, when elem.offset* will evaluate
						$timeout(function() {
							var elemBottom = elem.offsetTop + $(elem).height();
							var elemRight = elem.offsetLeft + $(elem).width();
							var parentBottom = parent.scrollTop + parent.clientHeight;
							var parentRight = parent.scrollLeft + parent.clientWidth;
							if (elem.offsetTop < parent.scrollTop)
								parent.scrollTop = elem.offsetTop;
							else if (elemBottom > parentBottom)
								parent.scrollTop = parent.scrollTop + (elemBottom - parentBottom) + 3;
							if (elem.offsetLeft < parent.scrollLeft)
								parent.scrollLeft = elem.offsetLeft;
							else if (elem.offsetLeft > parentRight - 100)
								parent.scrollLeft = Math.min(elemRight, elem.offsetLeft + 100, parent.scrollWidth) - parent.clientWidth + 3;
						});
					}
				});
			}
		};
	}]);


	app.controller('AssetManagerController', ['$scope', '$http', 'AssetDataManager', function($scope, $http, assets)
	{
		window._AssetManager = $scope;

		var input = $('#manageAssetsDialog #fileInput');
		input.on('dragover',function(e){
			    e.stopPropagation();
            e.preventDefault();
		})
		input.on('drop',function(e){
			  
		})

		var fileData = {};
		$scope.assets = assets;
		$scope.selectedAsset = null;
		$scope.hideThumbs = true;
		$scope.knownTypes = [
			'image/png', 'image/jpeg', 'image/dds',
			'model/vnd.collada+xml', 'model/vnd.three.js+json', 'model/vnd.gltf+json',
			'application/vnd.vws-entity+json', 'application/vnd.vws-material+json', 'application/vnd.vws-behavior+json',
			'application/octet-stream', 'application/json'
		].sort();
		setSelection = function(id) {
			$scope.selectedAsset = id;
			if (id === 'new')
				$scope.new._added = true;
		}
		$scope.setSelection = setSelection;
		// build resonable defaults for new uploads
		$scope.resetNew = function() {
			$scope.new = {
				id: 'new',
				name: '<new asset>',
				type: '???',
				license: 'CC-BY',
				permissions:
				{
					user:
					{
						read: true,
						write: true,
						delete: true
					},
					group:
					{
						read: true
					},
					other:
					{
						read: true
					}
				}
			};
			if ($scope.selectedAsset === 'new')
				$scope.selectedAsset = null;
		}
		$scope.resetNew();
		$scope.prettifyType = function(type) {
			switch (type) {
				case 'application/vnd.vws-entity+json':
					return 'VWS Entity';
				case 'application/vnd.vws-material+json':
					return 'VWS Material';
				case 'application/vnd.vws-behavior+json':
					return 'VWS Behavior';
				default:
					return type;
			}
		};
		// keep 'selected' in sync with currently selected asset
		$scope.$watchGroup(['selectedAsset', 'assets[selectedAsset]', 'new'], function(newvals) {
			$scope.clearFileInput();
			if (newvals[0]) {
				if (newvals[0] !== 'new')
					$scope.selected = newvals[1];
				else
					$scope.selected = newvals[2];
			} else
				$scope.selected = {};
		});
		// roll up the various dirty flags into an asset-level one
		$scope.$watchGroup(['selected._basicDirty', 'selected._groupDirty', 'selected._permsDirty'], function(newvals) {
			if ($scope.selected)
				$scope.selected._dirty = newvals[0] || newvals[1] || newvals[2];
		});
		$scope.$watch('selected.thumbnail', function(newval) {
			if ($scope.selected && newval)
				$scope.selected._thumbnailId = newval.slice(6);
		});
		$scope.$watch('selected._thumbnailId', function(newval) {
			if ($scope.selected && newval !== undefined) {
				if (newval)
					$scope.selected.thumbnail = 'asset:' + newval;
				else
					$scope.selected.thumbnail = null;
			}
		});
		// auto-fill mime type field when file is selected
		window.getFileData = function(files)
		{
			if (files[0])
			{
				var fr = new FileReader();
				fr.onloadend = function(evt)
				{
					$scope.selected.filename = files[0].name;
					fileData[$scope.selected.id] = new Uint8Array(fr.result);

					if ($scope.selected.name === '<new asset>')
						$scope.selected.name = files[0].name;

					if (files[0].type){
						$scope.selected.type = files[0].type;
					}
					else if (/\.dae$/i.test(files[0].name)) {
						$scope.selected.type = 'model/vnd.collada+xml';
					}
					else if( /\.gltf$/i.test(files[0].name) ){
						$scope.selected.type = 'model/vnd.gltf+json';
					}

					/* force user to disambiguate json extensions
					else if(/\.json$/i.test(files[0].name)){
						$scope.selected.type = 'application/json';
					}*/

					else
					{
						$scope.selected.type = '';
					}

					// attempt to determine image resolution
					if ($scope.selected.type === 'image/x-dds')
						$scope.selected.isTexture = true;

					else if ($scope.selected.type.slice(0, 6) === 'image/')
					{
						// get data url from buffer
						var dataStr = '', buffer = fileData[$scope.selected.id];

						for (var offset = 0; offset < buffer.byteLength; offset += 0x8000) {
							dataStr += String.fromCharCode.apply(null, buffer.subarray(offset, offset + 0x8000));
						}

						var dataUrl = 'data:' + $scope.selected.type + ';base64,' + btoa(dataStr);
						var img = new Image();
						img.onload = function()
						{
							if ($scope.selected.width != this.width || $scope.selected.height != this.height)
							{
								$scope.selected.width = this.width;
								$scope.selected.height = this.height;

								// set self thumbnail
								if (this.width < 200 && this.height < 200 && !$scope.selected.thumbnail) {
									$scope.selected.thumbnail = $scope.selected.id ? 'asset:' + $scope.selected.id : ':self';
								}

								// flag as a texture
								var log2 = Math.log2 || function(x) {
									return Math.log(x) / Math.LN2;
								};

								var exp = log2($scope.selected.width);
								if ($scope.selected.width === $scope.selected.height && exp === Math.floor(exp) && exp >= 6)
									$scope.selected.isTexture = true;
								else
									$scope.selected.isTexture = null;
								$scope.selected._basicDirty = true;
							}
						};

						img.src = dataUrl;
					}

					// repoint buffer references from uploaded glTFs
					if( $scope.selected.type === 'model/vnd.gltf+json' || $scope.selected.type === 'application/json' )
					{
						var buffer = fileData[$scope.selected.id], dataStr = '';
						for (var offset = 0; offset < buffer.byteLength; offset += 0x8000) {
							dataStr += String.fromCharCode.apply(null, buffer.subarray(offset, offset + 0x8000));
						}

						try {
							$scope.selected.doc = JSON.parse(dataStr);
						}
						catch(e){
							console.error('Cannot parse selected JSON file. Non-ANSI encoding?', e)
						}
					}

					$scope.selected._dirty = true;
					$scope.$apply();
				};

				fr.readAsArrayBuffer(files[0]);
			}
		}

		uploadVWFObject = function(name, data, type, existingId, cb)
		{
			function walk(node) {
				if (!node) return;
				if (!node.children) return;
				var childNames = Object.keys(node.children);
				var newChildren = {};
				for (var i in childNames) {
					var childName = childNames[i];
					var originalName = node.children[childName].properties ? node.children[childName].properties.___assetServerOriginalID : null;
					if (originalName) {
						newChildren[originalName] = node.children[childName]
					} else {
						if (node.children[childName].id) {
							vwf_view.kernel.setProperty(node.children[childName].id, "___assetServerOriginalID", childName)
						}
						newChildren[childName] = node.children[childName];
						if (!newChildren[childName].properties)
							newChildren[childName].properties = {};
						newChildren[childName].properties.___assetServerOriginalID = childName;
					}
				}
				node.children = newChildren;
				for (var i in node.children)
					walk(node.children[i])
			}

			walk(data); //walk once in order to set the values on the real nodes. 

			var cleanObj = _DataManager.getCleanNodePrototype(data); //strip the IDs
			if (!existingId)
			{
				$scope.resetNew();
				$scope.selectedAsset = 'new';
				fileData['new'] = strToBytes(JSON.stringify(cleanObj, null, '\t'));
				$scope.new.filename = name;
				$scope.new.type = type;
				$scope.new._added = true;
				$scope.new._dirty = true;
				$scope.new._uploadCallback = cb;
			}
			else
			{
				walk(cleanObj); //undo the random rename 
				$scope.selectedAsset = existingId;
				fileData[existingId] = strToBytes(JSON.stringify(cleanObj, null, '\t'));
				$scope.assets[existingId].filename = name;
				$scope.assets[existingId].type = type;
				$scope.assets[existingId]._dirty = true;
				$scope.assets[existingId]._uploadCallback = cb;
				$scope.assets[existingId].___sourceAssetTimestamp = data.properties && data.properties.___sourceAssetTimestamp ? new Date(Date.parse(data.properties.___sourceAssetTimestamp)) : new Date(0);
			}
			//$scope.$apply();
		}

		// since file inputs are read-only...
		$scope.clearFileInput = function() {
			var input = $('#manageAssetsDialog #fileInput');
			input.replaceWith(input.val('').prop('disabled', !$scope.selectedAsset).clone(true));
		}

		// generate octal perms from checkbox array
		$scope.getPackedPermissions = function() {
			var perms = 0;
			if ($scope.selected.permissions.user) {
				perms = perms |
					$scope.selected.permissions.user.read * 0400 |
					$scope.selected.permissions.user.write * 0200 |
					$scope.selected.permissions.user.delete * 0100;
			}
			if ($scope.selected.permissions.group) {
				perms = perms |
					$scope.selected.permissions.group.read * 0040 |
					$scope.selected.permissions.group.write * 0020 |
					$scope.selected.permissions.group.delete * 0010;
			}
			if ($scope.selected.permissions.other) {
				perms = perms |
					$scope.selected.permissions.other.read * 0004 |
					$scope.selected.permissions.other.write * 0002 |
					$scope.selected.permissions.other.delete * 0001;
			}
			return perms;
		}

		$scope.fetchJSONAsset = function(id)
		{
			$.getJSON($scope.assets.appPath+'/assets/'+id)
			.done(function(data){
				$scope.selected.doc = data;
				$scope.$apply();
			});
		}

		// write asset data to the server
		$scope.saveData = function(id)
		{
			// generate file buffer from in-memory version if available
			var meta = id === 'new' ? $scope.new : $scope.assets[id];
			if( meta && meta.type === 'model/vnd.gltf+json' && meta.doc )
			{
				fileData[id] = strToBytes( JSON.stringify(meta.doc, null, '\t') );
			}

			if (!id || id === 'new')
			{
				if (fileData.new)
				{
					var perms = $scope.getPackedPermissions();
					var url = $scope.assets.appPath + '/assets/new';
					var queryChar = '?';
					if ($scope.selected.name) {
						url += queryChar + 'name=' + encodeURIComponent($scope.selected.name);
						queryChar = '&';
					}
					if ($scope.selected.description) {
						url += queryChar + 'description=' + encodeURIComponent($scope.selected.description);
						queryChar = '&';
					}
					if ($scope.selected.license) {
						url += queryChar + 'license=' + encodeURIComponent($scope.selected.license);
						queryChar = '&';
					}
					if ($scope.selected.group_name) {
						url += queryChar + 'group_name=' + encodeURIComponent($scope.selected.group_name);
						queryChar = '&';
					}
					if (perms) {
						url += queryChar + 'permissions=' + perms.toString(8);
						queryChar = '&';
					}
					if ($scope.selected.thumbnail) {
						url += queryChar + 'thumbnail=' + encodeURIComponent($scope.selected.thumbnail);
						queryChar = '&';
					}
					if ($scope.selected.isTexture) {
						url += queryChar + 'isTexture=' + encodeURIComponent($scope.selected.isTexture);
						queryChar = '&';
					}
					if ($scope.selected.type.slice(0, 6) === 'image/') {
						url += queryChar + 'width=' + $scope.selected.width + '&height=' + $scope.selected.height;
						queryChar = '&';
					}
					var xhr = new XMLHttpRequest();
					xhr.addEventListener('loadend', function(e)
					{
						if (xhr.status === 201)
						{
							$scope.assets.refresh(xhr.responseText, function(meta){
								var last_modified = new Date(Date.parse(meta.last_modified));
								$scope.selected._uploadCallback(xhr.responseText, last_modified);
							});

							fileData.new = null;
							$scope.selectedAsset = xhr.responseText;
							$scope.resetNew();
							$scope.clearFileInput();
						}
						else {
							alertify.alert('Upload failed: ' + xhr.responseText);
						}
					});
					xhr.open('POST', url);
					xhr.setRequestHeader('Content-Type', $scope.selected.type);
					if ($http.defaults.headers.post[appHeaderName]) {
						xhr.setRequestHeader(appHeaderName, $http.defaults.headers.post[appHeaderName]);
					}
					xhr.send(fileData.new);
				} else {
					alertify.alert('You must select a file to upload');
				}
			} else {
				var last_modified = null;
				async.series(
					[
						function promptOverwriteNeeded(cb) {
							//if the scope does not have a timestamp, then just upload
							if (!$scope.assets[$scope.selectedAsset].___sourceAssetTimestamp) {
								cb(true); //go to end;
							}
							cb(false);
						},
						function getLastModified(cb) {
							$.getJSON($scope.assets.appPath + '/assets/' + $scope.selected.id + "/meta", function(metadata) {
								last_modified = new Date(Date.parse(metadata.last_modified));
								cb(false);
							})
						},
						function compareDate(cb) {
							if (last_modified > $scope.assets[$scope.selectedAsset].___sourceAssetTimestamp)
								cb(false) // goto prompt
							else
								cb(true); // just overwrite
						},
						function promptOverWrite(cb) {
							alertify.confirm("The value you are posting is older than the last update to the server. You might be overwriting someone's update. Are you sure you want to upload?", function(ok) {
								if (ok)
									cb(true)
								else
									cb(false)
							})
						},
						function showDiff(cb) {
							alertify.confirm("View Differences?", function(ok) {
								if (ok)
								{
									$.getJSON($scope.assets.appPath + '/assets/' + $scope.selected.id , function(filedata) {
										var file1 = fileData[$scope.selected.id];
										file1 = JSON.parse(String.fromCharCode.apply(null, file1));
										var file2 = filedata;
										var diff = $.extend(true,objectDiff(file1,file2),objectDiff(file2,file1));
										require("vwf/view/editorview/JSONPrompt").prompt(diff);
									})
									cb(false)
								}
								else
									cb(false)
							});
						}
					],
				function doActualUploads(doit) {
					if (!doit) //if we got here and never got a true, then dont upload.
						return;
					var toComplete = 0;

					function checkRemaining() {
						toComplete -= 1;
						if (toComplete === 0) {
							$scope.assets.refresh($scope.selected.id, function(meta){
								var last_modified = new Date(Date.parse(meta.last_modified));
								$scope.selected._uploadCallback && $scope.selected._uploadCallback(null, last_modified);
							});
						}
					}
					if (fileData[$scope.selected.id]) {
						toComplete += 1;
						var xhr = new XMLHttpRequest();
						xhr.addEventListener('loadend', function(e) {
							if (xhr.status !== 200) {
								alertify.alert('Upload failed: ' + xhr.responseText);
							} else {
								$scope.clearFileInput();
								fileData[$scope.selected.id] = null;
							}
							checkRemaining();
						});
						xhr.open('POST', $scope.assets.appPath + '/assets/' + $scope.selected.id);
						xhr.setRequestHeader('Content-Type', $scope.selected.type);
						if ($http.defaults.headers.post[appHeaderName]) {
							xhr.setRequestHeader(appHeaderName, $http.defaults.headers.post[appHeaderName]);
						}
						xhr.send(fileData[$scope.selected.id]);
					}
					if ($scope.selected._basicDirty) {
						toComplete += 1;
						var meta = {
							name: $scope.selected.name,
							description: $scope.selected.description,
							license: $scope.selected.license,
							thumbnail: $scope.selected.thumbnail,
							width: $scope.selected.width || null,
							height: $scope.selected.height || null,
							isTexture: $scope.selected.isTexture
						};
						$http.post($scope.assets.appPath + '/assets/' + $scope.selected.id + '/meta', meta).success(checkRemaining)
							.error(function(data, status) {
								alertify.alert('Failed to post metadata: ' + data);
								checkRemaining();
							});
					}
					if ($scope.selected._groupDirty) {
						toComplete += 1;
						$http.post($scope.assets.appPath + '/assets/' + $scope.selected.id + '/meta/group_name', $scope.selected.group_name).success(checkRemaining)
							.error(function(data, status) {
								alertify.alert('Failed to change group: ' + data);
								checkRemaining();
							});
					}
					if ($scope.selected._permsDirty) {
						var perms = $scope.getPackedPermissions();
						toComplete += 1;
						$http.post($scope.assets.appPath + '/assets/' + $scope.selected.id + '/meta/permissions', perms.toString(8)).success(checkRemaining)
							.error(function(data, status) {
								alertify.alert('Failed to change permissions: ' + data);
								checkRemaining();
							});
					}
				});
			}
		}
		$scope.deleteData = function(id) {
			alertify.confirm('Are you POSITIVE you want to delete this asset?', function(confirmed) {
				if (confirmed) {
					$http.delete($scope.assets.appPath + '/assets/' + id)
						.success(function() {
							$scope.assets.refresh(id);
							$scope.selectedAsset = null;
						})
						.error(function(data) {
							alertify.alert('Delete failed: ' + data);
							$scope.assets.refresh(id);
							$scope.selectedAsset = null;
						});
				}
			});
		}
	}]);

	function nodeInherits(node, ancestor) {
		if (!node)
			return false;
		else if (node == ancestor)
			return true;
		else
			return nodeInherits(Engine.prototype(node), ancestor);
	}
	return {
		initialize: function() {
			$('#manageAssetsDialog').dialog({
				title: 'Manage Assets',
				width: 600,
				height: 600,
				autoOpen: false
			});
		},
		uploadSelectedEntity: function(overwrite) {
			var nodeId = _Editor.GetSelectedVWFID();
			var node = Engine.getNode(nodeId);
			if (node) {
				uploadVWFObject(
					node.properties.DisplayName,
					node,
					'application/vnd.vws-entity+json',
					overwrite ? node.properties.sourceAssetId : null,
					function(id, last_modified) {
						if(id) // null if updating
							vwf_view.kernel.setProperty(nodeId, 'sourceAssetId', id);
						//get the lastmodified tiem from the server
						vwf_view.kernel.setProperty(nodeId, '___sourceAssetTimestamp', last_modified.toString());
					}
				);
			} else setSelection('new');
		},
		uploadSelectedMaterial: function(overwrite) {
			var nodeId = _Editor.GetSelectedVWFID();
			var node = Engine.getNode(nodeId);
			if (node && node.properties.materialDef) {
				uploadVWFObject(
					node.properties.DisplayName + ' material',
					node.properties.materialDef,
					'application/vnd.vws-material+json',
					overwrite ? node.properties.materialDef.sourceAssetId : null,
					function(id) {
						var materialDef = node.properties.materialDef;
						materialDef.sourceAssetId = id;
						vwf_view.kernel.setProperty(nodeId, 'materialDef', materialDef);
					}
				);
			} else setSelection('new');
		},
		uploadSelectedBehavior: function(overwrite) {
			var nodeId = _Editor.GetSelectedVWFID();
			var node = Engine.getNode(nodeId);
			if (nodeId && nodeInherits(nodeId, 'http-vwf-example-com-behavior-vwf')) {
				uploadVWFObject(
					node.properties.DisplayName,
					node,
					'application/vnd.vws-behavior+json',
					overwrite ? node.properties.sourceAssetId : null,
					function(id) {
						vwf_view.kernel.setProperty(nodeId, 'sourceAssetId', id);
					}
				);
			} else setSelection('new');
		},
		uploadFile: function() {
			setSelection('new');
		}
	};
});
