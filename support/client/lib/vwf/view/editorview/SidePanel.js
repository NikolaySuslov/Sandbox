'use strict';

define(['vwf/view/editorview/angular-app'], function(app)
{
	app.controller('SidePanelController', ['$scope', function($scope)
	{
		window._SidePanel = $scope;

		$scope.isPanelOpen = function(){
			return $('#sidepanel').width() > 0;
		}

		$scope.showPanel = function(){
			$('#sidepanel').removeClass('hidden', 400);
		}

		$scope.hidePanel = function(){
			$('#sidepanel').addClass('hidden', 400);
		}

		$scope.isTabOpen = function(name){
			return $('#'+name+' .title').hasClass('sidetab-editor-title-active');
		}

		$scope.showTab = function(name)
		{
			$scope.showPanel();
			$('#'+name+' .title').addClass('sidetab-editor-title-active');
			$('#'+name+' .content').show('blind');
		}

		$scope.hideTab = function(name)
		{
			$('#'+name+' .content').hide('blind', function(){
				$('#'+name+' .title').removeClass('sidetab-editor-title-active');
				if( $('#sidepanel .sidetab-editor-title-active').length === 0 )
					$scope.hidePanel();
			});
		}
	}]);

	return window._SidePanel;
});

