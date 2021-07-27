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
        let minmax = this.getMinMax(key);
        let min1 = minmax[0];
        let max1 = minmax[1];
        let diff1 = max1 - min1;
        let min2 = minmax[2];
        let max2 = minmax[3];
        if (min2 != 0 && max2 != 0) {
            let diff2 = max2 - min2;
            return function (d1, d2) {
                if (d1 >= (min1 + diff1 * 2.0 / 3.0)) {
                    if (d2 >= (min2 + diff2 * 2.0 / 3.0)) {
                        return colors[2];
                    } else if (d2 >= (min2 + diff2 * 1.0 / 3.0)) {
                        return colors[5];
                    } else {
                        return colors[8];
                    }
                } else if (d1 >= (min1 + diff1 * 1.0 / 3.0)) {
                    if (d2 >= (min2 + diff2 * 2.0 / 3.0)) {
                        return colors[1];
                    } else if (d2 >= (min2 + diff2 * 1.0 / 3.0)) {
                        return colors[4];
                    } else {
                        return colors[7];
                    }
                } else {
                    if (d2 >= (min2 + diff2 * 2.0 / 3.0)) {
                        return colors[0];
                    } else if (d2 >= (min2 + diff2 * 1.0 / 3.0)) {
                        return colors[3];
                    } else {
                        return colors[6];
                    }
                }
            }
        } else {
            return function (d1, d2) {
                if (d1 >= (min1 + diff1 * 2.0 / 3.0)) {
                    return colors[8];
                } else if (d1 >= (min1 + diff1 * 1.0 / 3.0)) {
                    return colors[7];
                } else {
                    return colors[6];
                }
            }
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
     * Return an array of 9 colors that represent different level in the map/legend based on
     * the darkest and lightest color for the first and second variable. 
     * Each group of 3 colors will be a row in the legend for a bivariate colormap, from bottom to top.
     * The horizontal direction will be of increasing first variable, and the vertical direction will 
     * be of increasing second variable
     * 
     * For example, min=white, max1=red, max2=blue
     * The array will be [white, lightred, red, lightblue, lightblue+lightred, lightblue+red, blue, blue+lightred, blue+red]
     * The legend will look like:
     * blue - blue+lightred - blue+red
     * lightblue - lightblue+lightred - lightblue+red
     * white - lightred - red
     * @param {*} minColor
     * @param {*} maxColor
     * @param {*} maxColor2
     */
    interpolate(minColor, maxColor1, maxColor2) {
        let colors = [];

        //colors for bottom row
        var colors1 = this._interpolateHelper(minColor, maxColor1, 3);

        //colors for leftmost column
        var colors2 = this._interpolateHelper(minColor, maxColor2, 3);

        // midde color of middle row
        var colors3 = this._interpolateHelper(colors1[1], colors2[1], 3);

        // last color of second row
        var colors4 = this._interpolateHelper(colors1[2], colors2[1], 3);

        // middle color of top row
        var colors5 = this._interpolateHelper(colors1[1], colors2[2], 3);

        // last color of top row
        var colors6 = this._interpolateHelper(colors1[2], colors2[2], 3);

        // pushing in order of populating the legend (left to right, top to bottom)
        colors.push(colors2[2]);
        colors.push(colors5[1]);
        colors.push(colors6[1]);
        colors.push(colors2[1]);
        colors.push(colors3[1]);
        colors.push(colors4[1]);
        colors.push(colors2[0]);
        colors.push(colors1[1]);
        colors.push(colors1[2]);

        return colors;
    }

    /**
     * Helper for diving each pair of colors
     * @param {*} minColor
     * @param {*} maxColor
     * @param {*} steps
     */
    _interpolateHelper(minColor, maxColor, steps) {
        var colorInterpolator = d3.interpolateRgb(minColor, maxColor);
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
        for (let i = 0; i < variables.length; i++) {
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
        const response = await fetch("https://src.cals.arizona.edu/api/v1/scrutinizer/measurements?variable=" + variable);
        const data1 = await response.json();
        let data = data1;
        if (variableName2 != "") {
            let variable2 = this.variableMap[variableName2]['name'];
            const response2 = await fetch("https://src.cals.arizona.edu/api/v1/scrutinizer/measurements?variable=" + variable2);
            const data2 = await response2.json();
            data = [].concat(data1, data2);
        }
        this.originalDataLists[key] = data;
        await this._createBlockData(key, data);
        await this._createTractDataMap(key, data, variableName, variableName2);
    }

    /**
     * Fills the blockDataLists variable under the specified key with the specified data. Each object in
     * the data list should have at least the 'location_type' and 'location_name' specifiers.
     * @param {*} key 
     * @param {*} data 
     */
    async _createBlockData(key, data) {
        let blockData = [];
        for (let i = 0; i < data.length; i++) {
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
    async _createTractDataMap(key, data, var1, var2) {
        if (!(key in this.blockDataLists)) {
            console.log("Error in getBlockDataMap, " + key + " is not present.");
            return -1;
        }
        let tractData = {};
        let varName1 = var1.slice(2, var1.length - 1);
        let varName2 = var2.slice(2, var2.length - 1);
        for (let i = 0; i < data.length; i++) {
            if (data[i]['location_type'] === 'block_group' || data[i]['location_type'] === 'census_block') {
                let tractId = data[i]['location_name'].slice(0, 11); // Organized as tracts, not block groups
                let value = parseFloat(data[i]['value']);
                if (!(tractId in tractData)) {
                    tractData[tractId] = [0, 0, 0, 0]; // for each tract, indexes 0 and 1 are the amount and count of 
                    // variable 1, and indexes 2 and 3 are those of variable 2
                }
                if (data[i]['variable_name'] == varName1) {
                    tractData[tractId][0] += value; // Current sum of values in the tract
                    tractData[tractId][1] += 1; // Current num of values in the tract
                }
                if (data[i]['variable_name'] == varName2) {
                    tractData[tractId][2] += value;
                    tractData[tractId][3] += 1;
                }
            }

        }
        this.tractDataMaps[key] = tractData;
    }

    /**
     * Gets the minimum and maximum data values for each variable from the tractMap under the specified key.
     * @param {*} key 
     */
    getMinMax(key) {
        if (!(key in this.tractDataMaps)) {
            return [-1, -1, -1, -1];
        }
        let min1 = Number.MAX_VALUE;
        let max1 = Number.MIN_SAFE_INTEGER;
        let min2 = Number.MAX_VALUE;
        let max2 = Number.MIN_SAFE_INTEGER;
        let tractMap = this.tractDataMaps[key];
        for (var tractId in tractMap) {
            let avg1 = tractMap[tractId][0] / tractMap[tractId][1];
            if (avg1 < min1) {
                min1 = avg1;
            }
            if (max1 < avg1) {
                max1 = avg1;
            }
            if (tractMap[tractId][2] != 0 && tractMap[tractId][3] != 0) {
                let avg2 = tractMap[tractId][2] / tractMap[tractId][3];
                if (avg2 < min2) {
                    min2 = avg2;
                }
                if (max2 < avg2) {
                    max2 = avg2;
                }
            } else {
                min2 = 0;
                max2 = 0;
            }
        }
        return [min1, max1, min2, max2];
    }
}