module.exports.title = "create an account"
module.exports.test = function(browser, cb)
{
	var GUID = global.testUtils.GUID;
    var password = GUID();
    browser
        .url('http://localhost:3000/adl/sandbox/')
        .click('#logina')
    .click('*=Sign Up Now').pause(100)
    .click('#txtusername').keys(GUID()).pause(100)
    .click('#txtpassword').keys(password).pause(100)
    .click('#txtpasswordconfirm').keys(password).pause(100)
    .click('#txtemail').keys(GUID()+'@' + GUID() +'.com').pause(100)
    .click('input[type="submit"]').pause(200)
    .url(function(err, url)
    {
        if (url && url.value == 'http://localhost:3000/adl/sandbox/')
		{
			cb(true)
			return;
		}
        else
        {
            browser.getText(".help-block")
            .then(function(text)
            {
                console.log('Title was: ' + text);
                cb(!text, text);
            })
        }
    })
}