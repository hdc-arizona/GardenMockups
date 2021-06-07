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
        viewModel.createSearchBar(document.getElementById("searchBar1.1"));
        viewModel.createSearchBar(document.getElementById("searchBar2"));
        viewModel.createSearchBar(document.getElementById("searchBar2.1"));
        table1 = viewModel.createTable("table1", "tables");
        table2 = viewModel.createTable("table2", "tables");

        // View UI Listeners

        document.getElementById("search1").addEventListener('click', (event) => {
          var var1 = document.getElementById("searchBar1").value;
          var var2 = document.getElementById("searchBar1.1").value;
            if (var1 != "" && var2 != "") {
                viewModel.populateMap("map1", map1, infoBox1, var1, var2).then((status) =>
                    viewModel.populateLegend("map1", document.getElementById("legend1"))).then((status) =>
                        viewModel.populateTable("map1", table1));
            }
        });

        document.getElementById("search2").addEventListener('click', (event) => {
          var var3 = document.getElementById("searchBar2").value;
          var var4 = document.getElementById("searchBar2.1").value;
            if (var3 != "" && var4 != "") {
                viewModel.populateMap("map2", map2, infoBox2, var3, var4).then((status) =>
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
});
