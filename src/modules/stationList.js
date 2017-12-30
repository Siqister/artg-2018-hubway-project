import {nest, select, min, max, map} from 'd3';
import StationNode from './StationNode';

function StationList(dom){

	let _w, _h;
	let _nodeW = 150, _nodeH = 120;
	let tripsData;
	let stationsData;
	const _groupByStopStation = nest().key(d => d.station1);

	const stationNode = StationNode();

	function exports(data, stations){

		//Recompute internal variables
		_w = dom.clientWidth;
		_h = dom.clientHeight;

		stationNode
			.domain([min(data, d => d.t0), max(data, d => d.t1)]);

		//Transform data
		//Nest by stop station, and add full station name
		const stationsMap = map(stations, d => d.id_short);
		tripsData = _groupByStopStation.entries(data)
			.sort((a,b) => (b.values.length - a.values.length))
			.map(d => {
				if(stationsMap.get(d.key)){
					d.stationName = stationsMap.get(d.key).name;
				}
				return d;
			});

		//Build DOM
		const nodes = select(dom)
			.selectAll('.station-node')
			.data(tripsData, d => d.key);
		nodes.enter()
			.append('div')
			.attr('class','station-node module')
			.merge(nodes)
			.style('width', `${_nodeW}px`)
			.style('height', `${_nodeH}px`)
			.style('float', 'left')
			.each(stationNode);

	}

	return exports;

}

export default StationList(document.getElementById('station-list'));


