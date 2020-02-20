
defaultPageInit();

function defaultPageInit() {
	bindHeaderButtonEvents()
	createEventsPage()
}


function bindHeaderButtonEvents() {
	$(document).ready(() => {
		$("#eventsPageButton").click((e) => {
			createEventsPage();
		})

		$("#tablePageButton").click((e) => {
			createTablePage();
		})

		$("#mapPageButton").click((e) => {
			createMapPage();
		})
	})
}


function createEventsPage() {
	$(document).ready(() => {
		$("#canvasContainer").html("")
		$("#canvasContainer").append(
			'<div class="row" id="eventsRow">\
				<canvas id="mainCanvas" width="50px" height="50px"></canvas>\
				<button type="button" class="btn btn-primary" id="eventsDailyButton">Events by day</button>\
				<button type="button" class="btn btn-primary" id="eventsHourlyButton">Events by hour</button>\
			</div>'
		)
		createEventsDailyChart()
		$("#eventsDailyButton").click((e) => {
			createEventsDailyChart()
		})

		$("#eventsHourlyButton").click((e) => {
			createEventsHourlyChart()
		   })
	})
}


function createEventsDailyChart() {
	dates = [];
	events = [];
	$.get("/events/daily", {}, (data) => {
		if (data == "Rate exceeded, try again later") {
			alert(data)
		}
		data.forEach( (e, i) => {
			dates.push(e["date"].slice(0, -13));
			events.push(e["events"]);
		})
	}).then(() => {
		$("#mainCanvas").remove();
		$("#canvasContainer").prepend('<canvas id="mainCanvas" width="50px" height="50px"></canvas>')
		createChart("line", "Events by day", dates, events)
	})
}


function createEventsHourlyChart() {
	dates = [];
	events = [];
	$.get("/events/hourly", {}, (data) => {
		if (data == "Rate exceeded, try again later") {
			alert(data)
			return
		}
		data.forEach( (e, i) => {
			dates.push(e["date"].slice(0, -13) + " Hour: " + e["hour"])
			events.push(e["events"])
		})
	}).then(() => {
		$("#mainCanvas").remove();
		$("#canvasContainer").prepend('<canvas id="mainCanvas" width="50px" height="50px"></canvas>')
		createChart("line", "Events by hour", dates, events)
	})
}

function createChart(typeStr, labelStr, labelsList, dataList) {
	$(document).ready( () => {
		var ctx = document.getElementById('mainCanvas').getContext('2d');
		var myChart = new Chart(ctx, {
			type: typeStr,
			data: {
				labels: labelsList,
				datasets: [{
					label: labelStr,
					data: dataList,
					borderWidth: 1,
				}]
			},
			options: {
				scales: {
					yAxes: [{
						ticks: {
							beginAtZero: true
						}
					}]
				}
			}
		})
	})
}


function createTablePage() {
	$(document).ready(() => {
		$("#canvasContainer").html("")
		$("#canvasContainer").append(
			'<div class="row">\
				<table id="dataTable" class="display" style="width:100%">\
					<thead>\
						<tr>\
							<th>Date</th>\
							<th>Clicks</th>\
							<th>Impressions</th>\
							<th>Revenue</th>\
						</tr>\
					</thead>\
					<tbody>\
					</tbody>\
					<tfoot>\
						<tr>\
							<th>Date</th>\
							<th>Clicks</th>\
							<th>Impressions</th>\
							<th>Revenue</th>\
						</tr>\
					</tfoot>\
					</table>\
			</div>'
		)
		createDataTable()
	})
}


function createDataTable() {
	$.get("/stats/hourly", {}, (data) => {
		if (data == "Rate exceeded, try again later") {
			alert(data)
			return
		}
		data.forEach((e,i) => {
			$("#dataTable").append("<tr><td>"+e["date"].slice(0, -13)+" @ "+e["hour"]+" hour"+"</td><td>"+e["clicks"]+"</td><td>"+e["impressions"]+"</td><td>"+e["revenue"])
		})
	}).then(() => {
		dataTable = $('#dataTable').DataTable()
		}
	)
}


function createMapPage() {
	$(document).ready(() => {
		$("#canvasContainer").html("")
		$("#canvasContainer").append('<div id="mapContainer" style="height: 600px;"></div>')
		createMap()
		createMapButtons()
	})
}


function createMap() {
	$(document).ready(() => {
		window.mymap = L.map('mapContainer').setView([51.505, -0.09], 13);	
		L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiamFjb2Jjcml0Y2giLCJhIjoiY2s2dThmdGdsMDdicDNocG55ZW56ZzdwYiJ9.frUrzAz0nb0AK04KHxtSYQ', {
			attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
			maxZoom: 18,
			id: 'mapbox/streets-v11',
			tileSize: 512,
			zoomOffset: -1,
			accessToken: 'pk.eyJ1IjoiamFjb2Jjcml0Y2giLCJhIjoiY2s2dThmdGdsMDdicDNocG55ZW56ZzdwYiJ9.frUrzAz0nb0AK04KHxtSYQ'
		}).addTo(mymap);
	})
}


function createMapButtons() {
	$(document).ready(() => {
		$.get("/poi", {}, (data) => {
			if (data == "Rate exceeded, try again later") {
				alert(data)
				return
			}
			else {
			data.forEach((e, i) => {
				$("#canvasContainer").append('<button type="button" class="btn btn-primary" id="poi' + i.toString() + 'Button">' + e["name"] + '</button>')
				$("#poi" + i.toString() + "Button").click((ev) => {
					mymap.panTo(new L.LatLng(e["lat"], e["lon"]))
				})
			})
			}   	
		})
	})
}
