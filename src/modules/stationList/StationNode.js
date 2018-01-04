import {select, min, max} from 'd3';
import Timeline from '../Timeline';
import TripBalanceGraph from '../TripBalanceGraph';

export default function StationNode(_){

	let _w, _h;
	let _domain;
	let _mode;
	let _timeline = Timeline();
	let _tripBalanceGraph = TripBalanceGraph();

	function exports(data){

		const rootDOM = _ || this;

		_w = rootDOM.clientWidth;
		_h = rootDOM.clientHeight - 30;

		//Update internal variables
		_domain = _domain || [min(data, d => d.t0), max(data, d => d.t1)];

		//Calculate the number of days in operation
		// == overlap between _domain and [min(data, d => d.t0), max(data, d => d.t1)]
		
		//Update module config
		_timeline
			.width(_w)
			.height(_h)
			.margin({t:10,b:10,l:20})
			.domain(_domain)
			.range([0,100])
			.value(d => d.t0);
		_tripBalanceGraph
			.width(_w)
			.height(_h)
			.margin({t:5,b:5})
			.domain([0,10000])
			.origin(data.key);

		//Build / update DOM
		const vizInner = select(rootDOM)
			.style('position','relative')
			.selectAll('.viz-inner')
			.data([data.values]);
		const vizInnerEnter = vizInner.enter().append('svg')
			.attr('class','viz-inner')
			.style('position','absolute')
			.style('bottom',0);
		vizInnerEnter.append('g');
		vizInnerEnter
			.merge(vizInner)
			.attr('width',_w)
			.attr('height',_h)
			.select('g')
			.each(_timeline);

		const anno = select(rootDOM)
			.selectAll('.anno')
			.data([data]);
		const annoEnter = anno.enter().append('div')
			.attr('class','anno');
		annoEnter.append('span').attr('class','stn-id');
		annoEnter.append('span').attr('class','stn-name')
		const annoMerge = annoEnter.merge(anno)
			.style('padding','10px 10px');
		annoMerge
			.select('.stn-id')
			.html(d => d.key)
		annoMerge
			.select('.stn-name')
			.html(d => {
				if(d.stationName){
					return d.stationName.split(' ').map(str => str[0]).slice(0,3).join('');
				}
			});
	}

	exports.domain = function(_){
		if(typeof(_)==='undefined') return _domain;
		_domain = _;
		return this;
	}

	exports.mode = function(_){
		if(typeof(_)==='undefined') return _mode;
		_mode = _;
		return this;
	}

	return exports;

}