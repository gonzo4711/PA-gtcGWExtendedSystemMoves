/************************************
 * gtcGWExtendedSystemMoves         *
 ************************************
 * gtc_settings.js                  *
 * @author: gtc - gonzo             *
 * @version: 1.1 (2014-06-18)       *
 ************************************/

(function() {
	// config for GTCSettingsManager
	/*model.addSetting.dropDown(
 		'gw_max_move_routesize',
 		'Galactic War: Extended move size',
 		{
 			'0': 'OFF',
 			'3': 'LOWEST (max 3 steps)',
 			'5': 'LOW (max 5 steps)',
 			'10': 'MED (max 10 steps)',
 			'15': 'HIGH (max 15 steps)',
 			'20': 'MAX (max 20 steps)'
 		},
 		10,
 		"performance",
 		"Galactic War"
 	);
	*/

 	// config for api
 	_.extend(api.settings.definitions.ui.settings,{
 		'gw_max_move_routesize' : {
			'title': 'Galactic War: Extended move size',
			'type': 'select',
			'default': 5,
			'options': [0,3,5,10,15,20],
			'optionsText': ['OFF','LOWEST (max 3 steps)','LOW (max 5 steps)','MED (max 10 steps)','HIGH (max 15 steps)','MAX (max 20 steps)']
		}
 	});
})();