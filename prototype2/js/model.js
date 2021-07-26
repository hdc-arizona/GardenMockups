class Model {
    constructor() {
        this.variableMap = {};
        this.variableDesc = [];
        this.originalDataLists = {};
        this.blockDataLists = {};
        this.tractDataMaps = {};
        this.geojsonInstances = {};
		this.mapCount = 2; // Number of active maps
		this.isLinked = false; // Whether the map views are currently linked
		// Whether you are setting the map's zoom via code
		this.isSetByCode = false; // This should toggle to determine if an event is triggered by the map or by the code
    }

    /**
     * Getter functions for the various data types in each map
     */
    getVariables() {
        return this.variableDesc;
    }

    getDataComponents() {
        return this.dataComponents;
    }

    getUnits(variables) {
        var units = [];
        for (var i = 0; i < variables.length;i++) {
            units.push(this.variableMap[variables[i]]['unit']);
        }
        return units;
    }

    getOriginalData(key) {
        if (key in this.originalDataLists)
            return this.originalDataLists[key];
        return [];
    }

    getBlockData(key) {
        if (key in this.blockDataLists)
            return this.blockDataLists[key];
        return [];
    }

    getTractData(key) {
        if (key in this.tractDataMaps)
            return this.tractDataMaps[key];
        console.log("Tract data key " + key + " not found");
        return {};
    }

    getColorMapping(colors, key) {
        return function (d) {
            return (d < 1) ?colors[Math.floor(d * 8.0)] : colors[colors.length - 1];
        }
    }

    getGeoJson(key) {
        if (key in this.geojsonInstances) {
            return this.geojsonInstances[key];
        }
        return null;
    } 

    setGeoJson(key, geojson) {
        this.geojsonInstances[key] = geojson;
    }

    removeData(key) {
        delete this.originalDataLists[key];
        delete this.blockDataLists[key];
        delete this.tractDataMaps[key];
        delete this.geojsonInstances[key];
    }

    /**
     * Return an array of colors that represent different level in the map/legend based on
     * the darkest and lightest color
     * @param {*} minColor
     * @param {*} maxColor
     */
    interpolate(minColor, maxColor) {
        var colorInterpolator = d3.interpolateRgb(minColor, maxColor);
        var steps = 8;
        var colors = d3.range(0, (1 + 1 / steps), 1 / (steps - 1)).map(function (d) {
            return colorInterpolator(d)
        });
        return colors;
    }

    /**
     * Fetches the scrutinizer variable metadata and stores it in the variableDesc and variableMap
     * variables.
     * variableDesc is a list in this format for each variable: description (name)
     * variableMap has each value of variableDesc as a key mapped to the metadata pulled from the
     * scrutinizer
     */
    async fetchVariables() {
        const response = await fetch("https://src.cals.arizona.edu/api/v1/scrutinizer/variables");
        const variables = await response.json();
        for (let i=0; i<variables.length; i++) {
            let desc = variables[i]['desc'] + ' (' + variables[i]['name'] + ')';
            this.variableDesc.push(desc);
            this.variableMap[desc] = variables[i];
        }
    }

    /**
     * Fetches the scrutinizer data for the specified variable. The data is stored in the
     *  originalDataLists, tractDataMaps, and blockDataLists variables under the specified
     *  key.
     * @param {} key The key that will be used to store the fetched data
     * @param {*} vars an array of variables that will be fetched
     */
    async fetchData(key, vars) {
        const dataAllVars = [];
        const varNames = []
        for (var i = 0; i < vars.length; i++) {
            let variable = this.variableMap[vars[i]]['name'];
            varNames.push(variable);
            const response = await fetch("https://src.cals.arizona.edu/api/v1/scrutinizer/measurements?variable=" + variable);
            const data = await response.json();
            dataAllVars.push(data);
        }
        this.originalDataLists[key] = dataAllVars;
        await this._createBlockData(key, dataAllVars);
        await this._createTractDataMap(key, dataAllVars, varNames);
    }

    /**
     * Fills the blockDataLists variable under the specified key with the specified data. Each object in
     * the data list should have at least the 'location_type' and 'location_name' specifiers.
     * @param {*} key 
     * @param {*} dataAllVars
     */
    async _createBlockData(key, dataAllVars) {
        let blockData = [];
        for (var i = 0; i < dataAllVars.length; i++) {
            var data = dataAllVars[i];
            for (let i = 0; i < data.length; i++) {
                if (data[i]['location_type'] === 'block_group' || data[i]['location_type'] === 'census_block') {
                    if (data[i]['location_name'][0] !== '0') {
                        data[i]['location_name'] = '0' + data[i]['location_name'];
                    }
                    blockData.push(data[i]);
                }
            }
        }
        this.blockDataLists[key] = blockData;
    }

    /**
     * Fills the tractDataMaps variable under the specified key with the specified data. Each object
     * in the data list should have at least the 'location_name' and 'location_type' specifiers
     * @param {} key 
     * @param {} dataAllVars
     * @param {} varNames
     */
    async _createTractDataMap(key, dataAllVars, varNames) {
        if (!(key in this.blockDataLists)) {
            console.log("Error in getBlockDataMap, " + key + " is not present.");
            return -1;
        }
        let tractData = {};
        for (var i = 0; i < dataAllVars.length; i++) {
            var data = dataAllVars[i];
            for (let j = 0; j < data.length; j++) {
                if (data[j]['location_type'] === 'block_group' || data[j]['location_type'] === 'census_block') {
                    let tractId = data[j]['location_name'].slice(0, 11); // Organized as tracts, not block groups
                    let value = parseFloat(data[j]['value']);

                    if (!(tractId in tractData)) { // if new tract, then create an array for all variables 
                        // with each one occupying two elements (one for sum of values and one for count of values)
                        tractData[tractId] = [];
                        for (var a = 0; a < varNames.length*2; a++) {
                            tractData[tractId][a] = 0;
                        }
                    }
                    var index = varNames.indexOf(data[j]['variable_name']);
                    tractData[tractId][index*2] += value; // Current sum of values of variable in the tract
                    tractData[tractId][index*2+1] += 1;     // Current num of values of the variable in the tract
                }
            }
        }
        tractData = this._normalize(varNames, tractData);
        this.tractDataMaps[key] = tractData;
    }

    /**
     * normalize data from tract data map by: 
     * 1) find the min+max averages of each variable
     * 2) for each tract, the normalized value of each variable is: 
     * (current value - min avg of the variable)/(max avg of the variable - min avg of the variable)
     * 3) sum up each normalized value in a tract
     * 4) normalized the sums over the map: (curr sum - min sum)/(max sum - min sum)
     */
    _normalize(varNames, tractMap) {
        let minMax = [];
        let normalizedValues = {};
        let sums = {};
        let minMaxSum = [];

        // find the min + max averages of each variable
        for (var i = 0; i < varNames.length; i++) {
            let min = Number.MAX_VALUE;
            let max = Number.MIN_SAFE_INTEGER;
            for (var tractId in tractMap) {
                let avg = 0;
                if (tractMap[tractId][i * 2 + 1] > 0) {
                    avg = tractMap[tractId][i * 2] / tractMap[tractId][i * 2 + 1];
                } 
                if (avg < min) {
                    min = avg;
                }
                if (max < avg) {
                    max = avg;
                }
            }
            minMax.push(min); minMax.push(max);
        }
        //console.log(minMax);

        // for each tract, the normalized value of each variable is: 
        // (current value - min avg of the variable) /(max avg of the variable - min avg of the variable)
        for (var i = 0; i < varNames.length; i++) {
            for (var tractId in tractMap) {
                let currAvg = 0;
                if (tractMap[tractId][i * 2 + 1] > 0) {
                    currAvg = tractMap[tractId][i * 2] / tractMap[tractId][i * 2 + 1];
                }
                let normalizedVal = (currAvg - minMax[i * 2]) / (minMax[i * 2 + 1] - minMax[i * 2]);
                if (!(tractId in normalizedValues)) {
                    normalizedValues[tractId] = [];
                }
                normalizedValues[tractId].push(normalizedVal);
            }
        }
        //console.log(normalizedValues);

        //sum up each normalized value in a tract
        for (var tractID in normalizedValues) {
            var currSum = 0;
            for (var a = 0; a < normalizedValues[tractID].length; a++) {
                currSum += normalizedValues[tractID][a];
            }
            sums[tractID] = currSum;
        }
        //console.log(sums);

        //normalized the sums over the map: (curr sum - min sum) /(max sum - min sum)
        let minSum = Number.MAX_VALUE;
        let maxSum = Number.MIN_SAFE_INTEGER;
        for (var tract in sums) {
            if (sums[tract] < minSum) {
                minSum = sums[tract];
            }
            if (sums[tract] > maxSum) {
                maxSum = sums[tract];
            }   
        }
        minMaxSum.push(minSum); minMaxSum.push(maxSum);
        //console.log(minMaxSum);

        for (var id in sums) {
            tractMap[id].push((sums[id] - minMaxSum[0]) / (minMaxSum[1] - minMaxSum[0]));
        }
        return tractMap;
    }
}