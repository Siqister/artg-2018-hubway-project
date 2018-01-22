import {select, dispatch} from 'd3';
import TimeInput from './TimeInput';

function TimeRangeSelection(dom){

	const _defaultRange = [new Date(2000,0,1), new Date(3000,0,1)];

	//Modules
	const timeInput0 = TimeInput().format({showTime:false});
	const timeInput1 = TimeInput().format({showTime:false});
	
	//Internal data state
	let range = _defaultRange.slice();

	//Internal dispatch
	const _dispatch = dispatch('range:update');

	function exports(data){
		const [t0,t1] = data || _defaultRange;

		//Build/update DOM
		let timeInput0Node = select(dom)
			.selectAll('.time-input-0')
			.data([t0]);
		timeInput0Node = timeInput0Node.enter()
			.append('div')
			.attr('class','time-input-0')
			.merge(timeInput0Node)
			.each(timeInput0);

		let timeInput1Node = select(dom)
			.selectAll('.time-input-1')
			.data([t1]);
		timeInput1Node = timeInput1Node.enter()
			.append('div')
			.attr('class','time-input-1')
			.merge(timeInput1Node)
			.each(timeInput1);

		//Module callback
		timeInput0.onInput(date => {
			range[0] = date;
			_dispatch.call('range:update', null, range);
		});
		timeInput1.onInput(date => {
			range[1] = date;
			_dispatch.call('range:update', null, range);
		})

	}

	exports.on = function(...args){
		_dispatch.on.apply(_dispatch,args);
		return this;
	}

	return exports;

}

export default TimeRangeSelection(document.getElementById('time-range-selection'));