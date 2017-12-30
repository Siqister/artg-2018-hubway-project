import {dispatch} from 'd3';

import 'bootstrap/dist/css/bootstrap.min.css';
import './main.css';

import {stationsModel, tripsModel} from './modules/Model';
import durationGraph from './modules/durationGraph';
import timelineMain from './modules/timelineMain';
import stationList from './modules/stationList';
import {partialApplyDispatch} from './utils';

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


//View modules




//"Reducers"
globalDispatch.on('stationsModel:fetch:success', data => {
	//no-op
});
globalDispatch.on('tripsModel:fetch:success', data => {
	durationGraph.call(null,data);
	timelineMain.call(null,data);
	stationsModel.fetch()
		.then(stations => {
			stationList.call(null,data,stations);
		});
});

//Initial data fetch
Promise.all([
		stationsModel.fetch(),
		tripsModel.fetch()
	]);