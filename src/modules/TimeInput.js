import {select} from 'd3';

function TimeInput(_){

	let _t0 = new Date(2000,0,1),
		_t1 = new Date(3000,0,1);

	//Node selections
	let dateInput;
	let timeInput;

	function exports(date){
		const root = select(_ || this);
		const dateStr = date.toISOString().split('T')[0];
		const timeStr = date.toISOString().split('T')[1];

		//Build DOM
		root.classed('time-input',true)
			.html('');

		dateInput = root.selectAll('.date-input')
			.data([date]);
		dateInput = dateInput.enter()
			.append('input')
			.attr('class','date-input')
			.property('type','date');
		dateInput.node().value = dateStr;
			// .attr('defaultValue', dateStr)
			// .on('change', function(){
			// 	console.log(this.value);
			// });
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

export default TimeInput;