/************************************
 * gtcGWExtendedSystemMoves         *
 ************************************
 * gtc_gw_play.js                   *
 * @author: gtc - gonzo             *
 * @version: 1.1 (2014-06-25)       *
 ************************************/

(function(){
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

    // max route depth const
    var maxRouteDepth = 20;

    // checks, if a galaxy 'a' has a route to galaxy 'b'
    model.galaxy.hasSystemRoute = function(a,b,visitedOnly){
        var route = model.galaxy.getSystemRoute(a,b,visitedOnly);
        if (route.length > 0){
            return true;
        }
        return false;
    }

    // returns the route (ARRAY) between galaxy 'a' and 'b'
    model.galaxy.getSystemRoute = function(a,b,visitedOnly){
        ((!visitedOnly)?visitedOnly=false:null);

        // check for same system
        if (a===b){
            return [];
        }

        // try to get route from cache
        var _lastRouteCache = routeCache.get(a,b,visitedOnly);
        if (_lastRouteCache){
            return _lastRouteCache;
        }

        var tmpRoute = [];
        var tmpRouteSize = maxRouteDepth;
        var finalRoute = [];

        // calcRoute func
        var calcRoute = function(a,b,cDepth){
            // check for finalRoutDepthSize (& maxDepth - for first finalRoute)
            if (cDepth >= tmpRouteSize){
                return;
            }          

            // get/check sourceSystem
            var sourceSystem = model.galaxy.systems()[a];
            if (!sourceSystem){
                return;
            }

            // check for existing route
            var arPos = $.inArray(a,tmpRoute);
            if(arPos >= 0 && arPos < cDepth){
                return;
            }

            // add route to index
            setRouteFor(cDepth,a);

            // find route foreach systemNeighbor
            _.forEach(sourceSystem.neighbors(),function(cNeighbor){
                var cIndex = cNeighbor.index;

                // check for final route
                if (cIndex === b){
                    // add route to index
                    setRouteFor((cDepth+1),cIndex);
                    setFinalRoute(tmpRoute);
                    return;
                }else if (visitedOnly && !cNeighbor.visited()){
                    return;
                }else{
                    // recursion
                    calcRoute(cIndex,b,(cDepth+1));
                }
            });
        };
        var setRouteFor = function(cDepth,cRoute){
            var newRouteArray = tmpRoute.slice(0,(cDepth+1));
            newRouteArray[cDepth] = cRoute;
            tmpRoute = newRouteArray;
        };
        var setFinalRoute = function(fRoute){
            // only set new route, if smaller than the current one
            if (fRoute.length < tmpRouteSize){
                finalRoute = fRoute;
                tmpRouteSize = fRoute.length;
            }
        };
        
        // calculate the smallest route between a-b
        calcRoute(a,b,0);

        // set tmp route to cache
        routeCache.set(a,b,visitedOnly,finalRoute);
        return finalRoute;
    };

    // moves 'from' system 'to' system
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

    // overwrite old 'move' function
    var _move = model.move;
    model.move = function() {
        var star = model.selection.star();

        // check neighbours
        if (!model.game().galaxy().areNeighbors(model.game().currentStar(), star)){
            return model.moveRoute(model.game().currentStar(), star);
        }
        return _move();
    };
    
    // overwrite old 'canMove' function
    var _canMove = model.canMove;
    model.canMove = function() {
        var _res = _canMove();
        if (!_res){
            var from = model.game().currentStar();
            var to = model.selection.star();
            return model.galaxy.hasSystemRoute(from,to,true);
        }
        return _res;
    };
})();