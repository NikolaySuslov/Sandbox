'use strict';

define(['./angular-app', './manageAssets'], function(app)
{
	app.directive('redirectScroll', function(){
		return {
			scope: {
				'redirectScroll': '='
			},
			link: function($scope, elem, attrs)
			{
				$(elem).on('wheel', function(evt){
					if($scope.redirectScroll){
						evt.preventDefault();
						elem[0].scrollLeft += evt.originalEvent.deltaY;
					}
				});
			}
		};
	});

	function SortedList(sampler){
		this._sampler = sampler || function(x){ return x; };
		this.length = 0;
	}

	SortedList.prototype.insert = function(x)
	{
		var s = this._sampler;
		if(this.length === 0){
			Array.prototype.push.call(this, x);
		}
		else
		{
			var fIndex = this.length/2;
			var pow = 1;
			do
			{
				pow++;
				var mid = Math.floor(fIndex);

				if( s(x) < s(this[mid]) )
				{
					if( !this[mid-1] || s(x) >= s(this[mid-1]) ){
						Array.prototype.splice.call(this, mid, 0, x);
						return this;
					}
					else {
						fIndex -= this.length / Math.pow(2, pow);
					}
				}
				else
				{
					if( !this[mid+1] || s(x) <= s(this[mid+1]) ){
						Array.prototype.splice.call(this, mid+1, 0, x);
						return this;
					}
					else {
						fIndex += this.length / Math.pow(2, pow);
					}
				}
			}
			while(pow <= Math.ceil( Math.log2(this.length) )+1);

			throw 'Binary search exhausted!';
		}
	}

	SortedList.prototype.concat = function(list)
	{
		for(var i=0; i<list.length; i++){
			this.insert(list[i]);
		}
	}

	app.service('TextureDataManager', ['$http', function($http)
	{
		var data = {server: [], assets: []};

		Object.defineProperty(data, 'refresh', {
			enumerable: false,
			writable: false,
			value: function(cb)
			{
				$http.get('/sas/assets/by-meta/all-of'+
					'?user_name=' + encodeURIComponent(_UserManager.GetCurrentUserName())+
					'&isTexture=true'+
					'&returns=id,name,width,height,thumbnail',
					{}
				).then(
					function success(res)
					{
						data.assets = new SortedList(function(x){
							return x.name.toLowerCase();
						});

						var list = res.data.matches
						for(var i in list){
							list[i].url = '/sas/assets/'+i;
							if(list[i].thumbnail)
								list[i].thumbnail = '/sas/assets/'+ list[i].thumbnail.slice(6);
							data.assets.insert(list[i]);
						}

						cb();
					},
					function error(res){
						cb();
					}
				);
			}
		});

		$http.get('./vwfdatamanager.svc/textures', {}).then(
			function success(response){
				data.server.push.apply(data.server, response.data);
			},
			function error(response){}
		);

		return data;
	}]);

	var textureCallback = null;

	app.controller('MapBrowserController', ['$scope','TextureDataManager', function($scope, TexList)
	{
		$('#MapBrowser').dialog({
			title: 'Map Browser',
			show: {
				effect: "fade",
				duration: 300
			},
			hide: {
				effect: "fade",
				duration: 300
			},
			close: function(evt,ui){
				textureCallback = null;
			},
			open: function(evt,ui){
				TexList.refresh(function(){
					$scope.home[0].contents = TexList.assets;
					getSceneTextures();
				});
			},
			autoOpen: false,
			modal: false,
			height: 400,
			width: 600,
			minWidth: 315,
			closeOnEscape: false
		});

		function getSceneTextures()
		{
			$scope.home[1].contents = [];

			function getTexWithUrl(url, arr)
			{
				if(!arr) arr = $scope.home;

				var deepsearch = null;
				for(var i=arr.length-1; i >= 0; i--){
					if(arr[i].url === url)
						return arr[i];
					else if(arr[i].contents && (deepsearch = getTexWithUrl(url, arr[i].contents)))
						return deepsearch;
				}
				return null;
			}

			$scope.home[1].contents = _SceneManager.GetLoadedTextures().map(
				function(url){
					return getTexWithUrl(url) || {url: url, name: /[^\/]+$/.exec(url)[0]};
				}
			);
		}

		$scope.home = [
			{name: 'My Assets', contents: []},
			{name: 'Scene', contents: []},
			{name: 'Server', contents: TexList.server}
		];

		$scope.breadcrumbs = [];
		$scope.view = 'thumbnails'; // or 'list'
		$scope.searchTerms = '';

		$scope.followPath = function(crumbs, folder)
		{
			var base = folder || $scope.home;
			if(crumbs.length === 0){
				return base;
			}
			else
			{
				for(var i=0; i<base.length; i++){
					if(base[i].name === crumbs[0])
						return $scope.followPath(crumbs.slice(1), base[i].contents);
				}
				return [];
			}
		};

		$scope.itemClicked = function(item, crumbs)
		{
			if(item.contents){
				crumbs.push(item.name);
				$('#MapBrowser .folderview')[0].scrollTop = 0;
			}
			else if(textureCallback){
				textureCallback(item.url);
				$('#MapBrowser').dialog('close');
			}
		}

		$scope.loadByURL = function()
		{
			alertify.prompt('Enter the URL to a texture. The texture must be WebGL compatable and served from a domain that supports CORS', function(ok, url) {
				if(ok && textureCallback){
					textureCallback(url);
					$scope.$apply();
					$('#MapBrowser').dialog('close');
				}
			});
		}

		$scope.toggleSearchbox = function(state)
		{
			var searchbox = $('#MapBrowser input.searchbox');
			var searchbutton = $('#MapBrowser .button.search');
			if( state === undefined ){
				state = !searchbox.hasClass('visible');
			}

			if(state){
				searchbox.addClass('visible').select();
				searchbutton.addClass('active');
				searchbox.focus();
			}
			else {
				searchbox.removeClass('visible');
				searchbutton.removeClass('active');
			}
		}

		$scope.handleSearchInput = function(evt)
		{
			var KEY_ESC = 27, KEY_RETURN = 13;
			evt.stopImmediatePropagation();
			if(evt.which === KEY_ESC){
				$scope.toggleSearchbox(false);
			}
			else if(evt.which === KEY_RETURN)
			{
				var terms = evt.currentTarget.value;
				var resultsName = 'Search results for "'+terms+'"';

				if($scope.home.length < 4){
					$scope.home.push({
						name: resultsName,
						contents: getSearchResults(terms, $scope.home.slice(0,3))
					});
				}
				else {
					$scope.home[3] = {
						name: resultsName,
						contents: getSearchResults(terms, $scope.home.slice(0,3))
					};
				}
				$scope.breadcrumbs = [resultsName];
				$scope.toggleSearchbox(false);
			}
		}

		function getSearchResults(terms, folder)
		{
			var regex = new RegExp(terms, 'i');
			var ret = new SortedList(function(x){ return x.name; });

			for(var i=0; i<folder.length; i++){
				// add matching textures
				if(folder[i].url && regex.test(folder[i].name)){
					ret.insert(folder[i]);
				}
				else if(folder[i].contents){
					ret.concat( getSearchResults(terms, folder[i].contents) );
				}
			}

			return ret;
		}
	}]);


	return function(cb){
		textureCallback = cb;
		$('#MapBrowser').dialog('open');
	};
});

