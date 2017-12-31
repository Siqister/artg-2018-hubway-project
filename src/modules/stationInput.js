import {select} from 'd3';
import Typeahead from 'typeahead';

function StationInput(_){

	let _ta;

	function exports(data){

		const rootDom = _ || this;

		if(!_ta){
			_ta = Typeahead(rootDom.querySelector('input'), {
				source:data.map(d => d.name)
			});

			rootDom.querySelector('input')
				.addEventListener('change',e => {
					//validate station id and make request
				});
		}

	}

	return exports;

}

export default StationInput(document.getElementById('station-search'));