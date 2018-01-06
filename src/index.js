import {dispatch} from 'd3';

import 'bootstrap/dist/css/bootstrap.min.css';
import './main.css';

import {stationsModel, tripsModel} from './modules/Model';
import {durationGraph} from './modules/Histogram';
import {timelineMain} from './modules/Timeline';
import stationList from './modules/stationList';
import stationInput from './modules/stationInput';
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
		'async:error'
	);


//Model modules
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

//"Reducers"
globalDispatch.on('stationsModel:fetch:success', data => {
	stationInput.call(null,data);
});
globalDispatch.on('tripsModel:fetch:success', data => {
	durationGraph.call(null,data);
	timelineMain.call(null,data);
	stationsModel.fetch()
		.then(stations => {
			stationList.call(null,data,stations);
		});

	//TEST
	tripBalanceMain.call(null,data.filter(d => d.station0 === '22' || d.station1 === '22'));
});

//Initial data fetch
Promise.all([
		stationsModel.fetch(),
		tripsModel.fetch()
	]);