

define(['./angular-app', './panelEditor', './EntityLibrary', './MaterialEditor'], function(app, baseClass){


// Closure
(function() {
  /**
   * Decimal adjustment of a number.
   *
   * @param {String}  type  The type of adjustment.
   * @param {Number}  value The number.
   * @param {Integer} exp   The exponent (the 10 logarithm of the adjustment base).
   * @returns {Number} The adjusted value.
   */
  function decimalAdjust(type, value, exp) {
    // If the exp is undefined or zero...
    if (typeof exp === 'undefined' || +exp === 0) {
      return Math[type](value);
    }
    value = +value;
    exp = +exp;
    // If the value is not a number or the exp is not an integer...
    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
      return NaN;
    }
    // Shift
    value = value.toString().split('e');
    value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
    // Shift back
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
  }

  // Decimal round
  if (!Math.round10) {
    Math.round10 = function(value, exp) {
      return decimalAdjust('round', value, exp);
    };
  }
  // Decimal floor
  if (!Math.floor10) {
    Math.floor10 = function(value, exp) {
      return decimalAdjust('floor', value, exp);
    };
  }
  // Decimal ceil
  if (!Math.ceil10) {
    Math.ceil10 = function(value, exp) {
      return decimalAdjust('ceil', value, exp);
    };
  }
})();

    var primEditor = {};
    var isInitialized = false;
    var inSetup = true;

    window._PrimitiveEditor = {
        getSingleton: function(){
            if(!isInitialized){
                baseClass(primEditor,'PrimitiveEditor','Properties','properties',true,true,'#sidepanel .main')

                primEditor.init()
                //initialize.call(primEditor);
                primEditor.bind()
                isInitialized = true;
            }

            return primEditor;
        },
        isOpen: function(){
            return _SidePanel.isTabOpen("primitiveEditor");
        },
        hide: $.noop,
        callMethod: callMethod,
        setProperty: _setProperty,
    };

    app.controller('PrimitiveController', ['$scope', function($scope){
        //window._PrimitiveEditor = $scope;

        var flags = ["Name", "Visible","Static (does not move)", "Dynamic (moves frequently)", "Cast Shadows",
                     "Receive Shadows", "Passable (collides with avatars)", "Selectable (visible to pick)",
                     "Inherit Parent Scale"];
        var flagProps = ["DisplayName", "visible", "isStatic", "isDynamic", "castShadows", "receiveShadows", "passable", "isSelectable", "inheritScale"];

        $scope.flags = flags;
        $scope.flagProps = flagProps;

        var flagGroup = flagProps.map(function(elem){
            return "node.properties." + elem;
        });

        //Watch flags for changes
        $scope.$watchGroup(flagGroup, function(newVal, oldVal){
            if(newVal == oldVal) return;

            for(var i = 0; i < newVal.length; i++){
                var current = Engine.getProperty($scope.node.id, flagProps[i]);

                if(newVal[i] !== oldVal[i] && newVal[i] !== current){
                    if(newVal[i] || typeof newVal[i] === "boolean"){
                        setProperty($scope.node, flagProps[i], newVal[i]);
                    }
                    else if(i == 0 && !newVal[i]){
                        setProperty($scope.node, flagProps[0], $scope.node.id);
                    }
                }
            }
        });

        $scope.transform = {
            translation: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1]
        };

        $scope.$watch('node.properties.transform', updateTransform, true);
        $scope.$watch('transform', setTransform, true);

        $scope.allEditorData = [];
        $scope.childrenEditorData = [];
        $scope.node = null;
        $scope.refreshAccordion = 0;

        $scope.$watch('fields.selectedNode', function(node){
            console.log("node", node);

            if(node){
                $scope.node = node;
                $scope.allEditorData.length = 0;
                $scope.childrenEditorData.length = 0;
                if(!$scope.children) $scope.children = {};

                recursevlyAddPrototypes($scope.node, {}, $scope.node, $scope.allEditorData);

                setFlags();
                setupAnimation();
            }

            $scope.refreshAccordion = ($scope.refreshAccordion + 1) % 1000;
        });

        $scope.$watchCollection('fields.selectedNodeChildren', function(child, old){
            if(child && child != old){
                console.log('fields.selectedNodeChildren changed!', child);
                setupChildren();
            }

            $scope.refreshAccordion = ($scope.refreshAccordion + 1) % 1000;
        });

        function setupChildren(){
            if(!$scope.node) return;

            $scope.childrenEditorData.length = 0;
            var children = $scope.fields.selectedNodeChildren;

            for(var i = 0; i < children.length; i++){
                var child = children[i];
                recursevlyAddPrototypes(child, {}, child, $scope.childrenEditorData, true);
            }
        }

        $scope.animationPlayState = false;
        $scope.playAnimation = function(){
            var method = $scope.animationPlayState ? "play" : "pause";
            callMethod($scope.node, {method: method});
        }

        $scope.deleteNode = function(node){
            var user = _UserManager.GetCurrentUserName();
            if (user == null) {
                _Notifier.notify('You must log in to participate');
            }
            else if (_PermissionsManager.getPermission(user, node.id) == 0) {
                _Notifier.notify('You do not have permission to edit this object');
            }
            else{
                alertify.confirm("Are you sure you want to delete " + (node.name || node.id) + "?", function(confirmed){
                    if(confirmed === true) vwf_view.kernel.deleteNode(node.id);
                });
            }
        }

        function setupAnimation(){
            var node = $scope.node;
            var animationLength = Engine.getProperty(node.id, 'animationLength');

            if(animationLength > 0){
                //This should be moved into a yaml file and implemented by all objects that support animations
                $scope.animationEditorData = {
                    animationFrame: {displayname: "Animation Frame", property: "animationFrame", type: "slider", min: 0, max: parseFloat(animationLength), step: .01},
                    animationCycle: {displayname: "Animation Cycle", property: ["animationStart","animationEnd"], type: "rangeslider", min: 0, max: animationLength, step: .1},
                    animationSpeed: {displayname: "Animation Speed", property: "animationSpeed", type: "slider", min: 0, max: 10, step: .01},
                }
            }

            else if($scope.animationEditorData){
                $scope.animationEditorData = null;
            }
        }

        

        var transformFromVWF = false;
        function updateTransform(vwfTransform, oldTransform){
            var node = $scope.node;
            if(vwfTransform == oldTransform) return;
          
            try {
                //dont update the spinners when the user is typing in them, but when they drag the gizmo do.
                var mat = Engine.getProperty(node.id, 'transform');
                var angles = rotationMatrix_2_XYZ(mat);
                var pos = [mat[12],mat[13],mat[14]];

                for(var i = 0; i < 3; i++){
                    //since there is ambiguity in the matrix, we need to keep these values aroud. otherwise , the typeins don't really do what you would think
                    var scl = i * 4;
                    var newRot = Math.round10(angles[i],-3);
                    var newScale = Math.round10(MATH.lengthVec3([mat[scl],mat[scl+1],mat[scl+2]]) , -3) ;
                    var newPos = Math.round10(pos[i], -3)

                    //If newX == oldX, then this is the tailend of the Angular-VWF roundtrip initiated by the Sandbox
                    if(newRot != $scope.transform.rotation[i] ||
                        newScale != $scope.transform.scale[i]  ||
                        newPos != $scope.transform.translation[i]){

                        $scope.transform.rotation[i] = newRot;
                        $scope.transform.scale[i] = newScale;
                        $scope.transform.translation[i] = newPos;

                        transformFromVWF = true;
                    }
                }
            } catch (e) {
                console.error(e);
            }
        }

        function clamp(val,min,max)
        {
            if(val < min ) return min;
            if(val > max) return max;
            return val;
        }
        function setTransform(transform, oldTransform) {
            if(transform != oldTransform && !transformFromVWF){
                var val = [0, 0, 0];
                var scale = [1, 1, 1];
                var pos = [0, 0, 0];

                transform.rotation[0] = clamp(transform.rotation[0],-180,180);
                transform.rotation[1] = clamp(transform.rotation[1],-90,90);
                transform.rotation[2] = clamp(transform.rotation[2],-180,180);
                for(var i = 0; i < 3; i++){
                    val[i] = isNum(transform.rotation[i]) ? transform.rotation[i] : 0;
                    scale[i] = isNum(transform.scale[i]) ? parseFloat(transform.scale[i]) : 1;
                    pos[i] = isNum(transform.translation[i]) ? parseFloat(transform.translation[i]) : 0;
                }

                var m = new THREE.Matrix4();
                m.makeRotationFromEuler(new THREE.Euler(val[0]/  57.2957795,val[1]/  57.2957795,val[2]/  57.2957795));
                m.scale(new THREE.Vector3(scale[0],scale[1],scale[2]))
                m.elements[12] = pos[0];
                m.elements[13] = pos[1];
                m.elements[14] = pos[2];
                pushUndoEvent($scope.node, 'transform', m.elements);
                setProperty($scope.node, 'transform', m.elements);
            }

            transformFromVWF = false;

            function isNum(val){
                return typeof val === "number" && !isNaN(val);
            }
        }

        function rotationMatrix_2_XYZ(m) {
            var mat = new THREE.Matrix4();
            mat.elements = m;

            var rotmat = new THREE.Matrix4();
            rotmat.extractRotation(mat)
            var r = new THREE.Euler(0,0,0,'XYZ')
      
            r.setFromRotationMatrix(rotmat)
            return [r.x *  57.2957795,r.y*  57.2957795,r.z*  57.2957795]

        }

        function makeRotMat(x, y, z) {
            var r = new THREE.Euler(x/  57.2957795,y/  57.2957795,z/  57.2957795,'XYZ');
            var rotmat = new THREE.Matrix4();
            rotmat.makeRotationFromEuler(r);
            return rotmat.elements;
        }

        function setFlags(){
            for(var i = 0; i < flagProps.length; i++){
                if($scope.node.properties[flagProps[i]] === undefined){
                    var temp = Engine.getProperty($scope.node.id, flagProps[i]);
                    if(temp !== undefined){
                        $scope.node.properties[flagProps[i]] = temp;
                    }
                }
            }
        }

        function buildEditorData(node, editorData, existingProps, scopeNode, scopeEditorData){
            if(editorData){

                var outEditorData = {};
                var numAdds = 0;
                for (var key in editorData) {
                    if(!(key in existingProps)){
                        numAdds++;
                        outEditorData[key] = editorData[key];
                        existingProps[key] = true;

                        //If props is an array, remove any duplicate elements
                        var props = outEditorData[key].property;
                        if(Array.isArray(props))
                            outEditorData[key].property = getUniqueElems(props);
                    }
                }

                if(numAdds == 0) return;

                var props = node.properties;
                var obj = {
                    name: props.DisplayName || node.id,
                    type: props.type || Engine.getProperty(node.id, 'type'),
                    node: scopeNode,
                    editorProps: outEditorData
                };

                scopeEditorData.push(obj);
                setInheritedProperties(scopeNode, outEditorData);
            }
        }

        /**
            Iterate over properties in editorData. If it exists in the
            src node (base object), but not the dest node (derived object),
            then set the property on the derived object.
        */
        function setInheritedProperties(dest, editorData){
            for(var key in editorData){
                //vwfProp is necessary because the keys in EditorData are not always equal
                //to their respective "property" values. The VWF uses "property" internally.
                var vwfProp = editorData[key].property;

                //As it turns out, it's possible for vwfProp to be an array. The plot thickens.
                if(Array.isArray(vwfProp)){
                    for (var i = 0; i < vwfProp.length; i++) {
                        if(!(vwfProp[i] in dest.properties)){
                            setDefaultValue(dest, vwfProp[i], editorData[key].type);
                        }
                    }
                }
                else if(!(vwfProp in dest.properties)){
                    setDefaultValue(dest, vwfProp, editorData[key].type);
                }
            }
        }

        function setDefaultValue(dest, key, type){
            var value = Engine.getProperty(dest.id, key);

            if(value !== undefined){
                dest.properties[key] = value;
                //Engine.setProperty(dest.id, key, value);
            }
            else if(type === "color" || type === "vector"){

                var arr = [0, 0, 0];
                dest.properties[key] = arr;
                //Engine.setProperty(dest.id, key, arr);
            }
        }

        function recursevlyAddPrototypes(node, existingProps, scopeNode, scopeEditorData, ignoreBase){
            if(node){
                var protoId = Engine.prototype(node.id);
                buildEditorData(node, Engine.getProperty(node.id, "EditorData"), existingProps, scopeNode, scopeEditorData);
                if(protoId && !ignoreBase) recursevlyAddPrototypes(_Editor.getNode(protoId), existingProps, scopeNode, scopeEditorData);
            }
        }

        inSetup = false;
    }]);

    app.directive('vwfEditorProperty', ['$compile', function($compile){

		function pickNode(vwfNode, vwfProp){
            _Editor.TempPickCallback = function(node) {
                if(!node) return;

                _RenderManager.flashHilight(findviewnode(node.id));
                _Editor.TempPickCallback = null;
                _Editor.SetSelectMode('Pick');

                pushUndoEvent(vwfNode, vwfProp.property, node.id);
                setProperty(vwfNode, vwfProp.property, node.id);
            };

            _Editor.SetSelectMode('TempPick');
        }

        function showPrompt(vwfNode, vwfProp, value){
            alertify.prompt('Enter a value for ' + vwfProp.property, function(ok, value) {
                if (ok){
                    pushUndoEvent(vwfNode, vwfProp.property, value);
                    setProperty(vwfNode, vwfProp.property, value);
                }
            }, "" + value);
        }

        function linkFn(scope, elem, attr){
            scope.isUpdating = false;
            var valueBeforeSliding;

            //Necessary because color array references are shared internally and by the Sandbox
            var colorCopyArr;

            function updateSliderValue(node, prop, isUpdating){
                if(Array.isArray(prop)){

                    if(!valueBeforeSliding) valueBeforeSliding = [];
                    for(var i = 0; i < prop.length; i++){
                        var sliderValue = node.properties[prop[i]];

                        if(isUpdating) valueBeforeSliding[i] = sliderValue;

                        //The assumption here is only one property can change at a time...
                        else if(sliderValue !== valueBeforeSliding[i]){
                            pushUndoEvent(node, prop[i], sliderValue, valueBeforeSliding[i]);
                            break;
                        }
                    }
                }
                else{
                    var sliderValue = node.properties[prop];

                    //On initial slide, save value before slide occurred
                    //Once done sliding, push value onto undo stack
                    if(isUpdating){
                        //if array, shallow copy
                        if(Array.isArray(sliderValue)){
                            valueBeforeSliding = [];
                            for(var i = 0; i < sliderValue.length; i++){
                                valueBeforeSliding.push(sliderValue[i]);
                            }
                        }
                        else{
                            valueBeforeSliding = sliderValue;
                        }
                    }
                    else pushUndoEvent(node, prop, sliderValue, valueBeforeSliding);
                }
            }

            scope.onChange = function(index, override){
                  var node = scope.vwfNode, prop = scope.property, value;

                  //Some props are actually arrays (!), use index to get real property name
                  if(Array.isArray(prop)) prop = prop[index];

                  //Override is necessary to deal with cases where the model is not up to date
                  if(override != undefined) node.properties[prop] = override;
                  value = node.properties[prop];

                  //If property type is color, assign by value and not reference
                  if(scope.type == "color"){
                      if(!value) value = [0, 0, 0, 1];
                      if(!scope.isUpdating) pushUndoEvent(node, prop, colorCopyArr, value);

                      value[0] = colorCopyArr[0];
                      value[1] = colorCopyArr[1];
                      value[2] = colorCopyArr[2];
                      value[3] = colorCopyArr[3];

                      setProperty(node, prop, value);
                  }

                  else if(value !== Engine.getProperty(node.id, prop)){
                      if(!scope.isUpdating) pushUndoEvent(node, prop, value);
                      setProperty(node, prop, value);
                  }
            };

            if(scope.vwfProp){
                var exclude = ["vwfKey", "vwfNode", "vwfProp"];
                for(var key in scope.vwfProp){
                    if(exclude.indexOf(key) === -1)
                        scope[key] = scope.vwfProp[key];
                }

                console.log(scope.type);

                //Some Editor properties can actually be an array of properties!!
                if(Array.isArray(scope.property)){
                    //Some properties have duplicates (maybe to designate defaults?) Remove them.
                    scope.property = getUniqueElems(scope.property);
                    var uniques = scope.property.slice();
                    uniques.map(function(elem, i){
                        uniques[i] = 'vwfNode.properties.' + elem;
                    });

                    var getWatchFn = function(propIndex){
                        return function(newVal, oldVal){
                            if(Array.isArray(newVal)){
                                for (var i = 0; i < newVal.length; i++) {
                                    if(newVal[i] !== oldVal[i]){
                                        //scope.vwfNode[scope.property[propIndex]] = newVal;
                                        setProperty(scope.vwfNode, scope.property[propIndex], newVal);
                                        return;
                                    }
                                }
                            }
                            else if(newVal !== oldVal){
                                //scope.vwfNode[scope.property[propIndex]] = newVal;
                                setProperty(scope.vwfNode, scope.property[propIndex], newVal);
                            }
                        }
                    }

                    //Copy vectors instead of keeping a reference to array
                    if(scope.type === "rangevector"){
                        for(var i = 0; i < scope.property.length; i++){
                            var temp = scope.property[i];
                            scope.vwfNode.properties[temp] = scope.vwfNode.properties[temp].slice();
                        }
                    }
                    else{
                        if(scope.type === "rangeslider"){
                            scope.$watch('isUpdating', function(newVal, oldVal){
                                if(newVal !== oldVal) updateSliderValue(scope.vwfNode, scope.property, newVal);
                            });
                        }

                        else{
                            for (var i = 0; i < uniques.length; i++) {
                                //The assumption here is that these properties are min, max pairs pointed
                                //at primitive values (numbers). Thus, they shouldn't need "watchCollection"
                                //getWatchFn simply creates a closure so we know which property has changed.
                                scope.$watch(uniques[i], getWatchFn(i));
                            }
                        }
                    }
                }
                else if(scope.type.indexOf("slider") > -1){
                    scope.$watch('isUpdating', function(newVal, oldVal){
                        if(newVal !== oldVal) updateSliderValue(scope.vwfNode, scope.property, newVal);
                    });
                }
                else if(scope.type == 'color'){
                    //Interface with updated color picker
                    //if a color is already set, use it...
                    colorCopyArr = [];


                    var value = scope.vwfNode.properties[scope.property];
                    updateColor(value ? value : [0, 0, 0, 1], null, true);

                    scope.rgbColor = rgbaArrToObj(colorCopyArr, {});
                    scope.$watch('rgbColor', updateColor, true);
                    scope.$watch('vwfNode.properties.' + scope.property, function(newVal, oldVal){
                        if(newVal) rgbaArrToObj(newVal, scope.rgbColor);
                    }, true);

                    scope.colorSelect = function(a, b, c){
                        scope.isUpdating = false;
                        updateSliderValue(scope.vwfNode, scope.property, scope.isUpdating);
                    }

                    function updateColor(newVal, oldVal, skipChange){
                        console.log("Color updated");
                        if(newVal !== oldVal){

                            if(!scope.isUpdating){
                                scope.isUpdating = true;
                                updateSliderValue(scope.vwfNode, scope.property, scope.isUpdating);
                            }

                            if(skipChange !== true){
                                rgbaObjToArr(newVal, colorCopyArr);
                                scope.onChange();
                            }
                            else colorCopyArr = newVal.slice();
                        }
                    }
                }
                else if(scope.type === "nodeid") scope.pickNode = pickNode;
                else if(scope.type === "prompt") scope.showPrompt = showPrompt;
                else if(scope.type === "button") scope.callMethod = callMethod;
                else if(scope.type === "vector"){
                    scope.vwfNode.properties[scope.property] = scope.vwfNode.properties[scope.property].slice();
                }
                else if(scope.type == "assetPreloaderText")
                {
                }
                else if(scope.type == "assetPreloaderChoice")
                {
                    if( (scope.labels !== null) && (scope.values !== null) )
                    {
                        var _assetManager = window._AssetManager;
                        if((_assetManager !== null) && (_assetManager.assets !== null))
                        {
                            for(var asset in _assetManager.assets)
                            {
                                scope.labels.push(_assetManager.assets[asset].name);
                                scope.values.push('/sas/assets/' + _assetManager.assets[asset].id);
                            }
                        }
                    }
                }

                //Get template that corresponds with current type of property
                var template = $("#vwf-template-" + scope.type).html();
                $compile(template)(scope, function(e){
                    elem.html(e);
                });
            }
		}

		return {
			restrict: 'E',
			link: linkFn,
            replace: true,
            scope: { vwfProp: "=", vwfKey: "@", vwfNode: "=" },
		};
	}]);

    function callMethod(vwfNode, vwfProp){
        if (_UserManager.GetCurrentUserName() == null) {
            _Notifier.notify('You must log in to participate');
        }
        else if (vwfNode.id != 'selection') {
            if (_PermissionsManager.getPermission(_UserManager.GetCurrentUserName(), vwfNode.id) == 0) {
                _Notifier.notify('You do not have permission to edit this object');
                return;
            }
            vwf_view.kernel.callMethod(vwfNode.id || vwfNode, vwfProp.method || vwfProp);
        }
        else {
            alertify.alert('calling methods on multiple selections is not supported');
        }
    }

    function pushUndoEvent(node, prop, newVal, oldVal){
        //Ensure arrays are actually different (by value)
        if(Array.isArray(oldVal) && Array.isArray(oldVal) && newVal.length === oldVal.length){
            var isDiff = false;
            for(var i = 0; i < newVal.length; i++){
                if(oldVal[i] != newVal[i]){
                    isDiff = true;
                    break;
                }
            }

            if(!isDiff) return;
        }

        console.log("New undo event!", prop, newVal, oldVal);

        if(oldVal != undefined)
            _UndoManager.pushEvent( new _UndoManager.SetPropertyEvent(node.id, prop, newVal, oldVal) );
        else
            _UndoManager.pushEvent( new _UndoManager.SetPropertyEvent(node.id, prop, newVal) );
    }

    function _setProperty(id, prop, val, skipUndo){
        setProperty({id: id}, prop, val, skipUndo);
    }
    function setProperty(node, prop, val, skipUndo) {
        //prevent the handlers from firing setproperties when the GUI is first setup;
        if(inSetup) return;

        if (_UserManager.GetCurrentUserName() == null) {
            _Notifier.notify('You must log in to participate');
            return;
        }
        else if (node && node.id && _Editor.getSelectionCount() == 1) {
            if (_PermissionsManager.getPermission(_UserManager.GetCurrentUserName(), node.id) == 0) {
                _Notifier.notify('You do not have permission to edit this object');
                return;
            }
            vwf_view.kernel.setProperty(node.id, prop, val)
        }
        else {
            var undoEvent = new _UndoManager.CompoundEvent();

            for (var k = 0; k < _Editor.getSelectionCount(); k++) {
                if (_PermissionsManager.getPermission(_UserManager.GetCurrentUserName(), _Editor.GetSelectedVWFNode(k).id) == 0) {
                    _Notifier.notify('You do not have permission to edit this object');
                    continue;
                }

                undoEvent.push(new _UndoManager.SetPropertyEvent(_Editor.GetSelectedVWFNode(k).id, prop, val));
                vwf_view.kernel.setProperty(_Editor.GetSelectedVWFNode(k).id, prop, val)
            }
            if (!skipUndo)
                _UndoManager.pushEvent(undoEvent);
        }
    }

    function getUniqueElems(arr){
        var uniques = [];
        for (var i = 0; i < arr.length; i++) {
            if(uniques.indexOf(arr[i]) === -1)
                uniques.push(arr[i]);
        }
        return uniques;
    }

    function rgbaObjToArr(colorObj, colorArr){
        colorArr[0] = colorObj.r;
        colorArr[1] = colorObj.g;
        colorArr[2] = colorObj.b;
        colorArr[3] = colorObj.a;
        return colorArr;
    }

    function rgbaArrToObj(colorArr, colorObj){
        colorObj.r = colorArr[0];
        colorObj.g = colorArr[1];
        colorObj.b = colorArr[2];
        colorObj.a = colorArr[3];
        return colorObj;
    }

    return window._PrimitiveEditor;
}
// oldPrimEditor
);
