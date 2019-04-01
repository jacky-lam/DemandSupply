/*
 * Author:	Yun Fat Lam
 * Purpose:	Managing the Google Chart API with the demand_supply data-model
 * Comment: it reads the data-model but puts it into a flat data-model: quicker to access
 * 
 * */

var flat_data_model		= null;	//2D demand supply cell values (used for chart mainly)
var chart_data_table	= null; //google data-model chart
var chart				= null; //google chart object
var demand_color		= 'color : #efefef';
var supply_color		= 'color : #adadad';

//setup the google chart and columns
function setupChart()
{
	chart_data_table	= new google.visualization.DataTable();
	chart				= new google.visualization.ComboChart(document.getElementById('chart_container'));
	flat_data_model		= {};
	
	//setup the chart columns
	chart_data_table.addColumn('string', 'Date');
	chart_data_table.addColumn('number', 'Met/Fulfilled');
	chart_data_table.addColumn({role: 'style', type: 'string'});
	chart_data_table.addColumn('number', 'Unmet/Remaining');
	chart_data_table.addColumn({role: 'style', type: 'string'});
	
	//take the colours from the key-chart symbol
	var demand_key_symbol = document.getElementById("key_chart_symbol_demand");
	if(demand_key_symbol != null ) demand_color = "color : "+window.getComputedStyle(demand_key_symbol, null).getPropertyValue("background-color");
	
	var supply_key_symbol = document.getElementById("key_chart_symbol_supply");
	if(supply_key_symbol != null) supply_color = "color : "+window.getComputedStyle(supply_key_symbol, null).getPropertyValue("background-color");
}

/* empty data set and re-draw the chart */
function refreshChartData()
{
	chart_data_table.removeRows(0, chart_data_table.getNumberOfRows());
	
	for(var i=0; i < date_column_ids.length; i++) //populate data-model for each date
	{
		//get the total demands and total supplies, for the week
		var a_date_id		= date_column_ids[i]+"_";
		
		var total_dem_sup	= getTotalDemandSupply(a_date_id);
		var total_demands	= total_dem_sup["DEMAND"];
		var total_supplies	= total_dem_sup["SUPPLY"];
		
		//Now setup the labelling, depending on what was remaining
		var label			= date_column_ids[i].replace(new RegExp("-", 'g'), " ");
		var demand_smaller	= (total_supplies > total_demands);
		
		//calculate the values and colouring
		var fulfilled_color	= (demand_smaller)? demand_color : supply_color;
		var remain_color	= (demand_smaller)? supply_color : demand_color;
		var fulfilled_value	= (demand_smaller)? total_demands: total_supplies;
		var remain_value	= (demand_smaller)? (total_supplies - total_demands) :(total_demands - total_supplies);
		
		chart_data_table.addRow([label, fulfilled_value, fulfilled_color, remain_value, remain_color]);
		
	}//END: populate data-model for each date
	
	drawChart();
}

//draw the chart (for all dates/specific date)
function renderChart(updated_date_id)
{
	var date_index = date_column_ids.indexOf(updated_date_id.substring(0,updated_date_id.length-1));
	
	//get the total demands and total supplies, for the week
	var a_date_id		= updated_date_id;
	
	var total_dem_sup	= getTotalDemandSupply(a_date_id);
	var total_demands	= total_dem_sup["DEMAND"];
	var total_supplies	= total_dem_sup["SUPPLY"];
	
	//Now setup the labelling, depending on what was remaining
	var demand_smaller	= (total_supplies > total_demands);
	
	//calculate the values and colouring
	var fulfilled_color	= (demand_smaller)? demand_color : supply_color;
	var remain_color	= (demand_smaller)? supply_color : demand_color;
	var fulfilled_value	= (demand_smaller)? total_demands: total_supplies;
	var remain_value	= (demand_smaller)? (total_supplies - total_demands) :(total_demands - total_supplies);
	
	chart_data_table.setValue(date_index, 1, fulfilled_value);
	chart_data_table.setValue(date_index, 2, fulfilled_color);
	chart_data_table.setValue(date_index, 3, remain_value);
	chart_data_table.setValue(date_index, 4, remain_color);
	
	drawChart();
}

function drawChart()
{
	//chart settings
	var	chart_options = 
	{
		animation: {
			"startup": true,
			duration: 1000,
	        easing: 'out',
	        },
		seriesType: "bars",
		isStacked: true,
		bar: {groupWidth: '45'},
		chartArea: {left: '0', bottom: '0', right: '0', height: '100%', width: '100%'},
		width: (chart_data_table.getNumberOfRows()*50),
		height: 200,
		legend: {position: 'none'},
		hAxis: {textPosition: 'none'},
		backgroundColor: '#ffefff',
		enableInteractivity: true,
		vAxis: {
				textPosition: 'in',
				textStyle: 
				{
					opacity: 0
				}
			}
	};
	
	chart.draw(chart_data_table, chart_options);
}

