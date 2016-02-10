function avatarTools()
{

}
avatarTools.prototype.getAvatarDefFromSelection = function()
{
    var ID = _Editor.GetSelectedVWFID();
    if (!ID)
        return null;
    var object = _DataManager.getCleanNodePrototype(ID);
    if (!object)
        return null;
    object.extends = "character.vwf"
    if (!object.properties)
        object.properties = {};
    object.properties.originalvelocity = [0, 0, 0];
    if (!object.properties.cycles)
    {
        object.properties.cycles = {
            "jump":
            {
                "current": 0,
                "length": 66,
                "loop": false,
                "speed": 1.25,
                "start": 194
            },
            "run":
            {
                "current": 0,
                "length": 22,
                "loop": true,
                "speed": 1.25,
                "start": 38
            },
            "runningjump":
            {
                "current": 0,
                "length": 48,
                "loop": false,
                "speed": 1.25,
                "start": 109
            },
            "stand":
            {
                "current": 0,
                "length": 0,
                "loop": true,
                "speed": 1.25,
                "start": 1
            },
            "strafeleft":
            {
                "current": 0,
                "length": 16,
                "loop": true,
                "speed": -1.5,
                "start": 124
            },
            "straferight":
            {
                "current": 0,
                "length": 16,
                "loop": true,
                "speed": 1.5,
                "start": 108
            },
            "walk":
            {
                "current": 0,
                "length": 32,
                "loop": true,
                "speed": 1.45,
                "start": 6
            },
            "walkback":
            {
                "current": 0,
                "length": 32,
                "loop": true,
                "speed": -1.45,
                "start": 6
            }
        }
    }
    return object;
}
avatarTools.prototype.postAvatarDefinition = function()
{
    var def = this.getAvatarDefFromSelection();
    if (!def)
        console.error("no object selected");
    $.ajax(
    {
        url: "/vwfdatamanager.svc/avatar",
        data: JSON.stringify(def),
        type: "POST",
        contentType: "application/json",
        success: function(response, xhr)
        {
            console.log("avatar post successful");
        },
        error: function(response, xhr)
        {
            console.error(response);
        }
    })
}
define([], function()
{

    return new avatarTools();

})