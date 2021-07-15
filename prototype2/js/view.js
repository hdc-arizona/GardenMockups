var map1 = null;
var map2 = null;
var table1 = null;
var table2 = null;
var infoBox1 = null;
var infoBox2 = null;
var viewModel = null;

document.addEventListener("DOMContentLoaded", function () {
	viewModel = new ViewModel();
	map1 = viewModel.createMap("map1");
	map2 = viewModel.createMap("map2");
	infoBox1 = viewModel.createInfoBox(map1);
	infoBox2 = viewModel.createInfoBox(map2);
	viewModel.createSearchBar(document.getElementById("searchBar1"));
	viewModel.createSearchBar(document.getElementById("searchBar1.1"));
	viewModel.createSearchBar(document.getElementById("searchBar2"));
	viewModel.createSearchBar(document.getElementById("searchBar2.1"));
	table1 = viewModel.createTable("table1", "tables");
	table2 = viewModel.createTable("table2", "tables");
	viewModel.populateLegend("map1", document.getElementById("legend1"));
	viewModel.populateLegend("map2", document.getElementById("legend2"));

	// View UI Listeners
	document.getElementById("searchBar1").addEventListener('keyup', function (event) {
		if (event.keyCode === 13) {
			event.preventDefault();
			document.getElementById("search1").click();
		}
	});
	document.getElementById("search1").addEventListener('click', (event) => {
		var var1 = document.getElementById("searchBar1").value;
		var var2 = document.getElementById("searchBar1.1").value;
		if ((var1 != "")) {
			viewModel.changeToLoad(document.getElementById("search1"));
			viewModel.populateMap("map1", map1, infoBox1, var1, var2).then((status) =>
				viewModel.changeBack(document.getElementById("search1")) |
				viewModel.updateLegend("map1", document.getElementById("var1map1"), document.getElementById("var2map1"))).then((status) =>
					viewModel.populateTable("map1", table1));
		}
	});
	document.getElementById("searchBar2").addEventListener('keyup', function (event) {
		if (event.keyCode === 13) {
			event.preventDefault();
			document.getElementById("search2").click();
		}
	});
	document.getElementById("search2").addEventListener('click', (event) => {
		var var3 = document.getElementById("searchBar2").value;
		var var4 = document.getElementById("searchBar2.1").value;
		if (var3 != "") {
			viewModel.changeToLoad(document.getElementById("search2"));
			viewModel.populateMap("map2", map2, infoBox2, var3, var4).then((status) =>
				viewModel.changeBack(document.getElementById("search2")) |
				viewModel.updateLegend("map2", document.getElementById("var1map2"), document.getElementById("var2map2"))).then((status) =>
					viewModel.populateTable("map2", table2));
		}
	});

	document.getElementById("download1").addEventListener('click', () => {
		viewModel.downloadBlockData("map1");
	});
	document.getElementById("download2").addEventListener('click', () => {
		viewModel.downloadBlockData("map2");
	});
	document.getElementById("downloadTable1").addEventListener('click', () => {
		viewModel.downloadTableData("map1");
	});
	document.getElementById("downloadTable2").addEventListener('click', () => {
		viewModel.downloadTableData("map2");
	});


	document.getElementById("toggleMapButton").addEventListener('click', (event) => {
		viewModel.toggleMap2();
		viewModel.toggleValue(event.target, "Hide", "Show");
		map1.invalidateSize();
		map2.invalidateSize();
	});

	document.getElementById("linkMapButton").addEventListener('click', (event) => {
		viewModel.toggleSync();
		viewModel.toggleValue(event.target, "Link", "Unlink");
	});

	map1.addEventListener('moveend', () => {
		viewModel.syncMaps(map2, map1);
	});

	map2.addEventListener('moveend', () => {
		viewModel.syncMaps(map1, map2);
	});

	window.addEventListener('resize', () => {
		viewModel.resize();
	});

	// I need to access the tables, but I'm not sure if I can directly edit any of that code, so this is going here temporarily
	{
		// Make table wrappers sizeable
		let tableWrappers = document.getElementsByClassName("dataTables_wrapper");
		for (var i = 0; i < tableWrappers.length; i++) {
			tableWrappers[i].classList.add("sizeable");
		}

		// Add empty panel between tables to match the gap between maps
		let spacingPanel = document.createElement('div');
		spacingPanel.id = "placeholder";
		spacingPanel.className = "sizeable";
		tableWrappers[0].parentNode.insertBefore(spacingPanel, tableWrappers[1]);
	}


	viewModel.resize();
	map1.invalidateSize();
	map2.invalidateSize();

	// initial background DB query (1 variable only)
	viewModel.fetchVariable("map1", " (cadmium)");

	//automatic searches for recording time
	//setTimeout(function () { startSearch(" (arsenic)", " (barium)", 10000); }, 5000);
	//setTimeout(function () { startSearch(" (copper)", " (zinc)", 10000); }, 25000);
	
});


/**
* Start a search with a given variable name and print out the time taken for the search
*
* @param {*} variableName
 *@param {*} variableName2
* @param {*} timeOut start printing out stat after a certain period (in miliseconds)
*/
function startSearch(variableName, variableName2, timeOut) {
	document.getElementById("searchBar1").value = variableName;
	document.getElementById("searchBar1.1").value = variableName2;
	document.getElementById("search1").click();

	setTimeout(function () {
		download(variableName+variableName2+".txt", viewModel.getOutput());
	}, timeOut);
}

function download(filename, text) {
	var element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
	element.setAttribute('download', filename);

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
}

