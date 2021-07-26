var map1 = null;
var map2 = null;
var table1 = null;
var table2 = null;
var infoBox1 = null;
var infoBox2 = null;
var viewModel = null;


document.addEventListener("DOMContentLoaded", function() {
        viewModel = new ViewModel();
        map1 = viewModel.createMap("map1");
        map2 = viewModel.createMap("map2");
        infoBox1 = viewModel.createInfoBox(map1);
        infoBox2 = viewModel.createInfoBox(map2);
        viewModel.createSearchBar(document.getElementById("searchBar1"));
        viewModel.createSearchBar(document.getElementById("searchBar2"));
        table1 = viewModel.createTable("table1", "tables");
        table2 = viewModel.createTable("table2", "tables");
		
        // View UI Listeners
		document.getElementById("searchBar1").addEventListener('keyup', function (event) {
			if (event.keyCode === 13) {
				event.preventDefault();
				document.getElementById("search1").click();
			}
		});
		document.getElementById("search1").addEventListener('click', (event) => {
			var var1 = document.getElementById("searchBar1").value;
			if (var1 != "") {
				viewModel.changeToLoad(document.getElementById("search1"));
				viewModel.populateMap("map1", map1, infoBox1, var1).then((status) =>
					viewModel.changeBack(document.getElementById("search1"))|
					viewModel.populateLegend("map1", document.getElementById("legend1"))).then((status) =>
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
			var var2 = document.getElementById("searchBar2").value;
		   if (var2 != "") {
			   viewModel.changeToLoad(document.getElementById("search2"));
			   viewModel.populateMap("map2", map2, infoBox2, var2).then((status) =>
				   viewModel.changeBack(document.getElementById("search2")) |
				   viewModel.populateLegend("map2", document.getElementById("legend2"))).then((status) =>
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
			viewModel.syncMaps(map2,map1);
		});
		
		map2.addEventListener('moveend', () => {
			viewModel.syncMaps(map1,map2);
		});
		
		window.addEventListener('resize', () => {
			viewModel.resize();
		});
		
		// I need to access the tables, but I'm not sure if I can directly edit any of that code, so this is going here temporarily
		{
			// Make table wrappers sizeable
			let tableWrappers = document.getElementsByClassName("dataTables_wrapper");
			for(var i=0;i<tableWrappers.length;i++){
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

	// initial background DB query
	viewModel.fetchVariable("map1", " (cadmium)");
});
