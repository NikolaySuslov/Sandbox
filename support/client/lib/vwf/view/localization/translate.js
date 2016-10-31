define({
    initialize: function() {
        window.translateMenu = function() {
            var toTranslateElements = document.getElementsByTagName("a");
            //debugger; nextSubling glyphicon className
            for (var i = 0; i < toTranslateElements.length; i++) {
                var elem = toTranslateElements[i].firstChild;
                if (elem != null) {
                    if (elem.nextSibling != null) {
                        if (elem.nextSibling.className.indexOf('glyphicon') !== -1) {
                            if (elem.nextSibling.nextSibling != null) {
                                if (elem.nextSibling.nextSibling.nodeType == 3) {
                                    elem.nextSibling.nextSibling.nodeValue = i18n.t(elem.nextSibling.nextSibling.nodeValue);
                                }
                            }
                        } else {
                            if (elem.nodeType == 3) {
                                elem.nodeValue = i18n.t(elem.nodeValue);
                            }
                        }
                    }
                    if (elem.nodeType == 3) {
                        elem.nodeValue = i18n.t(elem.nodeValue);
                    }
                }
            }
        }
    }

});