import {nest, select, min, max, map} from 'd3';
import StationNode from './StationNode';
import StationIndex from './StationIndex';

function StationList(dom){

	let _w, _h;
	let _nodeW = 150, _nodeH = 120;
	let tripsData;
	let stationsData;
	//state related to how many station nodes to show
	let _totalStations = 0;
	let _numStationsPerPage = 0;
	let _currentPage = 0;
	const _groupByStopStation = nest().key(d => d.station1);
	//Reusable modules
	const stationNode = StationNode();
	const stationIndex = StationIndex();

	function exports(data, stations){

		//Recompute internal variables
		_w = dom.clientWidth;
		_h = dom.clientHeight;

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

		//Update reusable modules
		stationNode
			.domain([min(data, d => d.t0), max(data, d => d.t1)]);

		_totalStations = tripsData.length;
		_numStationsPerPage = Math.floor(_w/_nodeW)*Math.floor((_h-30)/_nodeH);

		stationIndex
			.total(_totalStations)
			.stationsPerPage(_numStationsPerPage)
			.text('Top destinations:')
			.onClick(i => {
				_currentPage = i;
				redraw();
			});

		redraw();
	}

	function redraw(){

		stationIndex
			.currentPage(_currentPage);

		//Build/update DOM
		const indexNode = select(dom)
			.select('#station-index')
			.each(stationIndex);
		const nodes = select(dom)
			.selectAll('.station-node')
			.data(tripsData.slice(_currentPage*_numStationsPerPage, (_currentPage+1)*_numStationsPerPage));
		nodes.enter()
			.append('div')
			.attr('class','station-node module')
			.merge(nodes)
			.style('width', `${_nodeW}px`)
			.style('height', `${_nodeH}px`)
			.style('float', 'left')
			.each(stationNode);
		nodes.exit().remove();

	}

	return exports;

}

export default StationList(document.getElementById('station-list'));

