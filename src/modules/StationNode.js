import {select, min, max} from 'd3';
import Timeline from './Timeline';

export default function StationNode(_){

	let _w, _h;
	let _domain;
	let _timeline = Timeline();

	function exports(data){

		const rootDOM = _ || this;

		_w = rootDOM.clientWidth;
		_h = rootDOM.clientHeight - 30;

		//Update internal variables
		_domain = _domain || [min(data, d => d.t0), max(data, d => d.t1)];
		_timeline
			.width(_w)
			.height(_h)
			.margin({t:30,b:10})
			.domain(_domain)
			.range([0,100])
			.value(d => d.t0);

		//Build / update DOM
		const timeline = select(rootDOM)
			.style('position','relative')
			.selectAll('.timeline')
			.data([data.values]);
		const timelineEnter = timeline.enter().append('svg')
			.attr('class','timeline')
			.style('position','absolute')
			.style('bottom',0);
		timelineEnter.append('g');
		timelineEnter
			.merge(timeline)
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

	return exports;

}