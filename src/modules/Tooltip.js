import {select} from 'd3';
const L = require('leaflet');

console.log(L);

function Tooltip(_){

	let _map; //leaflet instance

	function exports(datum){

		const rootDom = select(_ || this);
		console.log(datum);

		//Build/update DOM
		//info container
		let infoContainer = rootDom
			.selectAll('.info-container')
			.data([datum]);
		infoContainer = infoContainer.enter()
			.append('div')
			.attr('class','info-container')
			.merge(infoContainer);
		//anno
		const anno = infoContainer
			.selectAll('.anno')
			.data([datum]);
		const annoEnter = anno.enter()
			.append('div')
			.attr('class','anno');
		annoEnter.append('span').attr('class','stn-id');
		annoEnter.append('span').attr('class','stn-name');
		anno.merge(annoEnter)
			.select('.stn-id')
			.html(d => d.id_short);
		anno.merge(annoEnter)
			.select('.stn-name')
			.html(d => d.code3);

		//station name
		let stationName = infoContainer
			.selectAll('.name')
			.data([datum]);
		stationName = stationName.enter()
			.append('span')
			.attr('class','name')
			.merge(stationName)
			.html(d => d.name);

		//map container
		let mapContainer = rootDom
			.selectAll('.map-container')
			.data([datum]);
		mapContainer = mapContainer.enter()
			.append('div')
			.attr('class','map-container')
			.style('position','relative')
			.call(selection => {
				//Enter selection is of size 1 --> initial render
				if(selection.size()>0){
					_map = L.map(selection.node(), {center:[datum.lat, datum.lng], zoom:13, zoomControl:false, attributionControl:false});

					L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
					    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
					    maxZoom: 18,
					    id: 'mapbox.streets',
					    accessToken: 'pk.eyJ1Ijoic2lxaXpodTAxIiwiYSI6ImNiY2E2ZTNlNGNkNzY4YWYzY2RkMzExZjhkODgwMDc5In0.3PodCA0orjhprHrW6nsuVw'
					}).addTo(_map);
				}
			})
			.merge(mapContainer)
			.each(d => {
				_map.panTo([d.lat, d.lng], {animate:true, duration:1});
			});

		let stationDot = mapContainer.selectAll('.station-dot')
			.data([datum]);
		stationDot = stationDot.enter()
			.append('div')
			.attr('class','station-dot')
			.merge(stationDot)
			.style('position','absolute')
			.style('left','50%')
			.style('top','50%')
			.style('transform','translate(-50%,-50%)')
			.style('width','8px')
			.style('height','8px')
			.style('border-radius','10px')
			.style('background','rgb(0,50,255)')
			.style('border','2px solid white')
			.style('z-index','998');

	}

	return exports;

}

export default Tooltip;