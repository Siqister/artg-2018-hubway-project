import {select} from 'd3';

function TimeInput(_){

	let _t0 = new Date(2000,0,1),
		_t1 = new Date(3000,0,1);

	//Node selections
	let glyph;
	let readout;
	let dateInput;
	let timeInput;

	//callback
	let _onInputCb;

	function exports(date){
		const root = select(_ || this);
		const dateStr = date.toISOString().split('T')[0];
		const timeStr = date.toISOString().split('T')[1].split(':').slice(0,2).join(':');

		//Build DOM
		root.classed('time-input',true);

		//Glyph
		glyph = root.selectAll('.glyphicon')
			.data([date]);
		glyph = glyph.enter().append('span')
			.attr('class','glyphicon glyphicon-time')
			.merge(glyph)
			.style('margin','-3px 5px 0px')
			.style('vertical-align','middle')

		//Readout
		readout = root.selectAll('.readout')
			.data([date]);
		readout = readout.enter().append('span')
			.attr('class','readout')
			.merge(readout);
		readout.html(date.toUTCString()); //this value is updated by animation

		//Date input
		dateInput = root.selectAll('.date-input')
			.data([date]);
		dateInput = dateInput.enter()
			.append('input')
			.attr('class','date-input')
			.property('type','date')
			.style('display','none')
			.on('change',onInputChange);
		dateInput.node().value = dateStr;

		//Time input
		timeInput = root.selectAll('.time-input')
			.data([date]);
		timeInput = timeInput.enter()
			.append('input')
			.attr('class','time-input')
			.property('type','time')
			.style('display','none')
			.on('change',onInputChange);
		timeInput.node().value = timeStr;

		//Mouseenter and mouseout
		root
			.on('mouseenter', () => {
				readout.style('display','none');

				//Because the readout value is dynamically updated, read current time off of readout
				const currentTime = new Date(readout.html());
				const dateStr = currentTime.toISOString().split('T')[0];
				const timeStr = currentTime.toISOString().split('T')[1].split(':').slice(0,2).join(':');
				
				dateInput.node().value = dateStr;
				timeInput.node().value = timeStr;
				dateInput.style('display','inline');
				timeInput.style('display','inline');
			})
			.on('mouseleave', () => {
				readout.style('display','inline');
				dateInput.style('display','none');
				timeInput.style('display','none');
			});
	}

	function onInputChange(){

		const inputTime = new Date(`${dateInput.node().value}T${timeInput.node().value}:00.000Z`);
		_onInputCb(inputTime);

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

	exports.onInput = function(cb){
		if(typeof(cb) === 'undefined') return _onInputCb;
		_onInputCb = cb;
		return this;
	}

	return exports;

}

export default TimeInput;