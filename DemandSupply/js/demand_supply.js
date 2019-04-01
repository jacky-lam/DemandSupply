/*
 * Author:	Yun Fat Lam
 * Purpose:	Logics, functions, variables that are dedicated to the web-app
 * Comment: 
 * 
 * */
var the_table			= null;		//dynamic data model
var date_column_ids		= [];		//list of date IDS in the table
var demands_supplies	= null;		//data-model of demand & supplies

//load page function
function initialise()
{
	loadProjectList();
}

//get list of projects
function loadProjectList()
{
	CreateAjaxCall(
		server_webapp_url+"/jsp/Get_Project.jsp", 
		{"REQUEST_DATA":"PROJECT_LIST"},
		function()
		{
			if(this.readyState==4)
			{
				var fail_load = null;
				
				if(this.status==200) //retrieved data back
				{
					var json_data = JSON.parse(this.responseText);
					
					if(json_data["STATUS"] == "ERROR")	fail_load = "Failed to load project list="+ json_data["RESPONSE"];
					else								setProjectList(json_data["RESPONSE"]);
				}
				else
				{
					fail_load = "status from ajax="+this.status;
				}
				
				if(fail_load != null)
				{
					alert("Failed to load project list:"+fail_load)
				}
				
			}
		}		
	, "POST");
}

//setup the project drop-down from JSON
function setProjectList(projects)
{
	clearProjectList();
	
	//setup project drop-down
	for(var prj_id in projects)
	{
		var project = projects[prj_id];
		addProjectItem(project["ID"], project["Project_Name"]);
	}
	
	//display load button
	if(document.getElementById("load_button")!= null) document.getElementById("load_button").className += " load_button_active";
}

//getting data for the chart
function loadProjectChart(project_id)
{
	CreateAjaxCall(
		server_webapp_url+"/jsp/Get_Project.jsp", 
		{
			"REQUEST_DATA":"PROJECT_CHART",
			"PROJECT_ID": project_id
		},
		function()
		{
			if(this.readyState==4)
			{
				var fail_load = null;
				
				if(this.status==200) //retrieved data back
				{
					var json_data = JSON.parse(this.responseText);
					
					if(json_data["STATUS"] == "ERROR")	fail_load = "Failed to load project chart="+ json_data["RESPONSE"];
					else								setProjectChart(json_data["RESPONSE"]);
				}
				else
				{
					fail_load = "status from ajax="+this.status;
				}
				
				if(fail_load != null)
				{
					alert("Failed to load project chart:"+fail_load)
				}
			}
		}		
	, "POST");
}

//setup the project chart from JSON
function setProjectChart(project_metadata)
{
	//setup project meta-data
	setProjectTitle(project_metadata["Project_Name"]);
	setProjectStartDate(project_metadata["Start_Date"]);
	setProjectEndDate(project_metadata["End_Date"]);
	
	//project has all the necessary meta-data to build chart
	if(project_metadata["Start_Date"] != undefined && project_metadata["End_Date"] != undefined && project_metadata["Start_Weekday"] != undefined)
	{
		//setup table
		setupTable(project_metadata["Start_Date"], project_metadata["End_Date"], project_metadata["Start_Weekday"]);
		
		//setup charts
		setupChart();
		
		//populate demand supply records
		demands_supplies = project_metadata["Demands"];
		if(demands_supplies != undefined && demands_supplies != null) populateDemandSupply(demands_supplies);
		
		//draw chart
		refreshChartData();
		
		//change page UI
		changePage("demand_supply");
	}
	else
	{
		alert("Project has missing meta-data. Please validate all project meta-data.");
	}
}

//setup the table, given start and end date
function setupTable(start_date, end_date, week_start_day)
{
	//set up table data-model
	the_table = new DynamicTable("PROJECT_", "demand_supply_table");
	
	//setup date range
	date_column_ids = getReportDateColumnIDs(start_date, end_date, week_start_day);
	
	//setup table columns
	setupTableColumns();
}

