(function ()
{
    //'use strict';

    angular
        .module('app.abt')
        .factory('calcService', calcService);

    /** @ngInject */
    function calcService(){
        var service = {
            getPressureLevels           : getPressureLevels,
            averagePressure             : averagePressure,
            totalFlow                   : totalFlow,
            airDensity                  : airDensity,
            dynamicViscosity            : dynamicViscosity,
            correctedData               : correctedData,
            lnData                      : lnData,
            rSquared                    : rSquared,
            regParameters               : regParameters,
            flowValue                   : flowValue,
            powerData                   : powerData,
            correctedFlowCoefficient    : correctedFlowCoefficient,
            flowValue                   : flowValue,
            normalizedFlow              : normalizedFlow,
            effectiveLeakageArea        : effectiveLeakageArea
        }

        return service;

        // create an array of pressure setpoints based on range provided
        function getPressureLevels (start, stop, steps) {
            var levels = [];
            var stepSize = Number(Math.abs(stop - start) / (steps - 1));

            for(var i = start; i <= stop; i+= stepSize) {
                levels.push(i);
            }

            return levels;
        }

        // calculate the average pressure for a given setpoint
        function averagePressure (fans, target) {
            var sum = 0;
            var count = 0;
            var avg = 0;

            _.each(fans, function (elem, index) {
                if (elem.data[target] ) {
                    if (elem.data[target].pressure > 0) {
                        sum += elem.data[target].pressure;
                        count++;
                    }
                }
                
            });

            avg = Number(sum/count);

            return avg.toFixed(1);
        }

        // calculate the total flow for a given setpoint
        function totalFlow (fans, target) {
            var sum = 0;

            _.each(fans, function (elem, index) {
                if (elem.data[target]) {
                    sum += elem.data[target].flow;
                }
                
            });

            return sum.toFixed(0);
        }

        // calculate air density based on temperature and elevation
        function airDensity (t, e) {
           return 0.07517 * Math.pow((1 - (0.003566 * e) / 528), 5.2553) * (528 / (t + 460));
        }

        // calculate dynamic air viscosity based on temperature
        function dynamicViscosity (t) {
            return (0.002629 * Math.pow((t + 460), 0.5) ) / (1 + (198.7 / (t + 460)));
        }

        // return corrected pressure and flow data
        function correctedData (origData, baseline, rhoRatio) {
            var cData = [];

            _.each(origData, function(data, target) {
                cData.push({target: target, x: data.pressure - baseline, y: data.flow * rhoRatio});
            });

            return cData;
        }


        // return trendline data set based on power model
        function powerData(pressures, c, n) {
            var data = [];

            _.each(pressures, function(p, i) {
                data.push({x: p, y: flowValue(c, n, p)});
            })

            return data;
        }

        // perform log transform pressure and flow data
        function lnData (origData) {
            var lnData = [];

            _.each(origData, function(data, index) {
                lnData.push([Math.log(data.x), Math.log(data.y)]);
            })

            return lnData;
        }

        // return coefficient of determination
        function rSquared(data) {
            var regressionLine = ss.linearRegressionLine(ss.linearRegression(data));
            return ss.rSquared(data, regressionLine);
        }

        // return regression parameters for data
        function regParameters (data) {
            var regData             = ss.linearRegression(data);
            var pressureExponent    = regData.m;
            var flowCoefficient     = Math.exp(regData.b); 

            return [pressureExponent, flowCoefficient];
        }

        // return flow coefficient corrected to standard conditions (T = 68 'F, Elev = 0 ft)
        function correctedFlowCoefficient (c, n, mu, rho) {
            return c * Math.pow((mu / 0.04389), 2*n - 1) * Math.pow((rho / 0.07517), 1 - n);
        }

        // return flow value based on any pressure
        function flowValue(c, n, pressure) {
            return c * Math.pow(pressure, n);
        }

        // return flow per unit area
        function normalizedFlow (flow, area) {
            return flow / area;
        }

        // return area of hole that leaks same as building at reference pressure
        function effectiveLeakageArea(c, n, rho, p) {
            return 0.1855 * c * Math.pow((rho / 2), 0.5) * Math.pow(paToInH2O(p), (n - 0.5));
        }

        function paToInH2O (pa) {
            return pa / 249.088;
        }
    }
})();