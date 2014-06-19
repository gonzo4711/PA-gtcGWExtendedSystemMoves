/************************************
 * gtcGWExtendedSystemMoves         *
 ************************************
 * gtc_gw_play.js                   *
 * @author: gtc - gonzo             *
 * @version: 1.1 (2014-06-18)       *
 ************************************/

(function(){
    var visitedNeighbors = function(cSystem){
        var cNeighbors = [];
        _.forEach(cSystem.neighbors(),function(n){
            if (n.visited()){
                cNeighbors.push(n);
            }
        });
        return cNeighbors;
    };

    var getInitialSetting = function(settingKey,initValue){
        // get setting for api
        if (typeof api.settings.data.ui[settingKey] != 'undefined'){
            return api.settings.data.ui[settingKey];
        }

        // get setting (gtcSettingsManager)
        //return settingHelper.getInitialSetting(settingKey,initValue);
        return initValue;
    };

    // last cached route
    var routeCache = {
        '_cache': {
            from : null,
            to: null,
            visitedOnly: false,
            route: []
        },
        'get': function(from,to,vO){
            if (this._cache.from == from && this._cache.to == to && this._cache.visitedOnly == vO){
                return this._cache.route;
            }
            return false;
        },
        'set': function(from,to,vO,route){
            this._cache = {
                'from' : from,
                'to': to,
                'visitedOnly': vO,
                'route': route
            };
        }
    };

    // max route depth - necessary setting against performance issues
    var maxRouteDepth = getInitialSetting("gw_max_move_routesize",5);

    // checks, if a galaxy 'a' has a route to galaxy 'b'
    model.galaxy.hasSystemRoute = function(a,b,visitedOnly){
        var route = model.galaxy.getSystemRoute(a,b,visitedOnly);
        if (route.length > 0){
            return true;
        }
        return false;
    }

    // returns the route (ARRAY) between galax 'a' and 'b'
    model.galaxy.getSystemRoute = function(a,b,visitedOnly){
        ((!visitedOnly)?visitedOnly=false:null);

        // try get route from cache
        var _lastRouteCache = routeCache.get(a,b,visitedOnly);
        if (_lastRouteCache){
            return _lastRouteCache;
        }

        var systemRouteCache = [];
        var finalRoutes = [];
        var routeSuccess = false;

        var calcRoute = function(a,b,cDepth){
            // check maxDepth
            if (cDepth >= maxRouteDepth){
                return;
            }

            // check for existing sourceSystem
            var sourceSystem = model.galaxy.systems()[a];
            if (!sourceSystem){
                return;
            }

            // add route to index
            setRouteFor(cDepth,a);

            // get systemNeighbors
            var cNeighbors = ((visitedOnly)?visitedNeighbors(sourceSystem):sourceSystem.neighbors());
            _.forEach(cNeighbors,function(cNeighbor){
                // break point here
                if (routeSuccess){
                    return;
                }

                var cIndex = cNeighbor.index;

                // check for existing route
                if($.inArray(cIndex,systemRouteCache) >= 0){
                    return;
                }

                // check for final route
                if (cIndex === b){
                    // add route to index
                    setRouteFor((cDepth+1),cIndex);
                    addFinalRoute(systemRouteCache);
                    return;
                }else{
                    calcRoute(cIndex,b,(cDepth+1));
                }
            });
        };
        var setRouteFor = function(cDepth,cRoute){
            var newRouteArray = systemRouteCache.slice(0,(cDepth+1));
            newRouteArray[cDepth] = cRoute;
            systemRouteCache = newRouteArray;
        };
        var addFinalRoute = function(fRoute){
            finalRoutes[finalRoutes.length] = fRoute;
        };
        var getClosestRoute = function(){
            var minRouteIndex = 0;
            var minRouteValue = (maxRouteDepth+1);
            if (finalRoutes.length == 0){
                return [];
            }

            _.forEach(finalRoutes,function(rData,rIndex){
                var cLength = rData.length;
                if (cLength < minRouteValue){
                    minRouteValue = cLength;
                    minRouteIndex = rIndex;
                }
            });
            return finalRoutes[minRouteIndex];
        }
        // calculate all routes between a-b
        calcRoute(a,b,0);

        // get closest route for finalRoutes
        var closestRoute = getClosestRoute();
        // set tmp route cache
        routeCache.set(a,b,visitedOnly,closestRoute);
        return closestRoute;
    };

    // moves to galaxy 'to' 
    model.moveRoute = function(from,to){
        var cMoveRoute = model.galaxy.getSystemRoute(from,to,true);

        var moveHandle = function(rIndex){
            if (typeof cMoveRoute[rIndex] == "undefined"){
                return;
            }
            var star = cMoveRoute[rIndex];
            var nextIndex = false;

            if (typeof cMoveRoute[(rIndex+1)] != "undefined"){
                nextIndex = (rIndex+1);
            }

            // set new move speed
            var newMoveSpeed = 0.001;
            var cachedMoveSpeed = model.player.moveSpeed();
            model.player.moveSpeed(newMoveSpeed);
            model.player.moveTo(star,function(){
                model.player.moveSpeed(cachedMoveSpeed);

                if (nextIndex){
                    moveHandle(nextIndex);
                }else{
                    model.selection.star(star);
                    var autoExplore = false;
                    if (!model.selection.system().visited()) {
                        model.revealSystem(model.selection.system());
                        var newStar = model.selection.system().star;
                        autoExplore = !newStar.ai() && !newStar.history().length && newStar.card();
                    }
                    model.game().move(star);
                    // impossible - no GW object here ...
                    //GW.manifest.saveGame(model.game());
                    if (autoExplore){
                        model.explore();
                    }
                }
            });
        }
        // start moving from system to system
        moveHandle(0);
        return true;
    };

    var _move = model.move;
    model.move = function() {
        var star = model.selection.star();

        // check neighbours
        if (!model.game().galaxy().areNeighbors(model.game().currentStar(), star)){
            return model.moveRoute(model.game().currentStar(), star);
        }
        return _move();
    };
    
    var _canMove = model.canMove;
    model.canMove = function() {
        var _res = _canMove();
        if (!_res){
            var from = model.game().currentStar();
            var to = model.selection.star();
            return model.galaxy.hasSystemRoute(from,to,true)
        }
        return _res;
    }
})();