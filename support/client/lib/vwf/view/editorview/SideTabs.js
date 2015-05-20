define(function() {

    this.initialize = function() {
        $('#sidepanel').append("<div id='sidetabs' />");
        $("#sidetabs").append("<div id='SideTabShow'  class='sidetab'>Editors</div>");
        $("#SideTabShow").click(function()
        {
            if ($('#sidepanel').offset().left + $('#sidepanel').width()/2 < $(window).width()) hideSidePanel();
                else showSidePanel();
        });
         $('#sidepanel').css('overflow','visible');
    }
    return this;
});