/*
 * Author:	Yun Fat Lam
 * Purpose:	Functions that involves manipulating the DOM
 * Comment: 
 * 
 * */

//empty project list in drop-down on login
function clearProjectList()
{
	var project_dd = document.getElementById("project_list");
	while(project_dd.options.length > 0) project_dd.remove(0);
}

//add item to project list drop-down
function addProjectItem(project_id, project_name)
{
	var project_dd		= document.getElementById("project_list");
	var option 			= document.createElement("option");
	option.value 		= project_id
	option.text 		= project_name;
	project_dd.add(option);
}

//load selected project button
function loadProject()
{
	var project_dd = document.getElementById("project_list");
	if(project_dd.options.length > 0) loadProjectChart(project_dd.options[project_dd.options.selectedIndex].value);
}

//shift the page content
function changePage(page_name)
{
	var page_container				= document.getElementById("page_container");
	var header_selection_wrapper	= document.getElementById("header_selection_wrapper");
	var header_project_wrapper		= document.getElementById("header_project_wrapper");
	
	var show_css	= " show";
	var hide_css	= " hide";
	
	if(page_name=="demand_supply")
	{
		//show project chart page
		page_container.className = page_container.className.replace(hide_css, "");
		if(page_container.className.indexOf(show_css) == -1) page_container.className += show_css;
		
		//show project header
		header_project_wrapper.className = header_project_wrapper.className.replace(hide_css, "");
		if(header_project_wrapper.className.indexOf(show_css) == -1) header_project_wrapper.className += show_css;
		
		//hide selection header
		header_selection_wrapper.className = header_selection_wrapper.className.replace(show_css, "");
		if(header_selection_wrapper.className.indexOf(hide_css) == -1) header_selection_wrapper.className += hide_css;
		
	}
	else
	{
		//hide project chart page
		page_container.className = page_container.className.replace(show_css, "");
		if(page_container.className.indexOf(hide_css) == -1) page_container.className += hide_css;
		
		//hide project header
		header_project_wrapper.className = header_project_wrapper.className.replace(show_css, "");
		if(header_project_wrapper.className.indexOf(hide_css) == -1) header_project_wrapper.className += hide_css;
		
		//show selection header
		header_selection_wrapper.className = header_selection_wrapper.className.replace(hide_css, "");
		if(header_selection_wrapper.className.indexOf(show_css) == -1) header_selection_wrapper.className += show_css;
		
	}
}

//set project title
function setProjectTitle(title)
{
	document.getElementById("project_title").innerHTML = title;
}

//set project start date
function setProjectStartDate(a_date)
{
	document.getElementById("project_start_date").innerHTML = a_date;
}
//set project end date
function setProjectEndDate(a_date)
{
	document.getElementById("project_end_date").innerHTML = a_date;
}