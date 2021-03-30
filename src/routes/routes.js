'use strict';

module.exports = function(app){
    // memanggil module controllers
    const json = require('../controllers/controllers');

    // url home
    app.route('/')
        .get(json.home)
    
    // url result
    app.route('/details')
        .get(json.uiResult);

    // request on relay
    app.route('/pompa-on')
        .post(json.relayOn);

    // request off relay
    app.route('/pompa-off')
        .post(json.relayOff);

    // routes api results
    app.route('/api/results')
        .get(json.results);
    
    // routes for get all data
    app.route('/api/get-all')
        .get(json.getData);  
};