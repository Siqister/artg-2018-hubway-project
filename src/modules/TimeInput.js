import {select} from 'd3';

function TimeInput(_){

	let _t0 = new Date(2000,0,1),
		_t1 = new Date(3000,0,1);

	function exports(data){
		
	}

	exports.t0 = function(_){
		if(typeof(_) === 'undefined') return _t0;
		_t0 = _;
		return this;
	}

	exports.t1 = function(_){
		if(typeof(_) === 'undefined') return _t0;
		_t1 = _;
		return this;
	}

	return exports;

}