//given a start and end date, find all the dates in-between
function getReportDateColumnIDs(a_start_date, a_end_date, week_start_day)
{
	var result = [];
	
	//1. convert string to date objects
	var start_date_oo 	= convertStringToDate(a_start_date, "-");
	var end_date_oo 	= convertStringToDate(a_end_date, "-");
	
	//2. Get the correct starting date, based upon the: current "start date", "period type" and/or "start day"
	var tmp_date_oo = start_date_oo;
	
	//find which index point of the "start day" (e.g. sunday = 0, monday = 2 ...)
	var day_array = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"]; //standard JS sequence
	var day_index = day_array.indexOf(week_start_day.toLowerCase());
	
	//keep traversing back, until we hit correct start date
	while(tmp_date_oo.getDay() != day_index) //not correct start-day
	{
		tmp_date_oo = new Date(new Date(tmp_date_oo).setDate(tmp_date_oo.getDate()-1)); //minus a day
	}
	
	//3. now depending on the report type; set up the date columns
	while(tmp_date_oo.getTime() <= end_date_oo.getTime())
	{
		result.push(convertDateToString(tmp_date_oo, "-"));
		tmp_date_oo = new Date(new Date(tmp_date_oo).setDate(tmp_date_oo.getDate()+7)); //increment by 1 week
	}
	
	return result;
}

//setup the table data-model
function setupTableColumns()
{
	//setup label column
	the_table.addColumn(null, "LABEL_", "Demand/Supply", "table_header label_header","table_cell", "table_cell", "textfield", "Label", "label_input demand", "label_input supply");
	
	//setup date column
	for(var i=0; i < date_column_ids.length; i++)
	{
		var a_date_id	= date_column_ids[i];
		var date_label	= a_date_id.replace(new RegExp("-", 'g'), " ");
		the_table.addColumn(null, a_date_id+"_", date_label, "table_header date_header", "table_cell date_cell", "table_cell date_cell", "numberfield", "0", "number_input demand", "number_input supply");
	}
}


//setup the demand and supply for project
function populateDemandSupply(demands)
{
	for(var demand_id in demands)//for each demand
	{
		var a_demand		= demands[demand_id];
		
		//setup values
		var values			= {};
		values["LABEL_"]	= a_demand["LABEL_"];
		for(var i=0; i < date_column_ids.length; i++)
		{
			var cell_id		= date_column_ids[i]+"_";
			var cell_value	= a_demand["Cells"][date_column_ids[i]+"_"];
			values[cell_id] = (cell_value==undefined||cell_id==null? "" : cell_value);
		}
		
		//insert demand
		insertRecord(demand_id, -1, null, values);
		
		//populate supplies for each demand
		var supplies = a_demand["Supplies"];
		if(supplies != undefined && supplies != null)
		{
			for(var supply_id in supplies) //for each supply
			{
				var a_supply		= supplies[supply_id];
				
				//setup values
				var values			= {};
				values["LABEL_"]	= a_supply["LABEL_"];
				for(var i=0; i < date_column_ids.length; i++)
				{
					var cell_id		= date_column_ids[i]+"_";
					var cell_value	= a_supply["Cells"][date_column_ids[i]+"_"];
					values[cell_id] = (cell_value==undefined||cell_id==null? "" : cell_value);
				}
				
				//insert demand
				insertRecord(supply_id, -1, demand_id, values);
			}
		}
	}
}

//add a row into the table
function insertRecord(row_id, row_pos, parent_row_id, values)
{
	// set up values, if not given
	if(row_id == undefined || row_id == null)					row_id			= null;
	if(row_pos == undefined || row_pos == null)					row_pos			= null;
	if(parent_row_id == undefined || parent_row_id == null)		parent_row_id	= null;
	if(values == undefined || values == null)					values			= {};
	
	// set up the row + cell parameters
	var row_object = the_table.addRow(row_id, row_pos, parent_row_id, values);
	
	//apply some specific changes to the row object
	modifyRowObject(row_object);
}

