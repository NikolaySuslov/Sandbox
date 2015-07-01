module.exports.title = "load the demo page"
module.exports.test = function(browser,cb)
{
	browser
		
		.url('http://localhost:3000/adl/sandbox/demos')
		.getTitle()
		.then(function(title) {
			console.log('Title was: ' + title);
			cb(true,title);
		})
		
		
}