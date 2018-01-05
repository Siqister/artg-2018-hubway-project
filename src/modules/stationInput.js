import {select} from 'd3';
import Typeahead from 'typeahead';

function StationInput(_){

	//Build DOM only once
	const _anno = select(_)
		.style('position','relative')
		.append('span').attr('class','anno');
	const _input = select(_)
		.append('span').attr('class','input-container')
		.append('input')
		.attr('type','text')
		.attr('placeholder','Select a station to start');
	const _status = select(_).append('span').attr('class','status');
	let _ta; //typeahead

	//Internal state
	let _currentStation;

	function exports(data){

		if(!_ta){
			_ta = Typeahead(_input.node(), {
				source:data.map(d => d.name)
			});

			_input.node()
				.addEventListener('change',e => {
					//validate station id and make request
					const _result = data.filter(d => d.name === e.target.value);
					//validation
					if(_result.length>0){
						_currentStation = _result;	
					}
					//validation success
					redraw();
				});

			_input.on('focus',()=>{
				select(_)
					.transition()
					.style('margin-left',`-${_anno.node().clientWidth}px`);
			});
		}

		redraw();

	}

	function redraw(){

		const stnId = _anno
			.selectAll('.stn-id')
			.data(_currentStation || []);
		stnId.enter().insert('span','.stn-name')
			.attr('class','stn-id')
			.merge(stnId)
			.html(d => d.id_short)
			.call(() => {
				select(_).style('margin-left',0);
			});
		stnId.exit().remove();

		const stnName = _anno
			.selectAll('.stn-name')
			.data(_currentStation ? _currentStation.map(d => d.code3) : ['All']);
		stnName.exit().remove();
		stnName.enter().append('span')
			.attr('class','stn-name')
			.merge(stnName)
			.html(d => d);

		_input.node().value = _currentStation ? _currentStation[0].name : '';

	}

	return exports;

}

export default StationInput(document.getElementById('station-search'));