//modify the row object for specific purposes
function modifyRowObject(row_object)
{
	//update data-model for internal reference
	if(row_object.id.indexOf("NEW") >= 0) appendDataModel(row_object, row_object.parent_row_id);
	
	//append listeners to cell-date,
	for(var i=0; i < date_column_ids.length; i++)
	{
		setupCellDateListeners(row_object.id, row_object.getCell(date_column_ids[i]+"_"));
	}
	
	//make changes depending on demand/supply row
	if(row_object.parent_row_id != null) //supply row
	{
		row_object.getCell("delete_").html_cell.className += " supply"; //css delete button
	}
	else //demand row
	{
		//setup 'add supply' button
		var add_button = document.createElement("div");
		add_button.className = "add_supply_button";
		add_button.addEventListener("click", function(){insertRecord(null, row_object.html_row.rowIndex, row_object.id, null);}, false);
		row_object.getCell("LABEL_").html_cell.parentNode.appendChild(add_button);
	}
}

//setting up the listener on every date-cell
function setupCellDateListeners(row_id, cell_object)
{
	//create a temporary value container
	if(flat_data_model[row_id]==undefined) flat_data_model[row_id] = {};
	
	if(cell_object.html_cell != null) //html cell was created
	{
		//populate flat data-model for chart
		flat_data_model[row_id][cell_object.column_name] = cell_object.html_cell.value;
		
		//setup listener
		cell_object.html_cell.addEventListener("change", function(){
				//update data-model & redraw chart
				flat_data_model[row_id][cell_object.column_name] = cell_object.html_cell.value;
				renderChart(cell_object.column_name);
			}, false);
	}
}

//create a new data-model
function appendDataModel(row_object, parent_row_id)
{
	var new_model = {};
	new_model["LABEL_"]		= row_object.getCell("LABEL_").html_cell.value;
	new_model["Cells"]		= {};
	for(var i=0; i < date_column_ids.length; i++) //populate the cell values
	{
		new_model["Cells"][date_column_ids[i]+"_"] = row_object.getCell(date_column_ids[i]+"_").html_cell.value;
	}
	
	//demand line
	if(parent_row_id == undefined || parent_row_id == null) new_model["Supplies"]	= {};
	
	//insert back into data-model
	if(parent_row_id == undefined || parent_row_id == null)	demands_supplies[row_object.id] = new_model;
	else													demands_supplies[parent_row_id]["Supplies"][row_object.id] = new_model;
}

//function called from dynamic table when row is deleted
function deletedRow(table_id, row_id)
{
	//remove from data-model
	for(var demand_id in demands_supplies)
	{
		//found demand: delete
		if(demand_id == row_id){ delete demands_supplies[demand_id]; break;}
		
		//check if its within supply
		for(var supply_id in demands_supplies[demand_id]["Supplies"]){ if(row_id==supply_id){ delete demands_supplies[demand_id]["Supplies"][supply_id]; break;} }
	}
	
	//update the google data-model
	delete flat_data_model[row_id];
	refreshChartData();
}

//get the total demand and supply value, for a given date
function getTotalDemandSupply(date_id)
{
	var total_demands	= 0;
	var total_supplies	= 0;
	
	for(var demand_id in demands_supplies)//for each demand
	{
		var tmp_demand = 0; //demand for this week
		var tmp_supply = 0; //allocation under this demand for the week
		
		//get demand value from flat data model
		var a_demand_value = flat_data_model[demand_id][date_id];
		if(a_demand_value != undefined && a_demand_value != null)
			try{ tmp_demand += Number(a_demand_value);} catch(err){}
		
		//go get all the supply values for the week
		var a_demand = demands_supplies[demand_id];
		var supplies = a_demand["Supplies"];
		if(supplies != undefined && supplies != null)
		{
			for(var supply_id in supplies) //for each supply under this demand
			{
				var a_supply_value	= flat_data_model[supply_id][date_id];
				
				if(a_supply_value != undefined && a_supply_value != null)
					try{ tmp_supply += Number(a_supply_value);} catch(err){}
			}
		}
		
		if(tmp_supply > tmp_demand) tmp_supply = tmp_demand; //cannot over supply
		
		//append total demand and allocation for this week
		total_demands += tmp_demand;
		total_supplies+= tmp_supply;
	}
	
	return {"DEMAND": total_demands, "SUPPLY": total_supplies};
}