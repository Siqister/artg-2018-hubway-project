import {select, mouse} from 'd3';
import StationList from './StationList';
import StationGraph from './StationGraph';
import {loadingStatusMd} from './LoadingStatus';
import Tooltip from './Tooltip';

function MainViz(dom){

	let _vizModule;
	let _currentView = 'list';
	let _tripsData;
	let _stationsData;

	//Add initial DOM scaffolding
	//Add loading indicator on module initialization
	select(dom)
		.append('div')
		.attr('class','loading-status')
		.each(loadingStatusMd);
	//Tooltip
	const _tooltipNode = select(dom)
		.append('div')
		.attr('class','hubway-tooltip')
		.style('position','absolute')
		.style('display','none')
		.style('opacity',0);
	//Position the tooltip
	select(dom)
		.on('mousemove', function(){
			const [x,y] = mouse(this);
			_tooltipNode
				.style('bottom',`${dom.clientHeight-y+50}px`)
				.style('left',`${x}px`)
				.style('transform','translate(-50%)');
		});

	//module declaration
	const tooltip = Tooltip(_tooltipNode.node());
	const stationList = StationList(dom)
		.onUnmount(() => { 
			_currentView = 'graph'; 
			redraw();
		});
	const stationGraph = StationGraph(dom)
		.onUnmount(() => {
			_currentView = 'list';
			redraw();
		});


	function exports(trips, stations){

		//On successful data injection, remove loading status
		select(dom)
			.select('.loading-status')
			.remove();

		//module events
		stationGraph
			.onTooltipEnter(_showTooltip)
			.onTooltipLeave(_hideTooltip);

		//Set internal data state, then re-render
		_tripsData = trips;
		_stationsData = stations;
		redraw();

	}

	function redraw(){

		switch(_currentView){
			case 'list':
				stationList.call(null,_tripsData,_stationsData);
				break;
			case 'graph':
				stationGraph.call(null,_tripsData,_stationsData);
				break;
			default:
				stationList.call(null,_tripsData,_stationsData);
		}

	}

	function _showTooltip(datum){
		tooltip.call(null,datum);
		_tooltipNode
			.style('display','block')
			.transition()
			.style('opacity',1);
	}

	function _hideTooltip(){
		_tooltipNode
			.transition()
			.style('opacity',0)
			.on('end', function(){
				select(this).style('display','none');
			});
	}

	return exports;

}

const mainViz = MainViz(document.querySelector('.main'));
export default mainViz;