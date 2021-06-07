class Model {
    constructor() {
        this.variableMap = {};
        this.variableDesc = [];
        this.originalDataLists = {};
        this.blockDataLists = {};
        this.tractDataMaps = {};
        this.geojsonInstances = {};
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

    getUnits(variableName) {
        return this.variableMap[variableName]['unit'];
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
        let minmax = this._getMinMax(key);
        let min = minmax[0];
        let max = minmax[1];
        let diff = max - min;
        return function (d) {
            return d > (min + diff * 7.0 / 8.0) ? colors[7] :
                   d > (min + diff * 6.0 / 8.0) ? colors[6] :
                   d > (min + diff * 5.0 / 8.0) ? colors[5] :
                   d > (min + diff * 4.0 / 8.0) ? colors[4] :
                   d > (min + diff * 3.0 / 8.0) ? colors[3] :
                   d > (min + diff * 2.0 / 8.0) ? colors[2] :
                   d > (min + diff * 1.0 / 8.0) ? colors[1] :
                                                  colors[0];
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
     * @param {*} maxColor
     */
    interpolate(maxColor, minColor) {
        var colorInterpolator = d3.interpolateRgb(maxColor, minColor);
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
     * @param {*} variableName The name of the variable that will be fetched
     * @param {*} variableName2 The name of the 2nd variable that will be fetched
     */
    async fetchData(key, variableName, variableName2) {
        let variable = this.variableMap[variableName]['name'];
        let variable2 = this.variableMap[variableName2]['name'];
        const response = await fetch("https://src.cals.arizona.edu/api/v1/scrutinizer/measurements?variable=" + variable);
        const data1 = await response.json();
        const response2 = await fetch("https://src.cals.arizona.edu/api/v1/scrutinizer/measurements?variable=" + variable2);
        const data2 = await response2.json();
        let data = [].concat(data1, data2);
        console.log(data);
        this.originalDataLists[key] = data;
        await this._createBlockData(key, data);
        await this._createTractDataMap(key, data);
        console.log(this.blockDataLists);
        console.log(this.tractDataMaps);
    }

    /**
     * Fills the blockDataLists variable under the specified key with the specified data. Each object in
     * the data list should have at least the 'location_type' and 'location_name' specifiers.
     * @param {*} key 
     * @param {*} data 
     */
    async _createBlockData(key, data) {
        let blockData = [];
        for (let i=0; i<data.length; i++) {
            if (data[i]['location_type'] === 'block_group' || data[i]['location_type'] === 'census_block') {
                if (data[i]['location_name'][0] !== '0') {
                    data[i]['location_name'] = '0' + data[i]['location_name'];
                }
                blockData.push(data[i]);
            } else if (data[i]['location_type'] === 'centroid' || data[i]['location_type'] === 'point') {
            }
        }
        this.blockDataLists[key] = blockData;
    }

    /**
     * Fills the tractDataMaps variable under the specified key with the specified data. Each object
     * in the data list should have at least the 'location_name' and 'location_type' specifiers
     * @param {} key 
     */
    async _createTractDataMap(key, data) {
        if (!(key in this.blockDataLists)) {
            console.log("Error in getBlockDataMap, " + key + " is not present.");
            return -1;
        }
        let tractData = {};
        for (let i=0; i<data.length; i++) {
            if (data[i]['location_type'] === 'block_group' || data[i]['location_type'] === 'census_block') {
                let tractId = data[i]['location_name'].slice(0, 11); // Organized as tracts, not block groups
                let value = parseFloat(data[i]['value']);
                if (!(tractId in tractData)) {
                    tractData[tractId] = [0, 0];
                }
                tractData[tractId][0] += value; // Current sum of values in the tract
                tractData[tractId][1] += 1;     // Current num of values in the tract
            }
    
        }
        this.tractDataMaps[key] = tractData;
    }

    /**
     * Gets the minimum and maximum data values from the tractMap under the specified key.
     * @param {*} key 
     */
    _getMinMax(key) {
        if (!(key in this.tractDataMaps)) {
            return [-1, -1];
        }
        let min = Number.MAX_VALUE;
        let max = Number.MIN_SAFE_INTEGER;
        let tractMap = this.tractDataMaps[key];
        for (var tractId in tractMap) {
            let avg = tractMap[tractId][0] / tractMap[tractId][1];
            if (avg < min) {
                min = avg;
            }
            if (max < avg) {
                max = avg;
            }
        }
        return [min, max];
    }
}