import {nest, select, min, max, map} from 'd3';
import StationNode from './StationNode';
import StationIndex from './StationIndex';
import {loadingStatusMd} from '../LoadingStatus';

function StationList(dom){

	let _w, _h;
	let _nodeW = 150, _nodeH = 120;
	let _onUnmount = () => {};
	let tripsData;
	let stationsData;
	//state related to pagination
	let _totalStations = 0;
	let _numStationsPerPage = 0;
	let _currentPage = 0;
	const _groupByStopStation = nest().key(d => d.station1);
	//state related to visualization type
	let _stationNodeStates = ['Trip Volume','24 Hours','Departure vs. Arrival'];
	let _currentStationNodeState = 0;
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
				const v = stationsMap.get(d.key);
				if(v){
					d.stationName = v.name;
					d.code3 = v.code3;
				}
				return d;
			});

		//Update reusable modules
		stationNode
			.domain([min(data, d => d.t0), max(data, d => d.t1)]);

		_totalStations = tripsData.length;
		_numStationsPerPage = Math.floor(_w/_nodeW)*Math.floor((_h-90)/_nodeH);

		stationIndex
			.total(_totalStations)
			.stationsPerPage(_numStationsPerPage)
			.onPagination(i => {
				_currentPage = i;
				redraw();
			})
			.onStationNodeStateChange(i => {
				_currentStationNodeState = i;
				redraw();
			});

		redraw();
	}

	function redraw(){

		stationIndex
			.currentPage(_currentPage)
			.text(`Top ${_currentPage*_numStationsPerPage+1}-${Math.min(_totalStations, (_currentPage+1)*_numStationsPerPage)} destinations:`);

		stationNode
			.mode(_stationNodeStates[_currentStationNodeState]);

		//Build/update DOM
		let root = select(dom)
			.selectAll('.station-list')
			.data([1]);
		root = root.enter()
			.append('div')
			.call(selection => {
				if(selection.size()>0) select(dom).selectAll('.module').remove();
			})
			.merge(root)
			.attr('class','station-list module');

		let stationIndexNode = root
			.selectAll('.station-index')
			.data([{_stationNodeStates, _currentStationNodeState}]);
		stationIndexNode = stationIndexNode.enter()
			.append('div')
			.attr('class','station-index')
			//.style('transform','translate(0px,-100%)')
			.merge(stationIndexNode)
			.each(stationIndex)
			// .transition()
			// .duration(1000)
			// .style('transform','translate(0px,0%)');

		let stationNodes = root
			.selectAll('.station-node')
			.data(tripsData.slice(_currentPage*_numStationsPerPage, (_currentPage+1)*_numStationsPerPage));
		stationNodes.exit().remove();
		stationNodes = stationNodes.enter()
			.append('div')
			.attr('class','station-node module')
			.merge(stationNodes)
			.style('width', `${_nodeW}px`)
			.style('height', `${_nodeH}px`)
			.style('float', 'left')
			.each(stationNode);

		let unmountButton = root
			.selectAll('.unmount')
			.data([1]);
		unmountButton = unmountButton.enter()
			.append('a')
			.attr('href','#')
			.attr('class','unmount hubway-button')
			.merge(unmountButton)
			.html('Graph view')
			.on('click', () => {
				//Preparation before unmount
				stationIndexNode
					.transition()
					.duration(200)
					.style('transform','translate(0,-300%)')
					.style('opacity',0)
					.on('end', _onUnmount);
				stationNodes
					.transition()
					.duration(200)
					.style('opacity',0);
			});

	}

	exports.onUnmount = function(fn){
		if(typeof(fn) === 'undefined') return _onUnmount;
		_onUnmount = fn;
		return this;
	}

	return exports;

}

export default StationList;


