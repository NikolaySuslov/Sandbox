module.exports.title = "Load the home page"
module.exports.test = function(browser, cb)
{
    browser
        .url('http://localhost:3000/adl/sandbox/')
        .getTitle()
        .then(function(title)
        {
            console.log('Title was: ' + title);
        })
        .catch(function(error)
        {
            console.log('uups something went wrong', error);
        })
        .then(function()
        {
            cb(true)
        });

}