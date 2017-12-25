import {stationsModel, tripsModel} from './modules/Model';

stationsModel
	.on('fetch:start', () => {console.log('stationsModel:fetch:start')})
	.on('fetch:end', () => {console.log('stationsModel:fetch:end')})
	.on('fetch:error', () => {console.log('stationsModel:fetch:error')});

tripsModel
	.on('fetch:start', () => {console.log('tripsModel:fetch:start')})
	.on('fetch:end', () => {console.log('tripsModel:fetch:end')})
	.on('fetch:error', () => {console.log('tripsModel:fetch:error')});

Promise.all([
		stationsModel.fetch(),
		tripsModel.fetch()
	]).then(([stations, trips]) => {
		console.log(trips, stations)
	});
