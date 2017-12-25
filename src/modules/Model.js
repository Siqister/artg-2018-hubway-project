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

	exports.fetch = function(){
		_dispatch.call('fetch:start');

		return new Promise((resolve,reject) => {
			csv(_url, _parse, (err,data) => {
				if(err){ reject(err); }
				else{ resolve(data); }
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
	}

	exports.on = function(...args){
		_dispatch.on.apply(_dispatch,args);
		return this;
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
		name:+d.Station
	}));

const tripsModel = Model()
	.url('./data/hubway_trips_reduced.csv')
	.parse(d => ({
		duration:+d.duration,
		t0:new Date(d.start_date),
		t1:new Date(d.end_date),
		station0:d.strt_statn,
		station1:d.end_statn,
		bike:d.bike_nr
	}));

export default Model;
export {stationsModel, tripsModel};
