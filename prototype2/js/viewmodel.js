class ViewModel {
    constructor() {
        this.model = new Model();
        this.colors = this.model.interpolate('yellow', 'firebrick');
        // the two colors passed into this function will be the two end colors of the legend
        // and map illustration (shows the greatest and lowest level)
        this.barsCountMap1 = 1;
        this.barsCountMap2 = 1;
        this.vars = [];
        // keeps track of number of search bars (variables in the two maps)
        try {
            this.model.fetchVariables();
        } catch (error) {
            console.log("Error Requesting variables from scrutinizer");
            console.log(error);
            alert("Variables Were Not Loaded from Scrutinizer");
        }
    }

    /**
      * Creates an empty map using the leaflet API
      * 
      * @param {*} mapId The id of the div that the map will attach to
      */
    createMap(mapId) {
        let mymap = L.map(mapId).setView([34.0489, -112.0937], 7);

        L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            maxZoom: 18,
            id: 'mapbox/streets-v11',
            tileSize: 512,
            zoomOffset: -1,
            accessToken: 'pk.eyJ1IjoiYmxhcmEiLCJhIjoiY2tnNzFrNmo2MDMweDJ5cW0zaXJwbWQ1ZyJ9.WydwzOibe0497pQbasuF-A'
        }).addTo(mymap);

        L.control.scale().addTo(mymap);
        return mymap;
    }

    /**
     * Creates an empty info box and attaches it to the map
     * 
     * @param {*} map The map object to add the info box to
     */
    createInfoBox(map) {
        // Adding the Data Box
        var info = L.control();
        info.onAdd = function (map) {
            this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
            this.update();
            return this._div;
        };
        info.update = function (props) { this._div.innerHTML = '<h6>No Data Present.</h6>'; }
        info.addTo(map);
        return info;
    }

    /**
     *  Creates a basic search bar with the Awesomplete library
     * 
     * @param {*} searchBar The input object that will become a search bar
     */
    createSearchBar(searchBar) {
        new Awesomplete(searchBar, {
            list: this.model.getVariables()
        });
    }

    /**
    *
    * Change the search button into a loading icon when clicked (only change when there is value in the search bar)
    * 
    * @param {*} btn the search btn
    */
    changeToLoad(btn) {
        btn.innerHTML = "";
        btn.className = "spinner-border text-info";
    }

    /**
    *
    * Change the search button's background back to original
    * 
    * @param {*} btn the search btn
    */
    changeBack(btn) {
        var id = btn.id[btn.id.length - 1];
        btn.innerHTML = "Search";
        if (id == 1) {
            btn.className = "btn btn-primary";
        }
        if (id == 2) {
            btn.className = "btn btn-danger";
        }
    }

    /**
     * Downloads data from the specified map into a csv file
     * 
     * @param {*} key The key for the map's data in the model
     */
    downloadBlockData(key) {
        let data = this.model.getBlockData(key);
        if (data.length === 0) {
            alert(key + " has no data to download.");
            return;
        }
        console.log(data);
        let csv = "Row,GeoId,StateFP,StateName,CountyFP,CountyName,TractCE,BlockgroupCE,Medium,Value\n";
        for (let i = 0; i < data.length; i++) {
            let geoId = data[i]['location_name'];
            csv += (i + 1) + ',';
            csv += '="' + geoId + '",';
            csv += '="' + geoId.slice(0, 2) + '",';
            csv += '="' + fipsToState[geoId.slice(0, 2)] + '",';
            csv += '="' + geoId.slice(2, 5) + '",';
            csv += '="' + fipsToCounty[geoId.slice(2, 5)] + '",';
            csv += '="' + geoId.slice(5, 11) + '",';
            csv += '="' + geoId[11] + '",';
            csv += '="' + data[i]['medium'] + '",';
            csv += data[i]['value'] + "\n";
        }
        var hiddenElement = document.createElement('a');
        hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
        hiddenElement.target = '_blank';
        hiddenElement.download = key + ".csv";
        hiddenElement.click();
    }

    /**
    * Downloads data from the specified table into a csv file
    * 
    * @param {*} key The key for the table's data in the model
    */
    downloadTableData(key) {
        let data = this.model.getBlockData(key);
        let id = key[key.length - 1];
        if (data.length === 0) {
            alert("table" + id + " has no data to download.");
            return;
        }
        let csv = "Name,Desc,Location Type,Location,Value\n";
        for (let i = 0; i < data.length; i++) {
            csv += data[i]['variable_name'] + ',';
            csv += data[i]['variable_desc'] + ',';
            csv += data[i]['location_type'] + ',';
            csv += data[i]['location_name'] + ',';
            csv += data[i]['value'] + "\n";

        }
        var hiddenElement = document.createElement('a');
        hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
        hiddenElement.target = '_blank';
        hiddenElement.download = "table" + id + ".csv";
        hiddenElement.click();
    }

    /**
     * Populates the legend with the colormapping being used by the specified visualiztion
     * 
     * @param {*} key The model key for the specified visualization's data
     * @param {*} legend The div object that will have the colormapping filled out
     * @param {*} colors array of colors that represent different amount
     */
    populateLegend(key, legend) {
        let colors = this.colors;
        legend.innerHTML = "";
        let legendWidth = 200;
        let legendHeight = 50;
        let counts = {};
        for (var i = 0; i < colors.length; i++) {
            counts[colors[i]] = 0;
        }
        let tractData = this.model.getTractData(key);
        let colorMapping = this.model.getColorMapping(colors, key);
        var maxCount = 0;
        for (let tractId in tractData) {
            let color = colorMapping(tractData[tractId][tractData[tractId].length-1]);
            counts[color] += 1;
            if (maxCount < counts[color])
                maxCount = counts[color];
        }
        var convertHeight = (count) => (count / maxCount) * legendHeight;
        let width = (legendWidth - 20) / 8;
        for (var i = 0; i < colors.length; i++) {
            let div = document.createElement("div");
            div.style.width = width + "px";
            div.style.height = (counts[colors[i]] / maxCount) * legendHeight + "px";
            div.style.left = width * i + "px";
            div.style.background = colors[i];
            div.className = "legendDiv";
            legend.appendChild(div);
        }
    }

    createTable(tableId, divId) {
        let container = document.getElementById(divId);
        let table = document.createElement("table");
        let row = document.createElement('tr');
        let head = document.createElement("thead");
        this._addHeaderColumn(row, 'Name');
        this._addHeaderColumn(row, 'Desc');
        this._addHeaderColumn(row, 'Location Type');
        this._addHeaderColumn(row, 'Location');
        this._addHeaderColumn(row, 'Value');
        head.appendChild(row);
        table.appendChild(head);
        table.id = tableId;
        table.className = "table table-striped";
        let body = document.createElement("tbody");
        table.appendChild(body);
        container.appendChild(table);
        let btn = document.createElement('button');
        let id = tableId[tableId.length - 1];
        btn.id = "downloadTable" + id;
        btn.innerHTML = "DOWNLOAD DATA";
        if (id == "1") {
            btn.className = "btn btn-primary";
        }
        if (id == "2") {
            btn.className = "btn btn-danger";
        }
        table.appendChild(btn);
        container.appendChild(table);

        let dataTable = $(table).DataTable({
            "language": {
                "search": "Filter: "
            }
        });
        $('.dataTables_length').addClass('bs-select');
        return dataTable;
    }

    /**
     * Empties and fills the given table object with the data for the given key
     * See the MDB DataTable API for methods for the DataTable object
     * 
     * @param {*} key The model key for the specified visualization's data
     * @param {*} table The DataTable object that will be filled and returned
     */
    async populateTable(key, table) {
        // removing all rows in the DataTable
        table.rows().remove();
        let data = this.model.getOriginalData(key);

        for (var i = 0; i < this.vars.length; i++) {
            let varData = data[i];
            for (let i = 0; i < varData.length; i++) {
                table.row.add(
                    [
                        varData[i]['variable_name'],
                        varData[i]['variable_desc'],
                        varData[i]['location_type'],
                        varData[i]['location_name'],
                        varData[i]['value']
                    ]);
            }
        }
        
        table.draw();
        return table;
    }

    /**
     * Adds a th element to the given thead element
     * 
     * @param {*} head The thead element
     * @param {*} name The inner text value of the th element
     */
    _addHeaderColumn(head, name) {
        let col = document.createElement("th");
        col.innerText = name;
        col.className = 'th-sm';  // th-sm is a class for the mdb DataTable
        head.appendChild(col);
    }

    _addColumnValue(row, value) {
        let col = document.createElement('td');
        col.innerText = value;
        row.appendChild(col);
    }

    /**
     * Populates the map with data regarding the specified variable
     * 
     * @param {*} key 
     * @param {*} map 
     * @param {*} infoBox 
     */
    async populateMap(key, map, infoBox) {
        let old_geojson = this.model.getGeoJson(key);
        if (old_geojson !== null) {
            map.removeLayer(old_geojson);
        }
        let varNames = [];
        for (var i = 0; i < this.vars.length; i++) {
            varNames.push(this.model.variableMap[this.vars[i]]['name']);
        }

        var now = new Date();
        console.log("\n\nCURRENT TIME: " + now + "\n\nStart fetching from database after" + this.vars + " is selected....");
        var start1 = new Date();

        try {
            await this.model.fetchData(key, this.vars).then((response) => {

                var end1 = new Date();
                var duration1 = end1.getTime() - start1.getTime();
                console.log("\nTime recorded: " + duration1 + " milliseconds\n");

                var start2 = new Date();
                console.log("\n\nStart rendering the map after" + this.vars + " is selected.....");

                let colorMapping = this.model.getColorMapping(this.colors, key);
                let tractData = this.model.getTractData(key);
                let parseFeature = this._parseFeature(tractData, colorMapping);
                let style = this._style(parseFeature);
                infoBox.update = this._update(tractData, this.model.getUnits(this.vars), varNames);
                let highlightFeature = this._highlightFeature(infoBox);
                var geojson;
                let resetHighlight = function (e) {
                    geojson.resetStyle(e.target);
                    infoBox.update();
                }
                let zoomToFeature = this._zoomToFeature(map);
                let onEachFeature = this._onEachFeature(highlightFeature, resetHighlight, zoomToFeature);
                geojson = L.geoJson(censusBlockData, { style: style, onEachFeature: onEachFeature }).addTo(map);
                this.model.setGeoJson(key, geojson);

                var end2 = new Date();
                var duration2 = end2.getTime() - start2.getTime();
                var total = duration1 + duration2;
                console.log("\n\nTime recorded: " + duration2 + " milliseconds\n");
                console.log("\nTotal time elapsed after" + this.vars + " is selected: " + total + " milliseconds\n");
                return 1;
            });

        } catch (error) {
            var end = new Date();
            var duration = end.getTime() - start1.getTime();
            console.log("\nCould not load data from scrutinizer");
            console.log("\nTotal time elapsed after" + this.vars + " is selected: " + duration + " milliseconds\n");
            return -1;
        }
    }

    /*
    * Get the output from populating the map that records time 
    */
    getOutput() {
        return this.output;
    }

    /*
    * Query the DB for a given variable without changing the map
    * @param {*} key
    * @param {*} variableName
    */
    async fetchVariable(key, variableName) {
        try {
            await this.model.fetchData(key, variableName).then((response) => {
                console.log("Successfully fetch " + variableName + " data from scrutinizer"); 
                return 1;
            });
        } catch (error) {
            console.log("Could not load " + variableName + " data from scrutinizer");
            return -1;
        }
    }

    /**
    * Resizes maps and tables based on window size
    * Currently only depends on screen width
    * Recognizes small(<1250px), medium(1250-1700px), and large(>1700px)
    *
    * The maps and tables will also expand to fill the screen,
    * This just sets the initial sizes of the containers so they can't get too small
    */
    resize() {
        let x_size = window.innerWidth;
        let sizeClasses = ["smallScreen", "midScreen", "largeScreen"]
        let sizeClass = "midScreen";
        if (x_size < 1250) {
            sizeClass = "smallScreen";
        } else if (x_size < 1700) {
            sizeClass = "midScreen";
        } else if (x_size >= 1700) {
            sizeClass = "largeScreen";
        }
        // My current plan here is to mark all elements that need to be resized with the "sizeable" class
        // Then it's easy to go through and change the class that designates the actual size
        let sizedElements = document.getElementsByClassName("sizeable");
        for (var i = 0; i < sizedElements.length; i++) {
            // Clear previous size
            for (var j = 0; j < sizeClasses.length; j++) {
                sizedElements[i].classList.remove(sizeClasses[j]);
            }
            sizedElements[i].classList.remove("singleMap");
            // Add new size
            sizedElements[i].classList.add(sizeClass);
            if (this.model.mapCount == 1) {
                sizedElements[i].classList.add("singleMap");
            }
        }
    }

    /**
    * Toggles the disabled class on the second map
    */
    toggleMap2() {
        let mapElement = document.getElementById("viz2");
        let tableElement = document.getElementById("table2_wrapper");
        if (tableElement.classList.contains("disabled")) {
            tableElement.classList.remove("disabled");
            mapElement.classList.remove("disabled");
            this.model.mapCount = 2;
        } else {
            tableElement.classList.add("disabled");
            mapElement.classList.add("disabled");
            this.model.mapCount = 1;
        }
        this.resize();
    }

    /**
    * Toggles the value parameter of the given object between value1 and value2
    *
    * @param {*} object Element with value parameter
    * @param {*} value1 First value to toggle between
    * @param {*} value2 Second value to toggle between
    */
    toggleValue(object, value1, value2) {
        if (object.value == value1) {
            object.value = value2
        } else {
            object.value = value1
        }
    }

    toggleSync() {
        this.model.isLinked = !this.model.isLinked;
    }

    /**
    * Sync maps
    */
    syncMaps(map1, map2) {
        if (this.model.isLinked && !this.model.isSetByCode) {
            // When map1 changes to reflect map2, it will register that change
            // This will trigger map2 to change to reflect map1 and so on
            // The isSetByCode flag makes it ignore every other change to avoid this
            // infinite recursion problem
            this.model.isSetByCode = true;
            map1.flyTo(map2.getCenter(), map2.getZoom());
        } else {
            this.model.isSetByCode = false;
        }
    }

    /*
     *
     * Helper functions for populating the map
     *  
     */

    _parseFeature(tractData, colorMapping) {
        return function (feature) {
            let string = "" + feature.properties['STATE'] + feature.properties['COUNTY'] + feature.properties['TRACT'];
            if (string in tractData) {
                return colorMapping(tractData[string][tractData[string].length - 1]);
            }
            return 0;
        }
    }

    _style(parseFeature) {
        return function (feature) {
            return {
                fillColor: parseFeature(feature),
                weight: 1,
                opacity: 1,
                color: 'white',
                dashArray: '3',
                fillOpacity: 0.7
            };
        }
    }

    _update(tractData, units, varNames) {
        return function (props) {
            if (props) {
                let key = props['STATE'] + props['COUNTY'] + props['TRACT'];
                var hoverData = "";
                for (var i = 0; i < units.length; i++) {
                    if (key in tractData) {
                        hoverData += "<b>" + varNames[i] + ": </b>" + tractData[key][i * 2].toFixed(2) + ' ' + units[i] + "<br/>"
                    }
                }
                this._div.innerHTML = '<h6>Data Value</h6>' + (key in tractData ?
                    hoverData : 'Hover over a tract');
            }
        };
    }

    _highlightFeature(infoBox) {
        return function (e) {
            var layer = e.target;
            layer.setStyle({
                weight: 2,
                color: '#666',
                dashArray: '',
                fillOpacity: 0.7
            });

            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                layer.bringToFront();
            }
            infoBox.update(layer.feature.properties);
        }
    }

    _zoomToFeature(map) {
        return function (e) {
            map.fitBounds(e.target.getBounds());
        }
    }

    _onEachFeature(highlightFeature, resetHighlight, zoomToFeature) {
        return function (feature, layer) {
            layer.on({
                mouseover: highlightFeature,
                mouseout: resetHighlight,
                click: zoomToFeature
            });
        }
    }

    /*
    * Add a search bar (for one more variable)
    * @param {*} barDiv
    */
    addSearchBar(barDiv) {
        var bars = document.getElementById(barDiv);
        var brk = document.createElement("br");
        bars.appendChild(brk);
        var newBar = document.createElement("input");
        if (bars.id == "bars1") {
            newBar.id = "searchBar1." + this.barsCountMap1;
            this.barsCountMap1++;
            var mapID = 1;
        } else {
            newBar.id = "searchBar2." + this.barsCountMap2;
            this.barsCountMap2++;
            var mapID = 2;
        }
        bars.appendChild(newBar);
        this.createSearchBar(newBar);
        newBar.addEventListener('keyup', function (event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                document.getElementById("search" + mapID).click();
            }
        });
    }

    /*
    * Delete a search bar (until reach 1 bar)
    * @param {*} barDiv
    */
    delSearchBar(barDiv) {
        var bars = document.getElementById(barDiv);
        if (bars.id == "bars1") {
            this.barsCountMap1--;
            if (this.barsCountMap1 > 1) {
                bars.removeChild(bars.lastElementChild);
            }
        } else {
            this.barsCountMap2--;
            if (this.barsCountMap2 > 1) {
                bars.removeChild(bars.lastElementChild);
            }
        }
        bars.removeChild(bars.lastElementChild); // remove <br/>
    }

    /*
    * Save all current variables on search bars
    * @param {*} barDiv
    */
    saveSearchValues(barDiv) {
        this.vars = [];
        var bars = document.getElementById(barDiv);
        if (bars.id == 'bars1') {
            var numBars = this.barsCountMap1;
            for (var i = 0; i < numBars; i++) {
                var bar = document.getElementById("searchBar1." + i);
                if (bar.value != "") {
                    this.vars.push(bar.value);
                }
            }
        } else {
            var numBars = this.barsCountMap2;
            for (var i = 0; i < numBars; i++) {
                var bar = document.getElementById("searchBar2." + i);
                if (bar.value != "") {
                    this.vars.push(bar.value);
                }
            }
        }
    }

    /*
    * Get all variables being saved for searching
    */
    getVars() {
        return this.vars;
    }
}


