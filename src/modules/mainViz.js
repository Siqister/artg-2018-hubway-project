import {select} from 'd3';
import StationList from './StationList';
import StationGraph from './StationGraph';
import {loadingStatusMd} from './LoadingStatus';

function MainViz(dom){

	let _vizModule;
	let _currentView = 'list';
	let _tripsData;
	let _stationsData;
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

	//Add loading indicator on module initialization
	select(dom)
		.append('div')
		.attr('class','loading-status')
		.each(loadingStatusMd);

	function exports(trips, stations){

		//On successful data injection, remove loading status
		select(dom)
			.select('.loading-status')
			.remove();

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

	return exports;

}

const mainViz = MainViz(document.querySelector('.main'));
export default mainViz;