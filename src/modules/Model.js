import {dispatch, csv} from 'd3';

function Model(){

	let _url;
	let _parse = d => d;
	const _dispatch = dispatch(
		'fetch:start',
		'fetch:success',
		'fetch:error',
		'fetch:end'
	);
	let _dataStore;
	let _cancelFetch;

	function exports(){}

	exports.url = function(_){
		if(_ === undefined) return _url;
		_url = _;
		return this;
	}

	exports.parse = function(fn){
		if(fn === undefined) return _parse;
		_parse = fn;
		return this;
	}

	exports.fetch = function(query = {}){
		if(/.csv$/.test(_url)){
			return _fetchCsv.call(exports);
		}else{
			return _fetchCsv.call(exports);
		}
	}

	function _fetchCsv(){
		_dispatch.call('fetch:start');

		_dataStore = new Promise((resolve,reject) => {
			csv(_url, _parse, (err,data) => {
				if(err){ reject(err); }
				else{ resolve(data); }

				_cancelFetch = () => {
					reject(Error('Request is cancelled'));
				}
			});
		}).then(
			res => {
				_dispatch.call('fetch:success',null,res);
				_dispatch.call('fetch:end');
				return res;
			}, err => {
				_dispatch.call('fetch:error',null,Error(err));
				_dispatch.call('fetch:end');
		});

		return _dataStore
	}

	function _fetchUrl(){
		_dispatch.call('fetch:start');

		//Contruct a Promise-based cancellation trigger
		const trigger = new Promise((resolve, reject) => {
			_cancelFetch = () => {reject(Error('Request is cancelled'));}
		});

		_dataStore = Promise.race([fetch(_url), trigger])
			.then(res => res.json())
			.then(res => res.map(_parse))
			.then(res => {
				_dispatch.call('fetch:success',null,res);
				_dispatch.call('fetch:end');
				return res;
			})
			.catch(err => {
				_dispatch.call('fetch:error',null,Error(err));
				_dispatch.call('fetch:end');
			});

		return _dataStore;
	}

	exports.cancelFetch = function(){
		if(_cancelFetch) _cancelFetch();
		return this;
	}

	exports.on = function(...args){
		_dispatch.on.apply(_dispatch,args);
		return this;
	}

	exports.toJSON = function(){
		return _dataStore;
	}

	return exports;

}

const stationsModel = Model()
	.url('./data/hubway_stations.csv')
	.parse(d => ({
		id_short:d['Station Number'],
		id_long:d['Station ID'],
		docks:d['# of Docks'],
		lat:+d.Latitude,
		lng:+d.Longitude,
		name:d.Station,
		code3:d.Station?d.Station.split(' ').map(str => str[0]).slice(0,3).join(''):'N/A'
	}));

const tripsModel = Model()
	.url('./data/hubway_trips_reduced.csv')
	.parse(d => {
		const t0 = new Date(d.start_date);
		const t1 = new Date(d.end_date);

		return {
			duration:+d.duration,
			t0,
			t1,
			station0:d.strt_statn,
			station1:d.end_statn,
			bike:d.bike_nr,
			t0_of_day:t0.getHours() + t0.getMinutes()/60,
			t1_of_day:t1.getHours() + t1.getMinutes()/60
		}
	});

export default Model;
export {stationsModel, tripsModel};
