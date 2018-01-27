import {select} from 'd3';

function TimeInput(_){

	//Internal data state
	let t;

	//Default range of permitted values
	let _t0 = new Date(2000,0,1),
		_t1 = new Date(3000,0,1);

	//Options
	let showDate = true;
	let showTime = true;
	let dateToStr = date => Date.prototype.toUTCString.call(date);

	//Node selections
	let glyph;
	let readout;
	let dateInput;
	let timeInput;

	//callback
	let _onInputCb;

	function exports(date){

		t = date;

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
		readout.html(dateToStr(date)); //this value is updated by animation

		//Date input
		dateInput = root.selectAll('.input-date')
			.data([date]);
		dateInput = dateInput.enter()
			.append('input')
			.attr('class','input-date')
			.property('type','date')
			.style('display','none')
			.attr('value',dateStr)
			.on('change',onInputChange)
			.merge(dateInput);

		//Time input
		timeInput = root.selectAll('.input-time')
			.data(showTime?[date]:[]);
		timeInput.exit().remove();
		timeInput = timeInput.enter()
			.append('input')
			.attr('class','input-time')
			.attr('value', timeStr)
			.property('type','time')
			.style('display','none')
			.on('change',onInputChange)
			.merge(timeInput);

		//Mouseenter and mouseout
		root
			.on('mouseenter', () => {
				readout.style('display','none');
				root.style('background','rgb(0,0,200)');

				//Because the readout value is dynamically updated, read current time off of readout
				const currentTime = new Date(readout.html());
				const dateStr = currentTime.toISOString().split('T')[0];
				const timeStr = currentTime.toISOString().split('T')[1].split(':').slice(0,2).join(':');
				
				dateInput.node().value = dateStr;
				dateInput.style('display','inline');
				if(showTime){
					timeInput.node().value = timeStr;
					timeInput.style('display','inline');
				}
			})
			.on('mouseleave', () => {
				readout.style('display','inline');
				root.style('background', null);
				dateInput.style('display','none');
				if(showTime){
					timeInput.style('display','none');
				}
			});
	}

	function onInputChange(){

		const inputTime = new Date(`${dateInput.node().value}T${showTime?timeInput.node().value:'00:00'}:00.000Z`);
		
		//Validate inputTime
		if(inputTime.valueOf()) t = inputTime;

		_onInputCb(t);

	}

	exports.t0 = function(_){
		if(typeof(_) === 'undefined') return _t0;
		_t0 = _;
		return this;
	}

	exports.t1 = function(_){
		if(typeof(_) === 'undefined') return _t1;
		_t1 = _;
		return this;
	}

	exports.onInput = function(cb){
		if(typeof(cb) === 'undefined') return _onInputCb;
		_onInputCb = cb;
		return this;
	}

	exports.format = function(_){
		if(typeof(_) === 'undefined'){
			return {showDate, showTime};
		}else{
			const {showDate:d, showTime:t} = _;
			showDate = typeof(d) === 'boolean'? d : showDate;
			showTime = typeof(t) === 'boolean'? t : showTime;
			dateToStr = showTime?
				date => Date.prototype.toUTCString.call(date):
				date => Date.prototype.toISOString.call(date).split('T')[0];
			return this;
		}
	}

	return exports;

}

export default TimeInput;