import {dispatch} from 'd3';

import 'bootstrap/dist/css/bootstrap.min.css';
import './main.css';

import {stationsModel, tripsModel} from './modules/Model';
import {durationGraph} from './modules/Histogram';
import {timelineMain} from './modules/Timeline';
import mainViz from './modules/mainViz';
import stationInput from './modules/stationInput';
import timeRangeSelection from './modules/timeRangeSelection';
import {tripBalanceMain} from './modules/TripBalanceGraph';
import {partialApplyDispatch} from './utils';

//TODO
import TripBalanceGraph from './modules/TripBalanceGraph';

//Global dispatch
const globalDispatch = dispatch(
		'stationsModel:fetch:success',
		'tripsModel:fetch:success',
		'async:start',
		'async:end',
		'async:error',
		'resize',
		'timeRangeSelection:update',
		'stationInput:update'
	);

//Global state
let globalState = {
	stationId:'22',
	t0:new Date(2012,0,1),
	t1:new Date(2014,0,1)
};

timeRangeSelection.call(null,[globalState.t0, globalState.t1]);

window.addEventListener('resize',() => {globalDispatch.call('resize')});

//Module events
stationsModel
	.on('fetch:start', partialApplyDispatch(globalDispatch,'async:start',null))
	.on('fetch:end', partialApplyDispatch(globalDispatch,'async:end',null))
	.on('fetch:error', partialApplyDispatch(globalDispatch,'aync:error',null))
	.on('fetch:success', partialApplyDispatch(globalDispatch,'stationsModel:fetch:success',null));

tripsModel
	.on('fetch:start', partialApplyDispatch(globalDispatch,'async:start',null))
	.on('fetch:end', partialApplyDispatch(globalDispatch,'async:end',null))
	.on('fetch:error', partialApplyDispatch(globalDispatch,'aync:error',null))
	.on('fetch:success', partialApplyDispatch(globalDispatch,'tripsModel:fetch:success',null));

timeRangeSelection
	.on('range:update', partialApplyDispatch(globalDispatch,'timeRangeSelection:update',null));

stationInput
	.on('station:update', partialApplyDispatch(globalDispatch, 'stationInput:update',null));

//"Reducers"
globalDispatch.on('stationsModel:fetch:success', data => {
	stationInput.call(null,data);
});

globalDispatch.on('tripsModel:fetch:success', data => {
	durationGraph.call(null,data);
	timelineMain.call(null,data);
	stationsModel.toJSON()
		.then(stations => {
			mainViz.call(null,data,stations);
		});

	//TEST
	tripBalanceMain.call(null,data.filter(d => d.station0 === '22' || d.station1 === '22'));
});

globalDispatch.on('resize', () => {
	tripsModel.toJSON()
		.then(data => {
			durationGraph.call(null,data);
			timelineMain.call(null,data);
			tripBalanceMain.call(null,data.filter(d => d.station0 === '22' || d.station1 === '22'));
		});
});

globalDispatch.on('timeRangeSelection:update', range => {
	//Update global state
	const [t0,t1] = range;
	globalState = Object.assign({},globalState,{t0,t1});
	timeRangeSelection.call(null, range);

	//cancel previous request and fetch data again
});

globalDispatch.on('stationInput:update', station => {
	console.log(station);
	globalState = Object.assign({},globalState,{station:station.id_short});
	
	//cancel previous request and fetch data again
});

//Initial data fetch
Promise.all([
		stationsModel.fetch(),
		tripsModel.fetch()
	]);