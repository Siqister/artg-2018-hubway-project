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
		'timeRangeSelection:update'
	);

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

//"Reducers"
globalDispatch.on('stationsModel:fetch:success', data => {
	stationInput.call(null,data);
	timeRangeSelection.call(null);
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
	console.log(range);
});

//Initial data fetch
Promise.all([
		stationsModel.fetch(),
		tripsModel.fetch()
	]);