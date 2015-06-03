module.exports = {
    'Load the blank world': function(browser, finished) {
      
        browser.loadBlankScene().then(function()
        {
             finished(true);   
        })
    }
};